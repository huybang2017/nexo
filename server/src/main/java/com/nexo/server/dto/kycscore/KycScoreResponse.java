package com.nexo.server.dto.kycscore;

import com.nexo.server.enums.KycRiskLevel;
import lombok.*;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class KycScoreResponse {
    private Long userId;
    private Long kycProfileId;
    
    // Main scores (0-1000)
    private Integer documentScore;
    private Integer profileScore;
    private Integer riskScore;
    private Integer totalScore;
    
    // Risk assessment
    private String riskLevel;
    private String riskDescription;
    private String recommendedDecision;
    
    // Fraud analysis
    private Integer fraudFlagsCount;
    private Integer criticalFlagsCount;
    private Integer fraudPenalty;
    private List<FraudFlagResponse> fraudFlags;
    
    // AI explanations
    private List<String> explanations;
    
    // Component scores breakdown
    private DocumentScoreBreakdown documentScoreBreakdown;
    private ProfileScoreBreakdown profileScoreBreakdown;
    
    // Timestamps
    private LocalDateTime scoredAt;
    private LocalDateTime lastRecalculatedAt;
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DocumentScoreBreakdown {
        private Integer imageQualityScore;
        private Integer ocrAccuracyScore;
        private Integer blurDetectionScore;
        private Integer tamperingDetectionScore;
        private Integer faceQualityScore;
        private Integer dataConsistencyScore;
        private Integer expirationCheckScore;
        private Double ocrConfidence;
        private Double faceMatchScore;
    }
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ProfileScoreBreakdown {
        private Integer ageVerificationScore;
        private Integer phoneTrustScore;
        private Integer emailTrustScore;
        private Integer ipReputationScore;
        private Integer deviceTrustScore;
        private Integer behaviorScore;
        private Integer dataCompletenessScore;
        private Integer incomeVerificationScore;
    }
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class FraudFlagResponse {
        private Long id;
        private String fraudType;
        private String description;
        private Integer scorePenalty;
        private Boolean isCritical;
        private Boolean isResolved;
        private Integer confidenceScore;
        private LocalDateTime createdAt;
    }
}


