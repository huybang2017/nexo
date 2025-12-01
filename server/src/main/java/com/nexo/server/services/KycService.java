package com.nexo.server.services;

import com.nexo.server.dto.kyc.KycDocumentResponse;
import com.nexo.server.dto.kyc.KycProfileResponse;
import com.nexo.server.dto.kyc.KycReviewRequest;
import com.nexo.server.dto.kyc.KycSubmitRequest;
import com.nexo.server.dto.kycscore.DuplicateCheckResponse;
import com.nexo.server.dto.kycscore.KycScoreResponse;
import com.nexo.server.entities.KycDocument;
import com.nexo.server.entities.KycProfile;
import com.nexo.server.entities.User;
import com.nexo.server.enums.KycDocumentType;
import com.nexo.server.enums.KycRiskLevel;
import com.nexo.server.enums.KycStatus;
import com.nexo.server.exceptions.BadRequestException;
import com.nexo.server.exceptions.BusinessException;
import com.nexo.server.exceptions.ResourceNotFoundException;
import com.nexo.server.repositories.KycDocumentRepository;
import com.nexo.server.repositories.KycProfileRepository;
import com.nexo.server.repositories.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Lazy;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class KycService {

    private final KycProfileRepository kycProfileRepository;
    private final KycDocumentRepository kycDocumentRepository;
    private final UserRepository userRepository;
    private final FileStorageService fileStorageService;
    private final NotificationService notificationService;
    private final EmailService emailService;
    private final CreditScoreService creditScoreService;
    @Lazy
    private final KycScoringService kycScoringService;

    /**
     * Get KYC profile by user ID
     */
    public KycProfileResponse getKycProfile(Long userId) {
        KycProfile profile = kycProfileRepository.findByUserId(userId).orElse(null);
        if (profile == null) {
            return KycProfileResponse.builder()
                    .status(KycStatus.NOT_SUBMITTED)
                    .documents(List.of())
                    .build();
        }
        return mapToResponse(profile);
    }

    /**
     * Submit KYC profile
     */
    @Transactional
    public KycProfileResponse submitKyc(Long userId, KycSubmitRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        // Check if email is verified
        if (!Boolean.TRUE.equals(user.getEmailVerified())) {
            throw new BadRequestException("Please verify your email before submitting KYC");
        }

        // Check if already submitted
        if (user.getKycStatus() == KycStatus.PENDING || user.getKycStatus() == KycStatus.APPROVED) {
            throw new BadRequestException("KYC already submitted or approved");
        }

        // Check for duplicate ID card number BEFORE saving
        if (request.getIdCardNumber() != null && !request.getIdCardNumber().isEmpty()) {
            List<KycProfile> existingProfiles = kycProfileRepository.findByIdCardNumber(request.getIdCardNumber());
            for (KycProfile existing : existingProfiles) {
                if (!existing.getUser().getId().equals(userId)) {
                    log.warn("Duplicate ID card detected: {} for user {}", request.getIdCardNumber(), userId);
                    throw new BadRequestException("This ID card number is already registered in the system. " +
                            "If you believe this is an error, please contact support.");
                }
            }
        }

        // Create or update KYC profile
        KycProfile profile = kycProfileRepository.findByUserId(userId)
                .orElse(new KycProfile());

        profile.setUser(user);
        profile.setFullName(request.getFullName());
        profile.setDateOfBirth(request.getDateOfBirth());
        profile.setGender(request.getGender());
        profile.setIdCardNumber(request.getIdCardNumber());
        profile.setIdCardIssuedDate(request.getIdCardIssuedDate());
        profile.setIdCardExpiryDate(request.getIdCardExpiryDate());
        profile.setIdCardIssuedPlace(request.getIdCardIssuedPlace());
        profile.setAddress(request.getAddress());
        profile.setDistrict(request.getDistrict());
        profile.setCity(request.getCity());
        profile.setWard(request.getWard());
        profile.setOccupation(request.getOccupation());
        profile.setEmployerName(request.getEmployerName());
        profile.setMonthlyIncome(request.getMonthlyIncome());
        profile.setBankName(request.getBankName());
        profile.setBankAccountNumber(request.getBankAccountNumber());
        profile.setBankAccountHolder(request.getBankAccountHolder());
        profile.setBankBranch(request.getBankBranch());
        profile.setStatus(KycStatus.PENDING);
        profile.setSubmittedAt(LocalDateTime.now());

        kycProfileRepository.save(profile);

        // Update user KYC status
        user.setKycStatus(KycStatus.PENDING);
        userRepository.save(user);

        // Calculate KYC score asynchronously after submission
        try {
            KycScoreResponse kycScore = kycScoringService.calculateKycScore(profile.getId());
            log.info("KYC score calculated for user {}: {} (Risk: {})", 
                    userId, kycScore.getTotalScore(), kycScore.getRiskLevel());
            
            // Auto-reject if FRAUD detected
            if ("FRAUD".equals(kycScore.getRiskLevel())) {
                profile.setStatus(KycStatus.REJECTED);
                profile.setRejectionReason("Automatic rejection: Duplicate documents or fraud detected");
                profile.setReviewedAt(LocalDateTime.now());
                kycProfileRepository.save(profile);
                
                user.setKycStatus(KycStatus.REJECTED);
                userRepository.save(user);
                
                notificationService.createNotification(userId, "KYC", "KYC Rejected",
                        "Your KYC application has been automatically rejected due to duplicate or fraudulent documents.");
                
                log.warn("KYC auto-rejected for user {} due to fraud detection", userId);
            }
        } catch (Exception e) {
            log.error("Failed to calculate KYC score for user {}: {}", userId, e.getMessage());
        }

        log.info("KYC submitted for user {}", userId);

        return mapToResponse(profile);
    }

    /**
     * Upload KYC document
     */
    @Transactional
    public KycDocumentResponse uploadDocument(Long userId, MultipartFile file, KycDocumentType documentType) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        KycProfile profile = kycProfileRepository.findByUserId(userId)
                .orElseThrow(() -> new BadRequestException("Please submit KYC profile first"));

        // Check if document type already exists
        kycDocumentRepository.findByKycProfileIdAndDocumentType(profile.getId(), documentType)
                .ifPresent(doc -> {
                    // Delete old file
                    fileStorageService.deleteFile(doc.getFilePath());
                    kycDocumentRepository.delete(doc);
                });

        // Store new file
        String filePath = fileStorageService.storeKycDocument(file, userId, documentType.name());

        // Create document record
        KycDocument document = KycDocument.builder()
                .kycProfile(profile)
                .documentType(documentType)
                .fileName(file.getOriginalFilename())
                .filePath(filePath)
                .fileSize(file.getSize())
                .mimeType(file.getContentType())
                .build();

        kycDocumentRepository.save(document);

        log.info("KYC document {} uploaded for user {}", documentType, userId);

        return mapToDocumentResponse(document);
    }

    /**
     * Get pending KYC profiles (Admin)
     */
    public Page<KycProfileResponse> getPendingKyc(Pageable pageable) {
        return kycProfileRepository.findByStatus(KycStatus.PENDING, pageable)
                .map(this::mapToResponse);
    }

    /**
     * Get all KYC profiles (Admin)
     */
    public Page<KycProfileResponse> getAllKyc(KycStatus status, Pageable pageable) {
        if (status != null) {
            return kycProfileRepository.findByStatus(status, pageable)
                    .map(this::mapToResponse);
        }
        return kycProfileRepository.findAll(pageable)
                .map(this::mapToResponse);
    }

    /**
     * Get KYC profile by ID (Admin)
     */
    public KycProfileResponse getKycById(Long kycId) {
        KycProfile profile = kycProfileRepository.findById(kycId)
                .orElseThrow(() -> new ResourceNotFoundException("KYC profile not found"));
        return mapToResponse(profile);
    }

    /**
     * Review KYC (Admin)
     */
    @Transactional
    public KycProfileResponse reviewKyc(Long kycId, Long adminId, KycReviewRequest request) {
        KycProfile profile = kycProfileRepository.findById(kycId)
                .orElseThrow(() -> new ResourceNotFoundException("KYC profile not found"));

        User admin = userRepository.findById(adminId)
                .orElseThrow(() -> new ResourceNotFoundException("Admin not found"));

        if (profile.getStatus() != KycStatus.PENDING) {
            throw new BadRequestException("KYC is not in pending status");
        }

        // Update KYC profile
        boolean isApproved = request.getAction() == KycReviewRequest.ReviewAction.APPROVE;
        profile.setStatus(isApproved ? KycStatus.APPROVED : KycStatus.REJECTED);
        profile.setRejectionReason(isApproved ? null : request.getRejectionReason());
        profile.setReviewedBy(admin);
        profile.setReviewedAt(LocalDateTime.now());
        kycProfileRepository.save(profile);

        // Update user KYC status
        User user = profile.getUser();
        user.setKycStatus(profile.getStatus());
        userRepository.save(user);

        // Send notification
        String title = isApproved ? "KYC Approved" : "KYC Rejected";
        String message = isApproved 
                ? "Congratulations! Your KYC has been approved. You can now use all features."
                : "Your KYC has been rejected. Reason: " + request.getRejectionReason();

        notificationService.createNotification(user.getId(), "KYC", title, message);

        // Send email
        try {
            if (isApproved) {
                emailService.sendKycApprovedEmail(user.getEmail(), user.getFirstName());
            } else {
                emailService.sendKycRejectedEmail(user.getEmail(), user.getFirstName(), request.getRejectionReason());
            }
        } catch (Exception e) {
            log.error("Failed to send KYC email: {}", e.getMessage());
        }

        // Update credit score based on KYC result
        try {
            if (isApproved) {
                creditScoreService.onKycVerified(user.getId());
            } else {
                creditScoreService.onKycRejected(user.getId());
            }
        } catch (Exception e) {
            log.error("Failed to update credit score after KYC review: {}", e.getMessage());
        }

        log.info("KYC {} {} by admin {}", kycId, isApproved ? "approved" : "rejected", adminId);

        return mapToResponse(profile);
    }

    private KycProfileResponse mapToResponse(KycProfile profile) {
        List<KycDocumentResponse> documents = kycDocumentRepository.findByKycProfileId(profile.getId())
                .stream()
                .map(this::mapToDocumentResponse)
                .collect(Collectors.toList());

        return KycProfileResponse.builder()
                .id(profile.getId())
                .userId(profile.getUser().getId())
                .fullName(profile.getFullName())
                .dateOfBirth(profile.getDateOfBirth())
                .gender(profile.getGender())
                .idCardNumber(profile.getIdCardNumber())
                .idCardIssuedDate(profile.getIdCardIssuedDate())
                .idCardExpiryDate(profile.getIdCardExpiryDate())
                .idCardIssuedPlace(profile.getIdCardIssuedPlace())
                .address(profile.getAddress())
                .district(profile.getDistrict())
                .city(profile.getCity())
                .ward(profile.getWard())
                .occupation(profile.getOccupation())
                .employerName(profile.getEmployerName())
                .monthlyIncome(profile.getMonthlyIncome())
                .bankName(profile.getBankName())
                .bankAccountNumber(profile.getBankAccountNumber())
                .bankAccountHolder(profile.getBankAccountHolder())
                .status(profile.getStatus())
                .rejectionReason(profile.getRejectionReason())
                .submittedAt(profile.getSubmittedAt())
                .reviewedAt(profile.getReviewedAt())
                .documents(documents)
                .build();
    }

    private KycDocumentResponse mapToDocumentResponse(KycDocument document) {
        return KycDocumentResponse.builder()
                .id(document.getId())
                .documentType(document.getDocumentType())
                .fileName(document.getFileName())
                .fileUrl(fileStorageService.getFileUrl(document.getFilePath()))
                .fileSize(document.getFileSize())
                .verified(document.getVerified())
                .createdAt(document.getCreatedAt())
                .build();
    }
}

