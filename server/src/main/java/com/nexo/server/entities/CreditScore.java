package com.nexo.server.entities;

import com.nexo.server.enums.RiskLevel;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "credit_scores", indexes = {
    @Index(name = "idx_credit_score_user", columnList = "user_id")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreditScore extends BaseEntity {

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    // Main score (0-1000)
    @Column(name = "total_score", nullable = false)
    @Builder.Default
    private Integer totalScore = 300;

    // Component scores (0-100 each, weighted to total)
    @Column(name = "payment_history_score")
    @Builder.Default
    private Integer paymentHistoryScore = 0;

    @Column(name = "credit_utilization_score")
    @Builder.Default
    private Integer creditUtilizationScore = 0;

    @Column(name = "credit_history_length_score")
    @Builder.Default
    private Integer creditHistoryLengthScore = 0;

    @Column(name = "identity_verification_score")
    @Builder.Default
    private Integer identityVerificationScore = 0;

    @Column(name = "income_stability_score")
    @Builder.Default
    private Integer incomeStabilityScore = 0;

    @Column(name = "behavior_score")
    @Builder.Default
    private Integer behaviorScore = 50;

    // Calculated risk level
    @Enumerated(EnumType.STRING)
    @Column(name = "risk_level", nullable = false)
    @Builder.Default
    private RiskLevel riskLevel = RiskLevel.CRITICAL;

    @Column(name = "risk_grade", length = 2)
    @Builder.Default
    private String riskGrade = "E";

    // Loan eligibility
    @Column(name = "max_loan_amount", precision = 18, scale = 2)
    @Builder.Default
    private BigDecimal maxLoanAmount = BigDecimal.ZERO;

    @Column(name = "max_interest_rate", precision = 5, scale = 2)
    @Builder.Default
    private BigDecimal maxInterestRate = new BigDecimal("20.00");

    @Column(name = "min_interest_rate", precision = 5, scale = 2)
    @Builder.Default
    private BigDecimal minInterestRate = new BigDecimal("12.00");

    @Column(name = "is_eligible_for_loan")
    @Builder.Default
    private Boolean isEligibleForLoan = false;

    @Column(name = "eligibility_reason")
    private String eligibilityReason;

    // Statistics
    @Column(name = "total_loans_completed")
    @Builder.Default
    private Integer totalLoansCompleted = 0;

    @Column(name = "total_loans_defaulted")
    @Builder.Default
    private Integer totalLoansDefaulted = 0;

    @Column(name = "total_on_time_payments")
    @Builder.Default
    private Integer totalOnTimePayments = 0;

    @Column(name = "total_late_payments")
    @Builder.Default
    private Integer totalLatePayments = 0;

    @Column(name = "average_days_late")
    @Builder.Default
    private Double averageDaysLate = 0.0;

    @Column(name = "total_amount_borrowed", precision = 18, scale = 2)
    @Builder.Default
    private BigDecimal totalAmountBorrowed = BigDecimal.ZERO;

    @Column(name = "total_amount_repaid", precision = 18, scale = 2)
    @Builder.Default
    private BigDecimal totalAmountRepaid = BigDecimal.ZERO;

    // Timestamps
    @Column(name = "last_calculated_at")
    private LocalDateTime lastCalculatedAt;

    @Column(name = "next_review_at")
    private LocalDateTime nextReviewAt;

    // Methods
    public void updateRiskLevel() {
        this.riskLevel = RiskLevel.fromScore(this.totalScore);
        this.riskGrade = this.riskLevel.getGrade();
    }

    public void updateLoanEligibility() {
        // Based on score, determine loan eligibility
        if (this.totalScore < 300) {
            this.isEligibleForLoan = false;
            this.eligibilityReason = "Credit score too low. Minimum required: 300";
            this.maxLoanAmount = BigDecimal.ZERO;
        } else if (this.totalScore < 400) {
            this.isEligibleForLoan = true;
            this.eligibilityReason = "Limited loan eligibility due to low credit score";
            this.maxLoanAmount = new BigDecimal("5000000"); // 5M VND
            this.minInterestRate = new BigDecimal("18.00");
            this.maxInterestRate = new BigDecimal("20.00"); // Tuân thủ pháp luật VN (tối đa 20%/năm)
        } else if (this.totalScore < 500) {
            this.isEligibleForLoan = true;
            this.eligibilityReason = "Standard loan eligibility";
            this.maxLoanAmount = new BigDecimal("20000000"); // 20M VND
            this.minInterestRate = new BigDecimal("16.00");
            this.maxInterestRate = new BigDecimal("20.00");
        } else if (this.totalScore < 600) {
            this.isEligibleForLoan = true;
            this.eligibilityReason = "Good loan eligibility";
            this.maxLoanAmount = new BigDecimal("50000000"); // 50M VND
            this.minInterestRate = new BigDecimal("14.00");
            this.maxInterestRate = new BigDecimal("18.00");
        } else if (this.totalScore < 700) {
            this.isEligibleForLoan = true;
            this.eligibilityReason = "Very good loan eligibility";
            this.maxLoanAmount = new BigDecimal("100000000"); // 100M VND
            this.minInterestRate = new BigDecimal("12.00");
            this.maxInterestRate = new BigDecimal("16.00");
        } else if (this.totalScore < 800) {
            this.isEligibleForLoan = true;
            this.eligibilityReason = "Excellent loan eligibility";
            this.maxLoanAmount = new BigDecimal("200000000"); // 200M VND
            this.minInterestRate = new BigDecimal("10.00");
            this.maxInterestRate = new BigDecimal("14.00");
        } else {
            this.isEligibleForLoan = true;
            this.eligibilityReason = "Premium loan eligibility - Best rates available";
            this.maxLoanAmount = new BigDecimal("500000000"); // 500M VND
            this.minInterestRate = new BigDecimal("8.00");
            this.maxInterestRate = new BigDecimal("12.00");
        }
    }
}

