package com.nexo.server.dto.repayment;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RepaymentScheduleResponse {

    private Long id;
    
    // Loan info (simplified to avoid circular reference)
    private Long loanId;
    private String loanCode;
    private String loanTitle;
    
    private Integer installmentNumber;
    private LocalDate dueDate;
    private BigDecimal principalAmount;
    private BigDecimal interestAmount;
    private BigDecimal totalAmount;
    private BigDecimal remainingPrincipal;
    
    // Repayment status
    private Boolean isPaid;
    private BigDecimal paidAmount;
    private BigDecimal lateFee;
    private LocalDateTime paidAt;
    
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}

