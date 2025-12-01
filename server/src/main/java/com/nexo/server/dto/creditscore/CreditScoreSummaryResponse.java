package com.nexo.server.dto.creditscore;

import lombok.*;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreditScoreSummaryResponse {
    private Integer totalScore;
    private Integer maxScore;
    private String riskLevel;
    private String riskGrade;
    private Boolean isEligibleForLoan;
    private BigDecimal maxLoanAmount;
    
    // Quick stats
    private Integer scoreChange30Days;
    private Integer recentEventsCount;
    private String trend; // UP, DOWN, STABLE
}

