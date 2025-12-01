package com.nexo.server.dto.loan;

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
public class LoanReviewRequest {

    public enum ReviewAction {
        APPROVE, REJECT
    }

    @NotNull(message = "Action is required")
    private ReviewAction action;

    private String rejectionReason;

    private BigDecimal adjustedInterestRate;

    private String note;
}

