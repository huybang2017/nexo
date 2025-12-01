package com.nexo.server.dto.kycscore;

import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class KycScoreSummaryResponse {
    private Long userId;
    private Integer totalScore;
    private Integer maxScore;
    private String riskLevel;
    private String recommendedDecision;
    private Integer fraudFlagsCount;
    private Boolean hasCriticalFlags;
    private String scoreGrade; // A, B, C, D, F
}


