package com.nexo.server.dto.kycscore;

import lombok.*;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DuplicateCheckResponse {
    private Boolean isDuplicate;
    private String duplicateType; // EXACT_HASH, SIMILAR_IMAGE, SAME_ID_NUMBER
    private List<DuplicateMatch> matches;
    private String recommendation;
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DuplicateMatch {
        private Long matchedProfileId;
        private Long matchedDocumentId;
        private Long matchedUserId;
        private String matchedUserEmail;
        private String matchType;
        private Double similarityScore;
        private LocalDateTime matchedDocumentCreatedAt;
    }
}


