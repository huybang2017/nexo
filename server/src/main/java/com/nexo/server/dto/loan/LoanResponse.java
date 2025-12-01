package com.nexo.server.dto.loan;

import com.nexo.server.enums.LoanPurpose;
import com.nexo.server.enums.LoanStatus;
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
public class LoanResponse {

    private Long id;
    private String loanCode;
    private String title;
    private String description;
    private LoanPurpose purpose;
    private BigDecimal requestedAmount;
    private BigDecimal fundedAmount;
    private BigDecimal remainingAmount;
    private BigDecimal fundingProgress;
    private BigDecimal interestRate;
    private BigDecimal platformFeeRate;
    private Integer termMonths;
    private String riskGrade;
    private Integer creditScoreAtRequest;
    private LoanStatus status;
    private LocalDateTime fundingDeadline;
    private LocalDateTime disbursedAt;
    private LocalDate maturityDate;
    private BigDecimal totalRepaid;
    private BigDecimal totalInterestPaid;
    private Integer investorCount;
    
    // Rejection info
    private String rejectionReason;
    
    // Borrower info (limited)
    private Long borrowerId;
    private String borrowerName;
    private Integer borrowerCreditScore;
    
    // Next repayment info
    private LocalDate nextRepaymentDate;
    private BigDecimal nextRepaymentAmount;
    
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}

