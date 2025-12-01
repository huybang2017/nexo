package com.nexo.server.dto.wallet;

import com.nexo.server.enums.TransactionStatus;
import com.nexo.server.enums.TransactionType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TransactionResponse {

    private Long id;
    private String referenceCode;
    private TransactionType type;
    private TransactionStatus status;
    private BigDecimal amount;
    private BigDecimal fee;
    private BigDecimal netAmount;
    private BigDecimal balanceBefore;
    private BigDecimal balanceAfter;
    private String currency;
    private String description;
    private Long loanId;
    private String loanCode;
    private Long investmentId;
    private String investmentCode;
    private Long userId;
    private String userName;
    private String userEmail;
    private LocalDateTime createdAt;
}

