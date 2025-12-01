package com.nexo.server.dto.repayment;

import com.nexo.server.enums.RepaymentStatus;
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
public class RepaymentResponse {

    private Long id;
    private String repaymentCode;
    
    // Loan info (simplified)
    private Long loanId;
    private String loanCode;
    
    // Schedule info
    private Long scheduleId;
    private Integer installmentNumber;
    
    private RepaymentStatus status;
    private BigDecimal dueAmount;
    private BigDecimal paidAmount;
    private BigDecimal lateFee;
    private LocalDate dueDate;
    private LocalDateTime paidAt;
    private Integer daysOverdue;
    
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}

