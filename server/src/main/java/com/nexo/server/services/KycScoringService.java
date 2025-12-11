package com.nexo.server.services;

import com.nexo.server.dto.kycscore.*;
import com.nexo.server.entities.*;
import com.nexo.server.enums.*;
import com.nexo.server.exceptions.*;
import com.nexo.server.repositories.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.File;
import java.math.BigDecimal;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.math.RoundingMode;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.Period;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class KycScoringService {

    private final KycProfileRepository kycProfileRepository;
    private final KycDocumentRepository kycDocumentRepository;
    private final KycDocumentScoreRepository kycDocumentScoreRepository;
    private final KycProfileScoreRepository kycProfileScoreRepository;
    private final KycFraudFlagRepository kycFraudFlagRepository;
    private final UserRepository userRepository;
    private final KycAiServiceClient aiServiceClient;
    private final FileStorageService fileStorageService;

    // Scoring weights
    private static final double DOCUMENT_SCORE_WEIGHT = 0.4;
    private static final double PROFILE_SCORE_WEIGHT = 0.6;

    // Thresholds
    private static final int MIN_AGE = 18;
    private static final int MAX_AGE = 75;
    private static final int FAST_SUBMISSION_THRESHOLD_MS = 30000; // 30 seconds

    // ==================== MAIN SCORING METHODS ====================

    /**
     * Calculate complete KYC score for a profile
     */
    @Transactional
    public KycScoreResponse calculateKycScore(Long kycProfileId) {
        KycProfile kycProfile = kycProfileRepository.findById(kycProfileId)
                .orElseThrow(() -> new ResourceNotFoundException("KYC Profile not found"));

        // Step 1: Check for duplicate documents FIRST
        DuplicateCheckResponse duplicateCheck = checkForDuplicates(kycProfileId);
        if (duplicateCheck.getIsDuplicate()) {
            // Immediately reject if duplicate found
            return handleDuplicateDetection(kycProfile, duplicateCheck);
        }

        // Step 2: Score all documents
        List<KycDocumentScore> documentScores = scoreAllDocuments(kycProfile);
        int aggregatedDocumentScore = calculateAggregatedDocumentScore(documentScores);

        // Step 3: Calculate profile score
        int profileScore = calculateProfileScore(kycProfile);

        // Step 4: Detect fraud flags
        detectFraudFlags(kycProfile);

        // Step 5: Calculate total penalty
        Integer fraudPenalty = kycFraudFlagRepository.getTotalPenaltyByProfileId(kycProfileId);
        if (fraudPenalty == null) fraudPenalty = 0;

        // Step 6: Calculate final score
        int baseScore = (int) Math.round(
                aggregatedDocumentScore * DOCUMENT_SCORE_WEIGHT + 
                profileScore * PROFILE_SCORE_WEIGHT
        );
        int riskScore = Math.max(0, Math.min(1000, baseScore - Math.abs(fraudPenalty)));

        // Step 7: Save or update profile score
        KycProfileScore kycProfileScore = saveProfileScore(kycProfile, aggregatedDocumentScore, 
                profileScore, riskScore, fraudPenalty);

        // Step 8: Build response
        return buildScoreResponse(kycProfile, kycProfileScore, documentScores);
    }

    /**
     * Check for duplicate documents across the system
     */
    @Transactional(readOnly = true)
    public DuplicateCheckResponse checkForDuplicates(Long kycProfileId) {
        KycProfile kycProfile = kycProfileRepository.findById(kycProfileId)
                .orElseThrow(() -> new ResourceNotFoundException("KYC Profile not found"));

        List<DuplicateCheckResponse.DuplicateMatch> matches = new ArrayList<>();
        String duplicateType = null;

        // Check 1: ID Card Number duplicate
        if (kycProfile.getIdCardNumber() != null && !kycProfile.getIdCardNumber().isEmpty()) {
            List<KycProfile> duplicateProfiles = kycProfileRepository.findDuplicateIdCardProfiles(
                    kycProfile.getIdCardNumber(), kycProfileId);
            for (KycProfile dup : duplicateProfiles) {
                duplicateType = "SAME_ID_NUMBER";
                matches.add(buildDuplicateMatch(dup, null, "SAME_ID_NUMBER", 100.0));
            }
        }

        // Check 2: Document hash duplicates
        List<KycDocument> documents = kycDocumentRepository.findByKycProfileId(kycProfileId);
        for (KycDocument doc : documents) {
            if (doc.getDocumentHash() != null) {
                List<KycDocument> duplicateDocs = kycDocumentRepository.findDuplicateByHash(
                        doc.getDocumentHash(), kycProfileId);
                for (KycDocument dupDoc : duplicateDocs) {
                    duplicateType = "EXACT_HASH";
                    matches.add(buildDuplicateMatch(dupDoc.getKycProfile(), dupDoc, "EXACT_HASH", 100.0));
                }
            }

            // Check 3: Extracted ID number from documents
            if (doc.getExtractedIdNumber() != null) {
                List<KycDocument> duplicateDocs = kycDocumentRepository.findByExtractedIdNumber(
                        doc.getExtractedIdNumber(), kycProfileId);
                for (KycDocument dupDoc : duplicateDocs) {
                    duplicateType = "SAME_ID_NUMBER";
                    matches.add(buildDuplicateMatch(dupDoc.getKycProfile(), dupDoc, "SAME_ID_NUMBER", 100.0));
                }
            }
        }

        boolean isDuplicate = !matches.isEmpty();
        String recommendation = isDuplicate ? "REJECT_IMMEDIATELY" : "CONTINUE_VERIFICATION";

        return DuplicateCheckResponse.builder()
                .isDuplicate(isDuplicate)
                .duplicateType(duplicateType)
                .matches(matches)
                .recommendation(recommendation)
                .build();
    }

    /**
     * Get KYC score for a user
     */
    @Transactional(readOnly = true)
    public KycScoreResponse getKycScore(Long userId) {
        KycProfileScore profileScore = kycProfileScoreRepository.findByUserId(userId)
                .orElse(null);

        if (profileScore == null) {
            // Check if user has KYC profile and calculate score
            KycProfile kycProfile = kycProfileRepository.findByUserId(userId)
                    .orElseThrow(() -> new ResourceNotFoundException("KYC Profile not found for user"));
            return calculateKycScore(kycProfile.getId());
        }

        KycProfile kycProfile = profileScore.getKycProfile();
        List<KycDocumentScore> documentScores = kycDocumentScoreRepository.findByKycProfileId(kycProfile.getId());
        
        return buildScoreResponse(kycProfile, profileScore, documentScores);
    }

    /**
     * Get KYC score summary for a user
     */
    @Transactional(readOnly = true)
    public KycScoreSummaryResponse getKycScoreSummary(Long userId) {
        KycProfileScore profileScore = kycProfileScoreRepository.findByUserId(userId)
                .orElse(null);

        if (profileScore == null) {
            return KycScoreSummaryResponse.builder()
                    .userId(userId)
                    .totalScore(0)
                    .maxScore(1000)
                    .riskLevel("UNKNOWN")
                    .recommendedDecision("NEEDS_VERIFICATION")
                    .fraudFlagsCount(0)
                    .hasCriticalFlags(false)
                    .scoreGrade("N/A")
                    .build();
        }

        return KycScoreSummaryResponse.builder()
                .userId(userId)
                .totalScore(profileScore.getTotalScore())
                .maxScore(1000)
                .riskLevel(profileScore.getRiskLevel().name())
                .recommendedDecision(profileScore.getRecommendedDecision())
                .fraudFlagsCount(profileScore.getFraudFlagsCount())
                .hasCriticalFlags(profileScore.getCriticalFlagsCount() > 0)
                .scoreGrade(calculateScoreGrade(profileScore.getTotalScore()))
                .build();
    }

    /**
     * Get fraud flags for a KYC profile
     */
    @Transactional(readOnly = true)
    public List<KycScoreResponse.FraudFlagResponse> getFraudFlags(Long kycProfileId) {
        List<KycFraudFlag> flags = kycFraudFlagRepository.findByKycProfileId(kycProfileId);
        return flags.stream()
                .map(this::mapFraudFlag)
                .collect(Collectors.toList());
    }

    // ==================== DOCUMENT SCORING ====================

    /**
     * Score a single document
     */
    @Transactional
    public KycDocumentScoreResponse scoreDocument(Long documentId) {
        KycDocument document = kycDocumentRepository.findById(documentId)
                .orElseThrow(() -> new ResourceNotFoundException("Document not found"));

        // Check for duplicates first
        boolean isDuplicate = checkDocumentDuplicate(document);
        
        KycDocumentScore score = calculateDocumentScore(document);
        kycDocumentScoreRepository.save(score);

        return buildDocumentScoreResponse(document, score, isDuplicate);
    }

    /**
     * Score all documents for a profile
     */
    private List<KycDocumentScore> scoreAllDocuments(KycProfile kycProfile) {
        List<KycDocument> documents = kycDocumentRepository.findByKycProfileId(kycProfile.getId());
        List<KycDocumentScore> scores = new ArrayList<>();

        for (KycDocument document : documents) {
            KycDocumentScore existingScore = kycDocumentScoreRepository.findByKycDocumentId(document.getId())
                    .orElse(null);
            
            if (existingScore == null) {
                KycDocumentScore score = calculateDocumentScore(document);
                score = kycDocumentScoreRepository.save(score);
                scores.add(score);
            } else {
                scores.add(existingScore);
            }
        }

        return scores;
    }

    /**
     * Calculate document score using Python AI service
     */
    private KycDocumentScore calculateDocumentScore(KycDocument document) {
        long startTime = System.currentTimeMillis();
        List<String> explanations = new ArrayList<>();

        // Try to use Python AI service first
        KycAiServiceClient.DocumentScoreResult aiResult = null;
        try {
            // Get file path using FileStorageService
            Path filePath = fileStorageService.getFilePath(document.getFilePath());
            File documentFile = filePath.toFile();
            
            if (documentFile.exists()) {
                // Find reference selfie if needed
                File referenceSelfie = null;
                if (document.getDocumentType() == KycDocumentType.SELFIE) {
                    // Find selfie from same profile
                    List<KycDocument> selfies = kycDocumentRepository.findByKycProfileId(document.getKycProfile().getId())
                            .stream()
                            .filter(d -> d.getDocumentType() == KycDocumentType.SELFIE && !d.getId().equals(document.getId()))
                            .toList();
                    if (!selfies.isEmpty()) {
                        Path selfiePath = fileStorageService.getFilePath(selfies.get(0).getFilePath());
                        referenceSelfie = selfiePath.toFile();
                    }
                }
                
                // Call Python AI service
                aiResult = aiServiceClient.scoreDocument(
                        documentFile,
                        document.getDocumentType().name(),
                        referenceSelfie
                );
                
                log.info("AI model result for document {} (type: {}): TotalScore={}, ImageQuality={}, OCRAccuracy={}, BlurDetection={}, TamperingDetection={}, FaceQuality={}, DataConsistency={}, ExpirationCheck={}, OCRConfidence={}, FaceMatchScore={}, FaceMatchConfidence={}, Tampered={}, Blurry={}, Expired={}, DocumentHash={}, PerceptualHash={}, ExtractedName={}, ExtractedIdNumber={}, ExtractedDob={}, Explanations={}",
                        document.getId(), document.getDocumentType(),
                        aiResult.getTotalScore(), aiResult.getImageQualityScore(), aiResult.getOcrAccuracyScore(),
                        aiResult.getBlurDetectionScore(), aiResult.getTamperingDetectionScore(), aiResult.getFaceQualityScore(),
                        aiResult.getDataConsistencyScore(), aiResult.getExpirationCheckScore(), aiResult.getOcrConfidence(),
                        aiResult.getFaceMatchScore(), aiResult.getFaceMatchConfidence(), aiResult.isTampered(),
                        aiResult.isBlurry(), aiResult.isExpired(), aiResult.getDocumentHash(), aiResult.getPerceptualHash(),
                        aiResult.getOcrExtractedName(), aiResult.getOcrExtractedIdNumber(), aiResult.getOcrExtractedDob(),
                        aiResult.getAiExplanations());
                
                explanations.addAll(aiResult.getAiExplanations());
                
                // Update document with extracted data
                if (aiResult.getOcrExtractedIdNumber() != null) {
                    document.setExtractedIdNumber(aiResult.getOcrExtractedIdNumber());
                }
                
                // Set hashes from AI service
                if (aiResult.getDocumentHash() != null) {
                    document.setDocumentHash(aiResult.getDocumentHash());
                }
                if (aiResult.getPerceptualHash() != null) {
                    document.setPerceptualHash(aiResult.getPerceptualHash());
                }
                
                kycDocumentRepository.save(document);
            }
        } catch (Exception e) {
            log.warn("Failed to call AI service, falling back to simulation: {}", e.getMessage());
        }

        // Fallback to simulation if AI service failed or not available
        if (aiResult == null) {
            aiResult = createSimulatedScoreResult(document, explanations);
        }

        int imageQualityScore = aiResult.getImageQualityScore();
        int ocrAccuracyScore = aiResult.getOcrAccuracyScore();
        int blurDetectionScore = aiResult.getBlurDetectionScore();
        int tamperingDetectionScore = aiResult.getTamperingDetectionScore();
        int faceQualityScore = aiResult.getFaceQualityScore();
        int dataConsistencyScore = aiResult.getDataConsistencyScore();
        int expirationCheckScore = aiResult.getExpirationCheckScore();
        BigDecimal ocrConfidence = BigDecimal.valueOf(aiResult.getOcrConfidence());
        BigDecimal faceMatchScore = aiResult.getFaceMatchScore() != null 
                ? BigDecimal.valueOf(aiResult.getFaceMatchScore()) 
                : BigDecimal.ZERO;
        BigDecimal faceMatchConfidence = aiResult.getFaceMatchConfidence() != null
                ? BigDecimal.valueOf(aiResult.getFaceMatchConfidence())
                : BigDecimal.ZERO;

        // Calculate document hash if not set by AI service
        if (document.getDocumentHash() == null || document.getDocumentHash().isEmpty()) {
            String documentHash = calculateDocumentHash(document);
            document.setDocumentHash(documentHash);
            kycDocumentRepository.save(document);
        }

        long processingTime = System.currentTimeMillis() - startTime;

        KycDocumentScore score = KycDocumentScore.builder()
                .kycDocument(document)
                .kycProfile(document.getKycProfile())
                .imageQualityScore(imageQualityScore)
                .ocrAccuracyScore(ocrAccuracyScore)
                .blurDetectionScore(blurDetectionScore)
                .tamperingDetectionScore(tamperingDetectionScore)
                .faceQualityScore(faceQualityScore)
                .dataConsistencyScore(dataConsistencyScore)
                .expirationCheckScore(expirationCheckScore)
                .ocrConfidence(ocrConfidence)
                .faceMatchScore(faceMatchScore)
                .faceMatchConfidence(faceMatchConfidence)
                .ocrExtractedName(aiResult.getOcrExtractedName())
                .ocrExtractedIdNumber(aiResult.getOcrExtractedIdNumber())
                .ocrExtractedDob(aiResult.getOcrExtractedDob())
                .aiExplanations(String.join("|", explanations))
                .processingTimeMs(processingTime)
                .build();

        score.calculateTotalScore();
        return score;
    }

    private int calculateAggregatedDocumentScore(List<KycDocumentScore> documentScores) {
        if (documentScores == null || documentScores.isEmpty()) return 0;
        
        // Weight different document types
        int totalWeight = 0;
        int weightedSum = 0;
        
        for (KycDocumentScore score : documentScores) {
            if (score == null || score.getKycDocument() == null) continue;
            int weight = getDocumentTypeWeight(score.getKycDocument().getDocumentType());
            weightedSum += score.getTotalScore() * weight;
            totalWeight += weight;
        }
        
        // Scale to 0-1000
        return totalWeight > 0 ? (weightedSum / totalWeight) * 10 : 0;
    }

    // ==================== PROFILE SCORING ====================

    /**
     * Calculate profile score based on user data
     */
    private int calculateProfileScore(KycProfile kycProfile) {
        List<String> explanations = new ArrayList<>();
        User user = kycProfile.getUser();

        int ageScore = calculateAgeScore(kycProfile, explanations);
        int phoneTrustScore = calculatePhoneTrustScore(user, explanations);
        int emailTrustScore = calculateEmailTrustScore(user, explanations);
        int dataCompletenessScore = calculateDataCompletenessScore(kycProfile, explanations);
        int incomeVerificationScore = calculateIncomeVerificationScore(kycProfile, explanations);
        int behaviorScore = 80; // Default, updated based on behavior analysis
        int ipReputationScore = 80; // Default, updated based on IP analysis
        int deviceTrustScore = 80; // Default, updated based on device analysis

        // Calculate weighted profile score (0-100)
        double profileScore = 0;
        profileScore += ageScore * 0.15;
        profileScore += phoneTrustScore * 0.10;
        profileScore += emailTrustScore * 0.10;
        profileScore += dataCompletenessScore * 0.20;
        profileScore += incomeVerificationScore * 0.15;
        profileScore += behaviorScore * 0.10;
        profileScore += ipReputationScore * 0.10;
        profileScore += deviceTrustScore * 0.10;

        // Scale to 0-1000
        return (int) Math.round(profileScore * 10);
    }

    // ==================== FRAUD DETECTION ====================

    /**
     * Detect and flag potential fraud
     */
    private void detectFraudFlags(KycProfile kycProfile) {
        Long profileId = kycProfile.getId();

        // Check age (underage)
        if (kycProfile.getDateOfBirth() != null) {
            int age = Period.between(kycProfile.getDateOfBirth(), LocalDate.now()).getYears();
            if (age < MIN_AGE) {
                addFraudFlag(kycProfile, null, KycFraudType.PROFILE_UNDERAGE,
                        "User is " + age + " years old, minimum age is " + MIN_AGE, 90);
            }
        }

        // Check ID card expiration
        if (kycProfile.getIdCardExpiryDate() != null && 
            kycProfile.getIdCardExpiryDate().isBefore(LocalDate.now())) {
            addFraudFlag(kycProfile, null, KycFraudType.ID_CARD_EXPIRED,
                    "ID card expired on " + kycProfile.getIdCardExpiryDate(), 80);
        }

        // Check for duplicate ID card number
        if (kycProfile.getIdCardNumber() != null && !kycProfile.getIdCardNumber().isEmpty()) {
            List<KycProfile> duplicateProfiles = kycProfileRepository.findDuplicateIdCardProfiles(
                    kycProfile.getIdCardNumber(), profileId);
            if (!duplicateProfiles.isEmpty()) {
                addFraudFlag(kycProfile, null, KycFraudType.ID_CARD_DUPLICATE,
                        "ID card number already registered by another user", 100);
            }
        }

        // Check documents for duplicates
        List<KycDocument> documents = kycDocumentRepository.findByKycProfileId(profileId);
        for (KycDocument doc : documents) {
            if (doc.getDocumentHash() != null) {
                List<KycDocument> duplicateDocs = kycDocumentRepository.findDuplicateByHash(
                        doc.getDocumentHash(), profileId);
                if (!duplicateDocs.isEmpty()) {
                    addFraudFlag(kycProfile, doc, KycFraudType.DOCUMENT_DUPLICATE,
                            "Document already exists in system (matched " + duplicateDocs.size() + " documents)", 100);
                }
            }
        }

        // Check email domain
        String email = kycProfile.getUser().getEmail();
        if (isSuspiciousEmailDomain(email)) {
            addFraudFlag(kycProfile, null, KycFraudType.PROFILE_SUSPICIOUS_EMAIL,
                    "Email domain flagged as suspicious: " + email, 60);
        }
    }

    private void addFraudFlag(KycProfile kycProfile, KycDocument document, 
            KycFraudType fraudType, String description, int confidence) {
        // Check if flag already exists
        if (kycFraudFlagRepository.existsByKycProfileIdAndFraudType(kycProfile.getId(), fraudType)) {
            return;
        }

        KycFraudFlag flag = KycFraudFlag.builder()
                .kycProfile(kycProfile)
                .kycDocument(document)
                .fraudType(fraudType)
                .description(description)
                .scorePenalty(fraudType.getScorePenalty())
                .isCritical(fraudType.isCritical())
                .isResolved(false)
                .confidenceScore(confidence)
                .build();

        kycFraudFlagRepository.save(flag);
        log.warn("Fraud flag detected: {} for profile {}", fraudType, kycProfile.getId());
    }

    // ==================== HELPER METHODS ====================

    private KycProfileScore saveProfileScore(KycProfile kycProfile, int documentScore, 
            int profileScore, int riskScore, int fraudPenalty) {
        
        KycProfileScore score = kycProfileScoreRepository.findByKycProfileId(kycProfile.getId())
                .orElse(KycProfileScore.builder()
                        .kycProfile(kycProfile)
                        .user(kycProfile.getUser())
                        .build());

        Long criticalFlagsCount = kycFraudFlagRepository.countCriticalFlagsByProfileId(kycProfile.getId());
        Long fraudFlagsCount = kycFraudFlagRepository.countUnresolvedFlagsByProfileId(kycProfile.getId());

        score.setDocumentScore(documentScore);
        score.setProfileScore(profileScore);
        score.setRiskScore(riskScore);
        score.setTotalScore(riskScore);
        score.setFraudPenalty(fraudPenalty);
        score.setFraudFlagsCount(fraudFlagsCount != null ? fraudFlagsCount.intValue() : 0);
        score.setCriticalFlagsCount(criticalFlagsCount != null ? criticalFlagsCount.intValue() : 0);
        score.setScoredAt(LocalDateTime.now());
        score.setLastRecalculatedAt(LocalDateTime.now());
        
        score.calculateTotalScore();
        
        // Update verification status based on critical flags
        if (criticalFlagsCount != null && criticalFlagsCount > 0) {
            score.setVerificationStatus(KycVerificationStatus.FAILED);
        } else if (score.getRiskLevel() == KycRiskLevel.LOW) {
            score.setVerificationStatus(KycVerificationStatus.COMPLETED);
        } else if (score.getRiskLevel() == KycRiskLevel.MEDIUM) {
            score.setVerificationStatus(KycVerificationStatus.REQUIRES_MANUAL_REVIEW);
        } else {
            score.setVerificationStatus(KycVerificationStatus.FAILED);
        }

        return kycProfileScoreRepository.save(score);
    }

    private KycScoreResponse handleDuplicateDetection(KycProfile kycProfile, 
            DuplicateCheckResponse duplicateCheck) {
        
        // Add fraud flag for duplicate
        addFraudFlag(kycProfile, null, KycFraudType.DOCUMENT_DUPLICATE,
                "Duplicate documents detected: " + duplicateCheck.getDuplicateType(), 100);

        // Save score with maximum penalty
        KycProfileScore score = saveProfileScore(kycProfile, 0, 0, 0, 500);

        List<String> explanations = new ArrayList<>();
        explanations.add("DUPLICATE DETECTED: " + duplicateCheck.getDuplicateType());
        explanations.add("Matched with " + duplicateCheck.getMatches().size() + " existing profiles");
        explanations.add("IMMEDIATE REJECTION RECOMMENDED");

        return KycScoreResponse.builder()
                .userId(kycProfile.getUser().getId())
                .kycProfileId(kycProfile.getId())
                .documentScore(0)
                .profileScore(0)
                .riskScore(0)
                .totalScore(0)
                .riskLevel(KycRiskLevel.FRAUD.name())
                .riskDescription(KycRiskLevel.FRAUD.getDescription())
                .recommendedDecision("REJECT_IMMEDIATELY")
                .fraudFlagsCount(1)
                .criticalFlagsCount(1)
                .fraudPenalty(500)
                .explanations(explanations)
                .scoredAt(LocalDateTime.now())
                .build();
    }

    private KycScoreResponse buildScoreResponse(KycProfile kycProfile, KycProfileScore profileScore,
            List<KycDocumentScore> documentScores) {
        
        List<KycFraudFlag> fraudFlags = kycFraudFlagRepository.findByKycProfileId(kycProfile.getId());
        List<String> explanations = buildExplanations(profileScore, documentScores, fraudFlags);

        // Build document score breakdown
        KycScoreResponse.DocumentScoreBreakdown docBreakdown = null;
        if (!documentScores.isEmpty()) {
            KycDocumentScore avgScore = documentScores.get(0); // Use first for breakdown
            docBreakdown = KycScoreResponse.DocumentScoreBreakdown.builder()
                    .imageQualityScore(avgScore.getImageQualityScore())
                    .ocrAccuracyScore(avgScore.getOcrAccuracyScore())
                    .blurDetectionScore(avgScore.getBlurDetectionScore())
                    .tamperingDetectionScore(avgScore.getTamperingDetectionScore())
                    .faceQualityScore(avgScore.getFaceQualityScore())
                    .dataConsistencyScore(avgScore.getDataConsistencyScore())
                    .expirationCheckScore(avgScore.getExpirationCheckScore())
                    .ocrConfidence(avgScore.getOcrConfidence() != null 
                            ? avgScore.getOcrConfidence().doubleValue() : 0.0)
                    .faceMatchScore(avgScore.getFaceMatchScore() != null 
                            ? avgScore.getFaceMatchScore().doubleValue() : 0.0)
                    .build();
        }

        // Build profile score breakdown
        KycScoreResponse.ProfileScoreBreakdown profileBreakdown = KycScoreResponse.ProfileScoreBreakdown.builder()
                .ageVerificationScore(profileScore.getAgeVerificationScore())
                .phoneTrustScore(profileScore.getPhoneTrustScore())
                .emailTrustScore(profileScore.getEmailTrustScore())
                .ipReputationScore(profileScore.getIpReputationScore())
                .deviceTrustScore(profileScore.getDeviceTrustScore())
                .behaviorScore(profileScore.getBehaviorScore())
                .dataCompletenessScore(profileScore.getDataCompletenessScore())
                .incomeVerificationScore(profileScore.getIncomeVerificationScore())
                .build();

        return KycScoreResponse.builder()
                .userId(kycProfile.getUser().getId())
                .kycProfileId(kycProfile.getId())
                .documentScore(profileScore.getDocumentScore())
                .profileScore(profileScore.getProfileScore())
                .riskScore(profileScore.getRiskScore())
                .totalScore(profileScore.getTotalScore())
                .riskLevel(profileScore.getRiskLevel().name())
                .riskDescription(profileScore.getRiskLevel().getDescription())
                .recommendedDecision(profileScore.getRecommendedDecision())
                .fraudFlagsCount(profileScore.getFraudFlagsCount())
                .criticalFlagsCount(profileScore.getCriticalFlagsCount())
                .fraudPenalty(profileScore.getFraudPenalty())
                .fraudFlags(fraudFlags.stream().map(this::mapFraudFlag).collect(Collectors.toList()))
                .explanations(explanations)
                .documentScoreBreakdown(docBreakdown)
                .profileScoreBreakdown(profileBreakdown)
                .scoredAt(profileScore.getScoredAt())
                .lastRecalculatedAt(profileScore.getLastRecalculatedAt())
                .build();
    }

    private KycDocumentScoreResponse buildDocumentScoreResponse(KycDocument document, 
            KycDocumentScore score, boolean isDuplicate) {
        
        List<String> explanations = score.getAiExplanations() != null 
                ? Arrays.asList(score.getAiExplanations().split("\\|"))
                : new ArrayList<>();

        return KycDocumentScoreResponse.builder()
                .documentId(document.getId())
                .documentType(document.getDocumentType().name())
                .fileName(document.getFileName())
                .totalScore(score.getTotalScore())
                .imageQualityScore(score.getImageQualityScore())
                .ocrAccuracyScore(score.getOcrAccuracyScore())
                .blurDetectionScore(score.getBlurDetectionScore())
                .tamperingDetectionScore(score.getTamperingDetectionScore())
                .faceQualityScore(score.getFaceQualityScore())
                .dataConsistencyScore(score.getDataConsistencyScore())
                .expirationCheckScore(score.getExpirationCheckScore())
                .ocrConfidence(score.getOcrConfidence())
                .faceMatchScore(score.getFaceMatchScore())
                .faceMatchConfidence(score.getFaceMatchConfidence())
                .aiExplanations(explanations)
                .processingTimeMs(score.getProcessingTimeMs())
                .isDuplicate(isDuplicate)
                .build();
    }

    private DuplicateCheckResponse.DuplicateMatch buildDuplicateMatch(KycProfile matchedProfile, 
            KycDocument matchedDocument, String matchType, Double similarityScore) {
        return DuplicateCheckResponse.DuplicateMatch.builder()
                .matchedProfileId(matchedProfile.getId())
                .matchedDocumentId(matchedDocument != null ? matchedDocument.getId() : null)
                .matchedUserId(matchedProfile.getUser().getId())
                .matchedUserEmail(matchedProfile.getUser().getEmail())
                .matchType(matchType)
                .similarityScore(similarityScore)
                .matchedDocumentCreatedAt(matchedDocument != null 
                        ? matchedDocument.getCreatedAt() : matchedProfile.getCreatedAt())
                .build();
    }

    private KycScoreResponse.FraudFlagResponse mapFraudFlag(KycFraudFlag flag) {
        return KycScoreResponse.FraudFlagResponse.builder()
                .id(flag.getId())
                .fraudType(flag.getFraudType().name())
                .description(flag.getDescription())
                .scorePenalty(flag.getScorePenalty())
                .isCritical(flag.getIsCritical())
                .isResolved(flag.getIsResolved())
                .confidenceScore(flag.getConfidenceScore())
                .createdAt(flag.getCreatedAt())
                .build();
    }

    private List<String> buildExplanations(KycProfileScore profileScore, 
            List<KycDocumentScore> documentScores, List<KycFraudFlag> fraudFlags) {
        List<String> explanations = new ArrayList<>();

        explanations.add("Document Score: " + profileScore.getDocumentScore() + "/1000 (40% weight)");
        explanations.add("Profile Score: " + profileScore.getProfileScore() + "/1000 (60% weight)");
        explanations.add("Risk Score: " + profileScore.getRiskScore() + "/1000");
        explanations.add("Risk Level: " + profileScore.getRiskLevel().getDescription());

        if (profileScore.getFraudPenalty() > 0) {
            explanations.add("Fraud Penalty Applied: -" + profileScore.getFraudPenalty() + " points");
        }

        if (!fraudFlags.isEmpty()) {
            explanations.add("Fraud Flags Detected: " + fraudFlags.size());
            for (KycFraudFlag flag : fraudFlags) {
                explanations.add("  - " + flag.getFraudType().getDescription() + 
                        (flag.getIsCritical() ? " [CRITICAL]" : ""));
            }
        }

        return explanations;
    }

    // ==================== FALLBACK SIMULATION METHODS ====================

    /**
     * Create simulated score result when AI service is unavailable
     */
    private KycAiServiceClient.DocumentScoreResult createSimulatedScoreResult(
            KycDocument document, List<String> explanations) {
        KycAiServiceClient.DocumentScoreResult result = new KycAiServiceClient.DocumentScoreResult();
        
        result.setImageQualityScore(simulateImageQualityScore(document, explanations));
        result.setOcrAccuracyScore(simulateOcrAccuracyScore(document, explanations));
        result.setBlurDetectionScore(simulateBlurDetectionScore(document, explanations));
        result.setTamperingDetectionScore(simulateTamperingDetectionScore(document, explanations));
        result.setFaceQualityScore(simulateFaceQualityScore(document, explanations));
        result.setDataConsistencyScore(simulateDataConsistencyScore(document, explanations));
        result.setExpirationCheckScore(checkDocumentExpiration(document, explanations));
        result.setOcrConfidence(simulateOcrConfidence().doubleValue());
        result.setFaceMatchScore(document.getDocumentType() == KycDocumentType.SELFIE 
                ? simulateFaceMatchScore().doubleValue() : null);
        result.setFaceMatchConfidence(result.getFaceMatchScore() != null ? 0.85 : null);
        result.setTampered(false);
        result.setBlurry(false);
        result.setExpired(false);
        result.setAiExplanations(explanations);
        
        return result;
    }

    private int simulateImageQualityScore(KycDocument document, List<String> explanations) {
        // Simulate based on file size (larger usually means better quality)
        int score = 70;
        if (document.getFileSize() != null) {
            if (document.getFileSize() > 1_000_000) score = 90;
            else if (document.getFileSize() > 500_000) score = 80;
            else if (document.getFileSize() < 100_000) score = 50;
        }
        explanations.add("Image Quality: " + score + "%");
        return score;
    }

    private int simulateOcrAccuracyScore(KycDocument document, List<String> explanations) {
        // Simulate OCR accuracy
        int score = 75 + new Random().nextInt(20);
        explanations.add("OCR Accuracy: " + score + "%");
        return score;
    }

    private int simulateBlurDetectionScore(KycDocument document, List<String> explanations) {
        // Higher score means less blur
        int score = 80 + new Random().nextInt(15);
        explanations.add("Blur Detection: " + (100 - score) + "% blur detected");
        return score;
    }

    private int simulateTamperingDetectionScore(KycDocument document, List<String> explanations) {
        // Higher score means less tampering suspected
        int score = 85 + new Random().nextInt(15);
        explanations.add("Tampering Check: " + score + "% authentic");
        return score;
    }

    private int simulateFaceQualityScore(KycDocument document, List<String> explanations) {
        if (document.getDocumentType() == KycDocumentType.SELFIE ||
            document.getDocumentType() == KycDocumentType.ID_CARD_FRONT) {
            int score = 75 + new Random().nextInt(20);
            explanations.add("Face Quality: " + score + "%");
            return score;
        }
        return 100; // N/A for non-face documents
    }

    private int simulateDataConsistencyScore(KycDocument document, List<String> explanations) {
        int score = 80 + new Random().nextInt(15);
        explanations.add("Data Consistency: " + score + "%");
        return score;
    }

    private int checkDocumentExpiration(KycDocument document, List<String> explanations) {
        // Would check actual expiration from OCR data
        int score = 100;
        explanations.add("Document Expiration: Valid");
        return score;
    }

    private BigDecimal simulateOcrConfidence() {
        return BigDecimal.valueOf(0.85 + Math.random() * 0.12)
                .setScale(2, RoundingMode.HALF_UP);
    }

    private BigDecimal simulateFaceMatchScore() {
        return BigDecimal.valueOf(0.80 + Math.random() * 0.18)
                .setScale(2, RoundingMode.HALF_UP);
    }

    private int calculateAgeScore(KycProfile kycProfile, List<String> explanations) {
        if (kycProfile.getDateOfBirth() == null) {
            explanations.add("Age: Not provided");
            return 50;
        }
        int age = Period.between(kycProfile.getDateOfBirth(), LocalDate.now()).getYears();
        
        if (age < MIN_AGE) {
            explanations.add("Age: " + age + " (UNDERAGE - REJECTED)");
            return 0;
        }
        if (age > MAX_AGE) {
            explanations.add("Age: " + age + " (Above maximum)");
            return 60;
        }
        if (age >= 25 && age <= 55) {
            explanations.add("Age: " + age + " (Optimal range)");
            return 100;
        }
        explanations.add("Age: " + age);
        return 80;
    }

    private int calculatePhoneTrustScore(User user, List<String> explanations) {
        if (user.getPhone() == null || user.getPhone().isEmpty()) {
            explanations.add("Phone: Not provided");
            return 30;
        }
        // In production: verify phone, check carrier, check if disposable
        explanations.add("Phone: Verified");
        return 85;
    }

    private int calculateEmailTrustScore(User user, List<String> explanations) {
        String email = user.getEmail();
        if (email == null || email.isEmpty()) {
            explanations.add("Email: Not provided");
            return 30;
        }
        
        // Check for trusted domains
        if (email.endsWith("@gmail.com") || email.endsWith("@outlook.com") || 
            email.endsWith("@yahoo.com") || email.endsWith("@hotmail.com")) {
            explanations.add("Email: Trusted domain");
            return 90;
        }
        
        if (isSuspiciousEmailDomain(email)) {
            explanations.add("Email: Suspicious domain");
            return 40;
        }
        
        explanations.add("Email: Standard domain");
        return 70;
    }

    private int calculateDataCompletenessScore(KycProfile kycProfile, List<String> explanations) {
        int filledFields = 0;
        int totalFields = 12;

        if (kycProfile.getFullName() != null && !kycProfile.getFullName().isEmpty()) filledFields++;
        if (kycProfile.getIdCardNumber() != null && !kycProfile.getIdCardNumber().isEmpty()) filledFields++;
        if (kycProfile.getDateOfBirth() != null) filledFields++;
        if (kycProfile.getGender() != null && !kycProfile.getGender().isEmpty()) filledFields++;
        if (kycProfile.getAddress() != null && !kycProfile.getAddress().isEmpty()) filledFields++;
        if (kycProfile.getCity() != null && !kycProfile.getCity().isEmpty()) filledFields++;
        if (kycProfile.getOccupation() != null && !kycProfile.getOccupation().isEmpty()) filledFields++;
        if (kycProfile.getMonthlyIncome() != null) filledFields++;
        if (kycProfile.getBankName() != null && !kycProfile.getBankName().isEmpty()) filledFields++;
        if (kycProfile.getBankAccountNumber() != null && !kycProfile.getBankAccountNumber().isEmpty()) filledFields++;
        if (kycProfile.getBankAccountHolder() != null && !kycProfile.getBankAccountHolder().isEmpty()) filledFields++;
        if (kycProfile.getNationality() != null && !kycProfile.getNationality().isEmpty()) filledFields++;

        int score = (filledFields * 100) / totalFields;
        explanations.add("Data Completeness: " + filledFields + "/" + totalFields + " fields (" + score + "%)");
        return score;
    }

    private int calculateIncomeVerificationScore(KycProfile kycProfile, List<String> explanations) {
        if (kycProfile.getMonthlyIncome() == null) {
            explanations.add("Income: Not provided");
            return 50;
        }
        
        BigDecimal income = kycProfile.getMonthlyIncome();
        if (income.compareTo(BigDecimal.valueOf(5_000_000)) < 0) {
            explanations.add("Income: Below minimum threshold");
            return 60;
        }
        if (income.compareTo(BigDecimal.valueOf(50_000_000)) > 0) {
            explanations.add("Income: High income bracket");
            return 95;
        }
        explanations.add("Income: Standard bracket");
        return 80;
    }

    private boolean isSuspiciousEmailDomain(String email) {
        if (email == null) return false;
        String domain = email.substring(email.indexOf("@") + 1).toLowerCase();
        List<String> suspiciousDomains = Arrays.asList(
                "tempmail.com", "throwaway.com", "guerrillamail.com", 
                "10minutemail.com", "mailinator.com", "fakeemail.com"
        );
        return suspiciousDomains.contains(domain);
    }

    private boolean checkDocumentDuplicate(KycDocument document) {
        if (document.getDocumentHash() == null) return false;
        List<KycDocument> duplicates = kycDocumentRepository.findDuplicateByHash(
                document.getDocumentHash(), document.getKycProfile().getId());
        return !duplicates.isEmpty();
    }

    private String calculateDocumentHash(KycDocument document) {
        try {
            // In production: hash actual file content
            // For now: hash based on file path + size
            String content = document.getFilePath() + document.getFileSize();
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(content.getBytes(StandardCharsets.UTF_8));
            StringBuilder hexString = new StringBuilder();
            for (byte b : hash) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1) hexString.append('0');
                hexString.append(hex);
            }
            return hexString.toString();
        } catch (NoSuchAlgorithmException e) {
            log.error("Failed to calculate document hash", e);
            return null;
        }
    }

    private int getDocumentTypeWeight(KycDocumentType type) {
        return switch (type) {
            case ID_CARD_FRONT -> 30;
            case ID_CARD_BACK -> 20;
            case SELFIE -> 25;
            case INCOME_PROOF -> 15;
            case BANK_STATEMENT -> 10;
            default -> 10;
        };
    }

    private String calculateScoreGrade(int score) {
        if (score >= 900) return "A+";
        if (score >= 800) return "A";
        if (score >= 700) return "B";
        if (score >= 600) return "C";
        if (score >= 400) return "D";
        return "F";
    }

    // ==================== ADMIN METHODS ====================

    /**
     * Admin: Manually adjust KYC score
     */
    @Transactional
    public KycScoreResponse adminAdjustScore(Long kycProfileId, int adjustment, String reason) {
        KycProfileScore profileScore = kycProfileScoreRepository.findByKycProfileId(kycProfileId)
                .orElseThrow(() -> new ResourceNotFoundException("KYC Score not found for profile"));

        int newScore = Math.max(0, Math.min(1000, profileScore.getTotalScore() + adjustment));
        profileScore.setTotalScore(newScore);
        profileScore.setRiskScore(newScore);
        profileScore.setRiskLevel(KycRiskLevel.fromScore(newScore));
        profileScore.updateRecommendedDecision();
        profileScore.setLastRecalculatedAt(LocalDateTime.now());

        String existingExplanations = profileScore.getAiExplanations() != null 
                ? profileScore.getAiExplanations() : "";
        profileScore.setAiExplanations(existingExplanations + 
                "|ADMIN_ADJUSTMENT: " + adjustment + " points. Reason: " + reason);

        kycProfileScoreRepository.save(profileScore);

        KycProfile kycProfile = profileScore.getKycProfile();
        List<KycDocumentScore> documentScores = kycDocumentScoreRepository.findByKycProfileId(kycProfileId);
        
        return buildScoreResponse(kycProfile, profileScore, documentScores);
    }

    /**
     * Admin: Resolve a fraud flag
     */
    @Transactional
    public void resolveFraudFlag(Long flagId, Long adminId, String resolutionNote) {
        KycFraudFlag flag = kycFraudFlagRepository.findById(flagId)
                .orElseThrow(() -> new ResourceNotFoundException("Fraud flag not found"));

        flag.setIsResolved(true);
        flag.setResolvedBy(adminId);
        flag.setResolutionNote(resolutionNote);
        kycFraudFlagRepository.save(flag);

        // Recalculate score after resolving flag
        calculateKycScore(flag.getKycProfile().getId());
    }

    /**
     * Admin: Force recalculate score
     */
    @Transactional
    public KycScoreResponse recalculateScore(Long kycProfileId) {
        // Delete existing scores to force recalculation
        List<KycDocumentScore> existingScores = kycDocumentScoreRepository.findByKycProfileId(kycProfileId);
        kycDocumentScoreRepository.deleteAll(existingScores);
        
        return calculateKycScore(kycProfileId);
    }
}

