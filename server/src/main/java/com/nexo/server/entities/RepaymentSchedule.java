package com.nexo.server.entities;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(name = "repayment_schedules", indexes = {
    @Index(name = "idx_schedule_loan", columnList = "loan_id"),
    @Index(name = "idx_schedule_due_date", columnList = "due_date")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RepaymentSchedule extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "loan_id", nullable = false)
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler", "borrower", "investments", "repaymentSchedules"})
    private Loan loan;

    @Column(name = "installment_number", nullable = false)
    private Integer installmentNumber;

    @Column(name = "due_date", nullable = false)
    private LocalDate dueDate;

    @Column(name = "principal_amount", nullable = false, precision = 18, scale = 2)
    private BigDecimal principalAmount;

    @Column(name = "interest_amount", nullable = false, precision = 18, scale = 2)
    private BigDecimal interestAmount;

    @Column(name = "total_amount", nullable = false, precision = 18, scale = 2)
    private BigDecimal totalAmount;

    @Column(name = "remaining_principal", precision = 18, scale = 2)
    private BigDecimal remainingPrincipal;

    // Link to actual repayment
    @OneToOne(mappedBy = "schedule", fetch = FetchType.LAZY)
    @JsonIgnore
    private Repayment repayment;

    public boolean isPaid() {
        return repayment != null && 
               repayment.getPaidAmount() != null && 
               repayment.getPaidAmount().compareTo(totalAmount) >= 0;
    }
}

