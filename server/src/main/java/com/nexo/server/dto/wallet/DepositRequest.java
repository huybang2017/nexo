package com.nexo.server.dto.wallet;

import com.nexo.server.enums.PaymentProvider;
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
public class DepositRequest {

    @NotNull(message = "Amount is required")
    @DecimalMin(value = "10000", message = "Minimum deposit amount is 10,000 VND")
    private BigDecimal amount;

    @NotNull(message = "Payment provider is required")
    private PaymentProvider provider;

    private String bankCode;

    private String returnUrl;
}

