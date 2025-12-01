package com.nexo.server.dto.creditscore;

import com.nexo.server.enums.RiskLevel;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreditScoreResponse {
    private Long id;
    private Long userId;
    
    // Main score
    private Integer totalScore;
    private Integer maxScore;
    
    // Component scores
    private ScoreComponentsResponse components;
    
    // Risk assessment
    private String riskLevel;
    private String riskGrade;
    private String riskDescription;
    
    // Loan eligibility
    private Boolean isEligibleForLoan;
    private String eligibilityReason;
    private BigDecimal maxLoanAmount;
    private BigDecimal minInterestRate;
    private BigDecimal maxInterestRate;
    
    // Statistics
    private CreditStatsResponse statistics;
    
    // Timestamps
    private LocalDateTime lastCalculatedAt;
    private LocalDateTime nextReviewAt;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ScoreComponentsResponse {
        private Integer paymentHistoryScore;
        private Integer paymentHistoryWeight;
        private Integer creditUtilizationScore;
        private Integer creditUtilizationWeight;
        private Integer creditHistoryLengthScore;
        private Integer creditHistoryLengthWeight;
        private Integer identityVerificationScore;
        private Integer identityVerificationWeight;
        private Integer incomeStabilityScore;
        private Integer incomeStabilityWeight;
        private Integer behaviorScore;
        private Integer behaviorWeight;
    }
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CreditStatsResponse {
        private Integer totalLoansCompleted;
        private Integer totalLoansDefaulted;
        private Integer totalOnTimePayments;
        private Integer totalLatePayments;
        private Double averageDaysLate;
        private BigDecimal totalAmountBorrowed;
        private BigDecimal totalAmountRepaid;
        private Double repaymentRate;
        private Double onTimePaymentRate;
    }
}

