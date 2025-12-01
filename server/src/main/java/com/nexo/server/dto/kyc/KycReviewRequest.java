package com.nexo.server.dto.kyc;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class KycReviewRequest {

    public enum ReviewAction {
        APPROVE, REJECT
    }

    @NotNull(message = "Action is required")
    private ReviewAction action;

    private String rejectionReason;
}

