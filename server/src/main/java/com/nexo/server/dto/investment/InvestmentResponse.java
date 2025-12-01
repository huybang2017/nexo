package com.nexo.server.dto.investment;

import com.nexo.server.enums.InvestmentStatus;
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
public class InvestmentResponse {

    private Long id;
    private String investmentCode;
    private Long loanId;
    private String loanCode;
    private String loanTitle;
    private BigDecimal amount;
    private BigDecimal interestRate;
    private InvestmentStatus status;
    private BigDecimal expectedReturn;
    private BigDecimal actualReturn;
    private BigDecimal returnProgress;
    private LocalDateTime investedAt;
    private LocalDate maturityDate;
    
    // Loan info
    private String loanStatus;
    private Integer borrowerCreditScore;
    
    // Next return info
    private LocalDate nextReturnDate;
    private BigDecimal nextReturnAmount;
    
    private LocalDateTime createdAt;
}

