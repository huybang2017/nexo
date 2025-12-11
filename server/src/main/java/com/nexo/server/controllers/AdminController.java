package com.nexo.server.controllers;

import com.nexo.server.dto.common.ApiResponse;
import com.nexo.server.dto.common.PageResponse;
import com.nexo.server.dto.loan.LoanResponse;
import com.nexo.server.dto.loan.LoanReviewRequest;
import com.nexo.server.dto.user.UserResponse;
import com.nexo.server.dto.wallet.TransactionResponse;
import com.nexo.server.enums.*;
import com.nexo.server.repositories.*;
import com.nexo.server.security.CurrentUser;
import com.nexo.server.security.UserPrincipal;
import com.nexo.server.services.LoanService;
import com.nexo.server.services.UserMapper;
import com.nexo.server.services.WalletService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
@Tag(name = "Admin", description = "Admin management endpoints")
@Slf4j
public class AdminController {

    private final UserRepository userRepository;
    private final LoanRepository loanRepository;
    private final KycProfileRepository kycProfileRepository;
    private final com.nexo.server.repositories.KycDocumentRepository kycDocumentRepository;
    private final TransactionRepository transactionRepository;
    private final TicketRepository ticketRepository;
    private final LoanService loanService;
    private final WalletService walletService;
    private final UserMapper userMapper;

    @GetMapping("/dashboard/stats")
    @Operation(summary = "Get dashboard statistics")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getDashboardStats() {
        Map<String, Object> stats = new HashMap<>();

        // User stats
        Map<String, Object> userStats = new HashMap<>();
        userStats.put("total", userRepository.count());
        userStats.put("borrowers", userRepository.countByRole(UserRole.BORROWER));
        userStats.put("lenders", userRepository.countByRole(UserRole.LENDER));
        userStats.put("active", userRepository.countByStatus(UserStatus.ACTIVE));
        stats.put("users", userStats);

        // KYC stats
        Map<String, Object> kycStats = new HashMap<>();
        kycStats.put("pending", kycProfileRepository.countByStatus(KycStatus.PENDING));
        kycStats.put("approved", kycProfileRepository.countByStatus(KycStatus.APPROVED));
        kycStats.put("rejected", kycProfileRepository.countByStatus(KycStatus.REJECTED));
        stats.put("kyc", kycStats);

        // Loan stats
        Map<String, Object> loanStats = new HashMap<>();
        loanStats.put("pending", loanRepository.countByStatus(LoanStatus.PENDING_REVIEW));
        loanStats.put("funding", loanRepository.countByStatus(LoanStatus.FUNDING));
        loanStats.put("active", loanRepository.countByStatus(LoanStatus.ACTIVE));
        loanStats.put("completed", loanRepository.countByStatus(LoanStatus.COMPLETED));
        BigDecimal totalVolume = loanRepository.sumRequestedAmountByStatusIn(
                List.of(LoanStatus.ACTIVE, LoanStatus.COMPLETED, LoanStatus.REPAYING));
        loanStats.put("totalVolume", totalVolume != null ? totalVolume : BigDecimal.ZERO);
        stats.put("loans", loanStats);

        // Support stats
        Map<String, Object> supportStats = new HashMap<>();
        supportStats.put("openTickets", ticketRepository.countByStatus(TicketStatus.OPEN));
        supportStats.put("inProgress", ticketRepository.countByStatus(TicketStatus.IN_PROGRESS));
        stats.put("support", supportStats);

        return ResponseEntity.ok(ApiResponse.success(stats));
    }

    @GetMapping("/users")
    @Operation(summary = "Get all users")
    public ResponseEntity<ApiResponse<PageResponse<UserResponse>>> getUsers(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) UserRole role,
            @RequestParam(required = false) UserStatus status,
            @PageableDefault(sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        
        Page<com.nexo.server.entities.User> users = userRepository.searchUsers(search, role, status, pageable);
        PageResponse<UserResponse> response = PageResponse.of(users, 
                users.getContent().stream().map(userMapper::toResponse).toList());
        
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/users/{id}")
    @Operation(summary = "Get user by ID")
    public ResponseEntity<ApiResponse<UserResponse>> getUserById(@PathVariable Long id) {
        com.nexo.server.entities.User user = userRepository.findById(id)
                .orElseThrow(() -> new com.nexo.server.exceptions.ResourceNotFoundException("User", id));
        return ResponseEntity.ok(ApiResponse.success(userMapper.toResponse(user)));
    }

    @PutMapping("/users/{id}/status")
    @Operation(summary = "Update user status")
    public ResponseEntity<ApiResponse<UserResponse>> updateUserStatus(
            @PathVariable Long id,
            @RequestParam UserStatus status) {
        com.nexo.server.entities.User user = userRepository.findById(id)
                .orElseThrow(() -> new com.nexo.server.exceptions.ResourceNotFoundException("User", id));
        
        // Prevent banning admin users
        if (status == UserStatus.BANNED && user.getRole() == UserRole.ADMIN) {
            throw new com.nexo.server.exceptions.BadRequestException("Cannot ban admin users");
        }
        
        user.setStatus(status);
        userRepository.save(user);
        
        log.info("User {} status updated to {} by admin", id, status);
        
        return ResponseEntity.ok(ApiResponse.success("User status updated", userMapper.toResponse(user)));
    }

    @PostMapping("/users/{id}/ban")
    @Operation(summary = "Ban user")
    public ResponseEntity<ApiResponse<UserResponse>> banUser(
            @PathVariable Long id,
            @RequestParam(required = false) String reason) {
        com.nexo.server.entities.User user = userRepository.findById(id)
                .orElseThrow(() -> new com.nexo.server.exceptions.ResourceNotFoundException("User", id));
        
        // Prevent banning admin users
        if (user.getRole() == UserRole.ADMIN) {
            throw new com.nexo.server.exceptions.BadRequestException("Cannot ban admin users");
        }
        
        user.setStatus(UserStatus.BANNED);
        userRepository.save(user);
        
        log.info("User {} banned by admin. Reason: {}", id, reason);
        
        return ResponseEntity.ok(ApiResponse.success("User banned successfully", userMapper.toResponse(user)));
    }

    @PostMapping("/users/{id}/unban")
    @Operation(summary = "Unban user")
    public ResponseEntity<ApiResponse<UserResponse>> unbanUser(@PathVariable Long id) {
        com.nexo.server.entities.User user = userRepository.findById(id)
                .orElseThrow(() -> new com.nexo.server.exceptions.ResourceNotFoundException("User", id));
        
        if (user.getStatus() != UserStatus.BANNED) {
            throw new com.nexo.server.exceptions.BadRequestException("User is not banned");
        }
        
        user.setStatus(UserStatus.ACTIVE);
        userRepository.save(user);
        
        log.info("User {} unbanned by admin", id);
        
        return ResponseEntity.ok(ApiResponse.success("User unbanned successfully", userMapper.toResponse(user)));
    }

    @GetMapping("/loans")
    @Operation(summary = "Get all loans")
    public ResponseEntity<ApiResponse<PageResponse<LoanResponse>>> getLoans(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) LoanStatus status,
            @RequestParam(required = false) LoanPurpose purpose,
            @PageableDefault(sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        
        // Get loans with pagination (without borrower to avoid Pageable issues)
        Page<com.nexo.server.entities.Loan> loans = loanRepository.searchLoans(search, status, purpose, pageable);
        
        // Fetch borrowers separately for the current page
        List<Long> loanIds = loans.getContent().stream().map(com.nexo.server.entities.Loan::getId).toList();
        List<com.nexo.server.entities.Loan> loansWithBorrowers = loanIds.isEmpty() 
            ? List.of() 
            : loanRepository.findByIdsWithBorrower(loanIds);
        
        // Create a map for quick lookup
        Map<Long, com.nexo.server.entities.Loan> loanMap = loansWithBorrowers.stream()
            .collect(Collectors.toMap(com.nexo.server.entities.Loan::getId, loan -> loan));
        
        // Replace loans with fetched versions that have borrowers
        List<com.nexo.server.entities.Loan> finalLoans = loans.getContent().stream()
            .map(loan -> loanMap.getOrDefault(loan.getId(), loan))
            .toList();
        
        // Map loans to responses
        PageResponse<LoanResponse> response = PageResponse.of(loans,
                finalLoans.stream().map(loan -> loanService.toLoanResponse(loan)).toList());
        
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/loans/{id}")
    @Operation(summary = "Get loan by ID")
    public ResponseEntity<ApiResponse<LoanResponse>> getLoanById(@PathVariable Long id) {
        com.nexo.server.entities.Loan loan = loanRepository.findByIdWithBorrower(id)
                .orElseThrow(() -> new com.nexo.server.exceptions.ResourceNotFoundException("Loan", id));
        LoanResponse response = loanService.toLoanResponse(loan);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PostMapping("/loans/{id}/review")
    @Operation(summary = "Review loan request")
    public ResponseEntity<ApiResponse<LoanResponse>> reviewLoan(
            @CurrentUser UserPrincipal admin,
            @PathVariable Long id,
            @Valid @RequestBody LoanReviewRequest request) {
        LoanResponse response = loanService.reviewLoan(id, admin.getId(), request);
        return ResponseEntity.ok(ApiResponse.success("Loan reviewed successfully", response));
    }

    @GetMapping("/withdrawals")
    @Operation(summary = "Get withdrawal requests")
    public ResponseEntity<ApiResponse<PageResponse<TransactionResponse>>> getWithdrawals(
            @RequestParam(required = false) TransactionStatus status,
            @PageableDefault(sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<com.nexo.server.entities.Transaction> transactions;
        if (status != null) {
            transactions = transactionRepository.findByTypeAndStatusWithUser(
                    TransactionType.WITHDRAW, status, pageable);
        } else {
            transactions = transactionRepository.findByTypeWithUser(
                    TransactionType.WITHDRAW, pageable);
        }
        PageResponse<TransactionResponse> response = PageResponse.of(transactions,
                transactions.getContent().stream()
                        .map(walletService::toTransactionResponse)
                        .toList());
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PostMapping("/withdrawals/{transactionId}/approve")
    @Operation(summary = "Approve withdrawal request")
    public ResponseEntity<ApiResponse<Void>> approveWithdrawal(@PathVariable Long transactionId) {
        walletService.processWithdrawal(transactionId, true, null);
        return ResponseEntity.ok(ApiResponse.success("Withdrawal approved"));
    }

    @PostMapping("/withdrawals/{transactionId}/reject")
    @Operation(summary = "Reject withdrawal request")
    public ResponseEntity<ApiResponse<Void>> rejectWithdrawal(
            @PathVariable Long transactionId,
            @RequestParam String reason) {
        walletService.processWithdrawal(transactionId, false, reason);
        return ResponseEntity.ok(ApiResponse.success("Withdrawal rejected"));
    }

    // ==================== KYC MANAGEMENT ====================

    @GetMapping("/kyc/pending")
    @Operation(summary = "Get pending KYC profiles")
    public ResponseEntity<ApiResponse<PageResponse<KycAdminResponse>>> getPendingKyc(
            @PageableDefault(sort = "submittedAt", direction = Sort.Direction.ASC) Pageable pageable) {
        Page<com.nexo.server.entities.KycProfile> profiles = kycProfileRepository.findByStatus(KycStatus.PENDING, pageable);
        PageResponse<KycAdminResponse> response = PageResponse.of(profiles,
                profiles.getContent().stream().map(this::toKycAdminResponse).toList());
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/kyc")
    @Operation(summary = "Get all KYC profiles")
    public ResponseEntity<ApiResponse<PageResponse<KycAdminResponse>>> getAllKyc(
            @RequestParam(required = false) KycStatus status,
            @PageableDefault(sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<com.nexo.server.entities.KycProfile> profiles;
        if (status != null) {
            profiles = kycProfileRepository.findByStatus(status, pageable);
        } else {
            profiles = kycProfileRepository.findAll(pageable);
        }
        PageResponse<KycAdminResponse> response = PageResponse.of(profiles,
                profiles.getContent().stream().map(this::toKycAdminResponse).toList());
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/kyc/{id}")
    @Operation(summary = "Get KYC profile by ID")
    public ResponseEntity<ApiResponse<KycAdminResponse>> getKycById(@PathVariable Long id) {
        com.nexo.server.entities.KycProfile profile = kycProfileRepository.findById(id)
                .orElseThrow(() -> new com.nexo.server.exceptions.ResourceNotFoundException("KYC Profile", id));
        return ResponseEntity.ok(ApiResponse.success(toKycAdminResponse(profile)));
    }

    @PostMapping("/kyc/{id}/review")
    @Operation(summary = "Review KYC profile")
    public ResponseEntity<ApiResponse<KycAdminResponse>> reviewKyc(
            @CurrentUser UserPrincipal admin,
            @PathVariable Long id,
            @Valid @RequestBody KycReviewRequest request) {
        com.nexo.server.entities.KycProfile profile = kycProfileRepository.findById(id)
                .orElseThrow(() -> new com.nexo.server.exceptions.ResourceNotFoundException("KYC Profile", id));
        
        if (request.getAction() == KycReviewRequest.ReviewAction.APPROVE) {
            profile.setStatus(KycStatus.APPROVED);
            profile.getUser().setKycStatus(KycStatus.APPROVED);
        } else {
            profile.setStatus(KycStatus.REJECTED);
            profile.setRejectionReason(request.getRejectionReason());
            profile.getUser().setKycStatus(KycStatus.REJECTED);
        }
        com.nexo.server.entities.User adminUser = userRepository.findById(admin.getId())
                .orElseThrow(() -> new com.nexo.server.exceptions.ResourceNotFoundException("User", admin.getId()));
        profile.setReviewedBy(adminUser);
        profile.setReviewedAt(java.time.LocalDateTime.now());
        
        kycProfileRepository.save(profile);
        userRepository.save(profile.getUser());
        
        return ResponseEntity.ok(ApiResponse.success(
                request.getAction() == KycReviewRequest.ReviewAction.APPROVE ? "KYC approved" : "KYC rejected",
                toKycAdminResponse(profile)));
    }

    private KycAdminResponse toKycAdminResponse(com.nexo.server.entities.KycProfile profile) {
        // Fetch documents (lazy loading)
        List<com.nexo.server.entities.KycDocument> docEntities = kycDocumentRepository.findByKycProfileId(profile.getId());
        
        // Map documents
        List<com.nexo.server.dto.kyc.KycDocumentResponse> documents = docEntities.stream()
                .map(doc -> com.nexo.server.dto.kyc.KycDocumentResponse.builder()
                        .id(doc.getId())
                        .documentType(doc.getDocumentType())
                        .fileName(doc.getFileName())
                        .fileUrl("/api/files/" + doc.getFilePath())
                        .fileSize(doc.getFileSize())
                        .createdAt(doc.getCreatedAt())
                        .build())
                .collect(java.util.stream.Collectors.toList());

        return KycAdminResponse.builder()
                .id(profile.getId())
                .userId(profile.getUser().getId())
                .userEmail(profile.getUser().getEmail())
                .userName(profile.getUser().getFullName())
                .status(profile.getStatus())
                .fullName(profile.getFullName())
                .idCardNumber(profile.getIdCardNumber())
                .dateOfBirth(profile.getDateOfBirth())
                .address(profile.getAddress())
                .city(profile.getCity())
                .district(profile.getDistrict())
                .ward(profile.getWard())
                .gender(profile.getGender())
                .idCardIssuedDate(profile.getIdCardIssuedDate())
                .idCardIssuedPlace(profile.getIdCardIssuedPlace())
                .idCardExpiryDate(profile.getIdCardExpiryDate())
                .occupation(profile.getOccupation())
                .employerName(profile.getEmployerName())
                .monthlyIncome(profile.getMonthlyIncome())
                .bankName(profile.getBankName())
                .bankAccountNumber(profile.getBankAccountNumber())
                .bankAccountHolder(profile.getBankAccountHolder())
                .bankBranch(profile.getBankBranch())
                .documents(documents)
                .submittedAt(profile.getSubmittedAt())
                .reviewedAt(profile.getReviewedAt())
                .rejectionReason(profile.getRejectionReason())
                .build();
    }

    @lombok.Data
    @lombok.Builder
    @lombok.NoArgsConstructor
    @lombok.AllArgsConstructor
    public static class KycAdminResponse {
        private Long id;
        private Long userId;
        private String userEmail;
        private String userName;
        private KycStatus status;
        private String fullName;
        private String idCardNumber;
        private java.time.LocalDate dateOfBirth;
        private java.time.LocalDate idCardIssuedDate;
        private String idCardIssuedPlace;
        private java.time.LocalDate idCardExpiryDate;
        private String gender;
        private String address;
        private String city;
        private String district;
        private String ward;
        private String occupation;
        private String employerName;
        private java.math.BigDecimal monthlyIncome;
        private String bankName;
        private String bankAccountNumber;
        private String bankAccountHolder;
        private String bankBranch;
        private java.util.List<com.nexo.server.dto.kyc.KycDocumentResponse> documents;
        private java.time.LocalDateTime submittedAt;
        private java.time.LocalDateTime reviewedAt;
        private String rejectionReason;
    }

    @lombok.Data
    @lombok.NoArgsConstructor
    @lombok.AllArgsConstructor
    public static class KycReviewRequest {
        public enum ReviewAction { APPROVE, REJECT }
        
        @jakarta.validation.constraints.NotNull(message = "Action is required")
        private ReviewAction action;
        
        private String rejectionReason;
    }
}

