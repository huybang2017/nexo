package com.nexo.server.entities;

import com.nexo.server.enums.KycRiskLevel;
import com.nexo.server.enums.KycVerificationStatus;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "kyc_profile_scores", indexes = {
    @Index(name = "idx_kyc_profile_score_profile", columnList = "kyc_profile_id"),
    @Index(name = "idx_kyc_profile_score_user", columnList = "user_id")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class KycProfileScore extends BaseEntity {

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "kyc_profile_id", nullable = false, unique = true)
    private KycProfile kycProfile;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    // Main scores (0-1000)
    @Column(name = "document_score", nullable = false)
    @Builder.Default
    private Integer documentScore = 0;

    @Column(name = "profile_score", nullable = false)
    @Builder.Default
    private Integer profileScore = 0;

    @Column(name = "risk_score", nullable = false)
    @Builder.Default
    private Integer riskScore = 0;

    @Column(name = "total_score", nullable = false)
    @Builder.Default
    private Integer totalScore = 0;

    // Profile component scores (0-100)
    @Column(name = "age_verification_score")
    @Builder.Default
    private Integer ageVerificationScore = 0;

    @Column(name = "phone_trust_score")
    @Builder.Default
    private Integer phoneTrustScore = 0;

    @Column(name = "email_trust_score")
    @Builder.Default
    private Integer emailTrustScore = 0;

    @Column(name = "ip_reputation_score")
    @Builder.Default
    private Integer ipReputationScore = 0;

    @Column(name = "device_trust_score")
    @Builder.Default
    private Integer deviceTrustScore = 0;

    @Column(name = "behavior_score")
    @Builder.Default
    private Integer behaviorScore = 0;

    @Column(name = "data_completeness_score")
    @Builder.Default
    private Integer dataCompletenessScore = 0;

    @Column(name = "income_verification_score")
    @Builder.Default
    private Integer incomeVerificationScore = 0;

    // Risk assessment
    @Enumerated(EnumType.STRING)
    @Column(name = "risk_level", nullable = false)
    @Builder.Default
    private KycRiskLevel riskLevel = KycRiskLevel.HIGH;

    @Column(name = "fraud_penalty")
    @Builder.Default
    private Integer fraudPenalty = 0;

    @Column(name = "fraud_flags_count")
    @Builder.Default
    private Integer fraudFlagsCount = 0;

    @Column(name = "critical_flags_count")
    @Builder.Default
    private Integer criticalFlagsCount = 0;

    // Verification status
    @Enumerated(EnumType.STRING)
    @Column(name = "verification_status", nullable = false)
    @Builder.Default
    private KycVerificationStatus verificationStatus = KycVerificationStatus.PENDING;

    @Column(name = "recommended_decision")
    private String recommendedDecision;

    // Metadata
    @Column(name = "submission_ip")
    private String submissionIp;

    @Column(name = "device_fingerprint")
    private String deviceFingerprint;

    @Column(name = "user_agent", columnDefinition = "TEXT")
    private String userAgent;

    @Column(name = "submission_duration_ms")
    private Long submissionDurationMs;

    // AI explanations
    @Column(name = "ai_explanations", columnDefinition = "TEXT")
    private String aiExplanations;

    // Timestamps
    @Column(name = "scored_at")
    private LocalDateTime scoredAt;

    @Column(name = "last_recalculated_at")
    private LocalDateTime lastRecalculatedAt;

    // Methods
    public void calculateTotalScore() {
        // Document Score: 40%, Profile Score: 60%
        int baseScore = (int) Math.round(documentScore * 0.4 + profileScore * 0.6);
        // Apply fraud penalty
        this.riskScore = Math.max(0, baseScore - fraudPenalty);
        this.totalScore = this.riskScore;
        this.riskLevel = KycRiskLevel.fromScore(this.totalScore);
        updateRecommendedDecision();
    }

    public void updateRecommendedDecision() {
        switch (this.riskLevel) {
            case LOW -> this.recommendedDecision = "AUTO_APPROVE";
            case MEDIUM -> this.recommendedDecision = "MANUAL_REVIEW";
            case HIGH -> this.recommendedDecision = "REJECT";
            case FRAUD -> this.recommendedDecision = "BLACKLIST";
        }
    }
}


