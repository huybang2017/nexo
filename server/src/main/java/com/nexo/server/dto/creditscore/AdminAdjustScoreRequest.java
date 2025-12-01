package com.nexo.server.dto.creditscore;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminAdjustScoreRequest {
    
    @NotNull(message = "Score adjustment is required")
    @Min(value = -500, message = "Adjustment cannot be less than -500")
    @Max(value = 500, message = "Adjustment cannot be more than 500")
    private Integer adjustment;
    
    @NotBlank(message = "Reason is required")
    private String reason;
    
    private String metadata;
}

