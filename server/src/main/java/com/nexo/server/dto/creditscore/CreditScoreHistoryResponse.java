package com.nexo.server.dto.creditscore;

import lombok.*;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreditScoreHistoryResponse {
    private Long id;
    private Long userId;
    private String eventType;
    private String eventDescription;
    private Integer scoreBefore;
    private Integer scoreAfter;
    private Integer scoreChange;
    private String description;
    private Long relatedLoanId;
    private Long relatedRepaymentId;
    private LocalDateTime createdAt;
}

