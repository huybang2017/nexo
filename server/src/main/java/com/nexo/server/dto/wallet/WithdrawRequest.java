package com.nexo.server.dto.wallet;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
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
public class WithdrawRequest {

    @NotNull(message = "Amount is required")
    @DecimalMin(value = "50000", message = "Minimum withdrawal amount is 50,000 VND")
    private BigDecimal amount;

    @NotBlank(message = "Bank name is required")
    private String bankName;

    @NotBlank(message = "Bank account number is required")
    private String bankAccountNumber;

    @NotBlank(message = "Bank account holder name is required")
    private String bankAccountHolder;

    private String bankBranch;

    private String note;
}

