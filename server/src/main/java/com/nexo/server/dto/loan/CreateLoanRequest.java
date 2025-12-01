package com.nexo.server.dto.loan;

import com.nexo.server.enums.LoanPurpose;
import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateLoanRequest {

    @NotBlank(message = "Title is required")
    @Size(max = 255, message = "Title must not exceed 255 characters")
    private String title;

    @Size(max = 2000, message = "Description must not exceed 2000 characters")
    private String description;

    @NotNull(message = "Purpose is required")
    private LoanPurpose purpose;

    @NotNull(message = "Amount is required")
    @DecimalMin(value = "1000000", message = "Minimum loan amount is 1,000,000 VND")
    @DecimalMax(value = "500000000", message = "Maximum loan amount is 500,000,000 VND")
    private BigDecimal amount;

    @NotNull(message = "Term is required")
    @Min(value = 1, message = "Minimum term is 1 month")
    @Max(value = 60, message = "Maximum term is 60 months")
    private Integer termMonths;
}

