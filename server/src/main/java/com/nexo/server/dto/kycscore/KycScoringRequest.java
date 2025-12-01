package com.nexo.server.dto.kycscore;

import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class KycScoringRequest {
    private Long kycProfileId;
    private Long userId;
    
    // Metadata for scoring
    private String submissionIp;
    private String deviceFingerprint;
    private String userAgent;
    private Long submissionDurationMs;
    
    // Force recalculation
    private Boolean forceRecalculate;
}


