package com.nexo.server.entities;

import com.nexo.server.enums.TransactionStatus;
import com.nexo.server.enums.TransactionType;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

@Entity
@Table(name = "transactions", indexes = {
    @Index(name = "idx_txn_reference", columnList = "reference_code"),
    @Index(name = "idx_txn_wallet", columnList = "wallet_id"),
    @Index(name = "idx_txn_user", columnList = "user_id"),
    @Index(name = "idx_txn_type", columnList = "type"),
    @Index(name = "idx_txn_status", columnList = "status")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Transaction extends BaseEntity {

    @Column(name = "reference_code", nullable = false, unique = true, length = 50)
    private String referenceCode;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "wallet_id", nullable = false)
    private Wallet wallet;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TransactionType type;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TransactionStatus status = TransactionStatus.PENDING;

    @Column(nullable = false, precision = 18, scale = 2)
    private BigDecimal amount;

    @Column(precision = 18, scale = 2)
    @Builder.Default
    private BigDecimal fee = BigDecimal.ZERO;

    @Column(name = "net_amount", nullable = false, precision = 18, scale = 2)
    private BigDecimal netAmount;

    @Column(name = "balance_before", nullable = false, precision = 18, scale = 2)
    private BigDecimal balanceBefore;

    @Column(name = "balance_after", nullable = false, precision = 18, scale = 2)
    private BigDecimal balanceAfter;

    @Column(length = 3)
    @Builder.Default
    private String currency = "VND";

    // Related entities
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "related_transaction_id")
    private Transaction relatedTransaction;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "loan_id")
    private Loan loan;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "investment_id")
    private Investment investment;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "repayment_id")
    private Repayment repayment;

    @Column(columnDefinition = "TEXT")
    private String description;

    @PrePersist
    public void prePersist() {
        if (netAmount == null) {
            netAmount = amount.subtract(fee != null ? fee : BigDecimal.ZERO);
        }
    }
}

