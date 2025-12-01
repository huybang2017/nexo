package com.nexo.server.entities;

import com.nexo.server.enums.RepaymentStatus;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "repayments", indexes = {
    @Index(name = "idx_repayment_code", columnList = "repayment_code"),
    @Index(name = "idx_repayment_loan", columnList = "loan_id"),
    @Index(name = "idx_repayment_borrower", columnList = "borrower_id"),
    @Index(name = "idx_repayment_status", columnList = "status")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Repayment extends BaseEntity {

    @Column(name = "repayment_code", nullable = false, unique = true, length = 20)
    private String repaymentCode;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "schedule_id", nullable = false)
    private RepaymentSchedule schedule;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "loan_id", nullable = false)
    private Loan loan;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "borrower_id", nullable = false)
    private User borrower;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private RepaymentStatus status = RepaymentStatus.PENDING;

    @Column(name = "due_amount", nullable = false, precision = 18, scale = 2)
    private BigDecimal dueAmount;

    @Column(name = "paid_amount", precision = 18, scale = 2)
    @Builder.Default
    private BigDecimal paidAmount = BigDecimal.ZERO;

    @Column(name = "late_fee", precision = 18, scale = 2)
    @Builder.Default
    private BigDecimal lateFee = BigDecimal.ZERO;

    @Column(name = "due_date", nullable = false)
    private LocalDate dueDate;

    @Column(name = "paid_at")
    private LocalDateTime paidAt;

    @Column(name = "days_overdue")
    @Builder.Default
    private Integer daysOverdue = 0;

    // Distribution to lenders
    @OneToMany(mappedBy = "repayment", cascade = CascadeType.ALL)
    @Builder.Default
    private List<LenderReturn> lenderReturns = new ArrayList<>();
}

