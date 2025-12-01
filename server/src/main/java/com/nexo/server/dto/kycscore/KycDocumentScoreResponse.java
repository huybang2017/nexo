package com.nexo.server.dto.kycscore;

import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class KycDocumentScoreResponse {
    private Long documentId;
    private String documentType;
    private String fileName;
    
    // Overall score (0-100)
    private Integer totalScore;
    
    // Component scores (0-100)
    private Integer imageQualityScore;
    private Integer ocrAccuracyScore;
    private Integer blurDetectionScore;
    private Integer tamperingDetectionScore;
    private Integer faceQualityScore;
    private Integer dataConsistencyScore;
    private Integer expirationCheckScore;
    
    // OCR data
    private String ocrExtractedName;
    private String ocrExtractedIdNumber;
    private String ocrExtractedDob;
    private BigDecimal ocrConfidence;
    
    // Face match (for selfie)
    private BigDecimal faceMatchScore;
    private BigDecimal faceMatchConfidence;
    
    // AI explanations
    private List<String> aiExplanations;
    
    // Processing info
    private Long processingTimeMs;
    private LocalDateTime scoredAt;
    
    // Duplicate detection
    private Boolean isDuplicate;
    private Long duplicateMatchedProfileId;
}


