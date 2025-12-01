package com.nexo.server.dto.investment;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InvestRequest {

    @NotNull(message = "Loan ID is required")
    private Long loanId;

    @NotNull(message = "Amount is required")
    @DecimalMin(value = "100000", message = "Minimum investment amount is 100,000 VND")
    private BigDecimal amount;
}

