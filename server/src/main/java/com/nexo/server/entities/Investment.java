package com.nexo.server.entities;

import com.nexo.server.enums.InvestmentStatus;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "investments", indexes = {
    @Index(name = "idx_investment_code", columnList = "investment_code"),
    @Index(name = "idx_investment_loan", columnList = "loan_id"),
    @Index(name = "idx_investment_lender", columnList = "lender_id"),
    @Index(name = "idx_investment_status", columnList = "status")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Investment extends BaseEntity {

    @Column(name = "investment_code", nullable = false, unique = true, length = 20)
    private String investmentCode;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "loan_id", nullable = false)
    private Loan loan;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "lender_id", nullable = false)
    private User lender;

    @Column(nullable = false, precision = 18, scale = 2)
    private BigDecimal amount;

    @Column(name = "interest_rate", nullable = false, precision = 5, scale = 2)
    private BigDecimal interestRate;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private InvestmentStatus status = InvestmentStatus.ACTIVE;

    // Returns
    @Column(name = "expected_return", nullable = false, precision = 18, scale = 2)
    private BigDecimal expectedReturn;

    @Column(name = "actual_return", precision = 18, scale = 2)
    @Builder.Default
    private BigDecimal actualReturn = BigDecimal.ZERO;

    // Dates
    @Column(name = "invested_at")
    private LocalDateTime investedAt;

    @Column(name = "maturity_date")
    private LocalDate maturityDate;

    // Returns tracking
    @OneToMany(mappedBy = "investment", cascade = CascadeType.ALL)
    @Builder.Default
    private List<LenderReturn> returns = new ArrayList<>();

    public BigDecimal getOwnershipPercentage(BigDecimal loanAmount) {
        return amount.divide(loanAmount, 6, java.math.RoundingMode.HALF_UP);
    }

    @PrePersist
    public void prePersist() {
        if (investedAt == null) {
            investedAt = LocalDateTime.now();
        }
    }
}

