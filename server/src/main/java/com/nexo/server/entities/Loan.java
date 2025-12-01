package com.nexo.server.entities;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.nexo.server.enums.LoanPurpose;
import com.nexo.server.enums.LoanStatus;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "loans", indexes = {
    @Index(name = "idx_loan_code", columnList = "loan_code"),
    @Index(name = "idx_loan_borrower", columnList = "borrower_id"),
    @Index(name = "idx_loan_status", columnList = "status"),
    @Index(name = "idx_loan_purpose", columnList = "purpose")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class Loan extends BaseEntity {

    @Column(name = "loan_code", nullable = false, unique = true, length = 20)
    private String loanCode;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "borrower_id", nullable = false)
    private User borrower;

    // Loan details
    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private LoanPurpose purpose;

    // Amount
    @Column(name = "requested_amount", nullable = false, precision = 18, scale = 2)
    private BigDecimal requestedAmount;

    @Column(name = "funded_amount", precision = 18, scale = 2)
    @Builder.Default
    private BigDecimal fundedAmount = BigDecimal.ZERO;

    // Interest
    @Column(name = "interest_rate", nullable = false, precision = 5, scale = 2)
    private BigDecimal interestRate;

    @Column(name = "platform_fee_rate", nullable = false, precision = 5, scale = 2)
    @Builder.Default
    private BigDecimal platformFeeRate = new BigDecimal("2.00");

    // Term
    @Column(name = "term_months", nullable = false)
    private Integer termMonths;

    // Risk
    @Column(name = "risk_grade", length = 2)
    private String riskGrade;

    @Column(name = "credit_score_at_request")
    private Integer creditScoreAtRequest;

    // Status
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private LoanStatus status = LoanStatus.DRAFT;

    // Dates
    @Column(name = "funding_deadline")
    private LocalDateTime fundingDeadline;

    @Column(name = "disbursed_at")
    private LocalDateTime disbursedAt;

    @Column(name = "maturity_date")
    private LocalDate maturityDate;

    // Review
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reviewed_by")
    private User reviewedBy;

    @Column(name = "reviewed_at")
    private LocalDateTime reviewedAt;

    @Column(name = "rejection_reason", columnDefinition = "TEXT")
    private String rejectionReason;

    // Stats
    @Column(name = "total_repaid", precision = 18, scale = 2)
    @Builder.Default
    private BigDecimal totalRepaid = BigDecimal.ZERO;

    @Column(name = "total_interest_paid", precision = 18, scale = 2)
    @Builder.Default
    private BigDecimal totalInterestPaid = BigDecimal.ZERO;

    // Relations
    @OneToMany(mappedBy = "loan", cascade = CascadeType.ALL)
    @Builder.Default
    private List<LoanDocument> documents = new ArrayList<>();

    @OneToMany(mappedBy = "loan", cascade = CascadeType.ALL)
    @Builder.Default
    private List<Investment> investments = new ArrayList<>();

    @OneToMany(mappedBy = "loan", cascade = CascadeType.ALL)
    @Builder.Default
    @JsonIgnore
    private List<RepaymentSchedule> repaymentSchedules = new ArrayList<>();

    public BigDecimal getRemainingAmount() {
        return requestedAmount.subtract(fundedAmount);
    }

    public BigDecimal getFundingProgress() {
        if (requestedAmount.compareTo(BigDecimal.ZERO) == 0) {
            return BigDecimal.ZERO;
        }
        return fundedAmount.divide(requestedAmount, 4, java.math.RoundingMode.HALF_UP)
                .multiply(new BigDecimal("100"));
    }

    public boolean isFullyFunded() {
        return fundedAmount.compareTo(requestedAmount) >= 0;
    }
}

