package com.nexo.server.services;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.FileSystemResource;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class KycAiServiceClient {

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    @Value("${ai.service.url:http://localhost:8001}")
    private String aiServiceUrl;

    @Value("${ai.service.enabled:true}")
    private boolean aiServiceEnabled;

    /**
     * Score document using Python AI service
     */
    public DocumentScoreResult scoreDocument(File documentFile, String documentType, File referenceSelfie) {
        if (!aiServiceEnabled) {
            log.warn("AI service is disabled, returning default scores");
            return getDefaultScoreResult();
        }

        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.MULTIPART_FORM_DATA);

            MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
            body.add("file", new FileSystemResource(documentFile));
            body.add("document_type", documentType);
            
            if (referenceSelfie != null && referenceSelfie.exists()) {
                body.add("reference_selfie", new FileSystemResource(referenceSelfie));
            }

            HttpEntity<MultiValueMap<String, Object>> requestEntity = new HttpEntity<>(body, headers);

            String url = aiServiceUrl + "/score-document";
            log.info("Calling AI service: {}", url);

            ResponseEntity<Map> response = restTemplate.exchange(
                    url,
                    HttpMethod.POST,
                    requestEntity,
                    Map.class
            );

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                return mapToDocumentScoreResult(response.getBody());
            } else {
                log.error("AI service returned error: {}", response.getStatusCode());
                return getDefaultScoreResult();
            }

        } catch (Exception e) {
            log.error("Error calling AI service: {}", e.getMessage(), e);
            return getDefaultScoreResult();
        }
    }

    /**
     * Score document from file path
     */
    public DocumentScoreResult scoreDocument(String filePath, String documentType, String referenceSelfiePath) {
        File documentFile = new File(filePath);
        if (!documentFile.exists()) {
            log.error("Document file not found: {}", filePath);
            return getDefaultScoreResult();
        }

        File referenceSelfie = null;
        if (referenceSelfiePath != null) {
            referenceSelfie = new File(referenceSelfiePath);
            if (!referenceSelfie.exists()) {
                referenceSelfie = null;
            }
        }

        return scoreDocument(documentFile, documentType, referenceSelfie);
    }

    /**
     * Check for duplicate documents
     */
    public DuplicateCheckResult checkDuplicate(String documentHash, String perceptualHash, String extractedIdNumber) {
        if (!aiServiceEnabled) {
            return new DuplicateCheckResult(false, 0.0, List.of());
        }

        try {
            Map<String, Object> request = new HashMap<>();
            request.put("document_hash", documentHash);
            request.put("perceptual_hash", perceptualHash);
            if (extractedIdNumber != null) {
                request.put("extracted_id_number", extractedIdNumber);
            }

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<Map<String, Object>> requestEntity = new HttpEntity<>(request, headers);

            String url = aiServiceUrl + "/check-duplicate";
            ResponseEntity<Map> response = restTemplate.exchange(
                    url,
                    HttpMethod.POST,
                    requestEntity,
                    Map.class
            );

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                Map<String, Object> body = response.getBody();
                return new DuplicateCheckResult(
                        (Boolean) body.getOrDefault("is_duplicate", false),
                        ((Number) body.getOrDefault("similarity_score", 0.0)).doubleValue(),
                        (List<String>) body.getOrDefault("matched_hashes", List.of())
                );
            }

        } catch (Exception e) {
            log.error("Error checking duplicate: {}", e.getMessage());
        }

        return new DuplicateCheckResult(false, 0.0, List.of());
    }

    /**
     * Health check
     */
    public boolean isHealthy() {
        if (!aiServiceEnabled) {
            return false;
        }

        try {
            String url = aiServiceUrl + "/health";
            ResponseEntity<Map> response = restTemplate.getForEntity(url, Map.class);
            return response.getStatusCode().is2xxSuccessful();
        } catch (Exception e) {
            log.warn("AI service health check failed: {}", e.getMessage());
            return false;
        }
    }

    private DocumentScoreResult mapToDocumentScoreResult(Map<String, Object> response) {
        DocumentScoreResult result = new DocumentScoreResult();
        
        result.setTotalScore(((Number) response.getOrDefault("total_score", 0)).intValue());
        result.setImageQualityScore(((Number) response.getOrDefault("image_quality_score", 0)).intValue());
        result.setOcrAccuracyScore(((Number) response.getOrDefault("ocr_accuracy_score", 0)).intValue());
        result.setBlurDetectionScore(((Number) response.getOrDefault("blur_detection_score", 0)).intValue());
        result.setTamperingDetectionScore(((Number) response.getOrDefault("tampering_detection_score", 0)).intValue());
        result.setFaceQualityScore(((Number) response.getOrDefault("face_quality_score", 0)).intValue());
        result.setDataConsistencyScore(((Number) response.getOrDefault("data_consistency_score", 0)).intValue());
        result.setExpirationCheckScore(((Number) response.getOrDefault("expiration_check_score", 0)).intValue());
        result.setOcrConfidence(((Number) response.getOrDefault("ocr_confidence", 0.0)).doubleValue());
        
        if (response.containsKey("face_match_score")) {
            result.setFaceMatchScore(((Number) response.get("face_match_score")).doubleValue());
        }
        if (response.containsKey("face_match_confidence")) {
            result.setFaceMatchConfidence(((Number) response.get("face_match_confidence")).doubleValue());
        }
        
        result.setOcrExtractedName((String) response.get("ocr_extracted_name"));
        result.setOcrExtractedIdNumber((String) response.get("ocr_extracted_id_number"));
        result.setOcrExtractedDob((String) response.get("ocr_extracted_dob"));
        result.setTampered((Boolean) response.getOrDefault("is_tampered", false));
        result.setBlurry((Boolean) response.getOrDefault("is_blurry", false));
        result.setExpired((Boolean) response.getOrDefault("is_expired", false));
        result.setDocumentHash((String) response.get("document_hash"));
        result.setPerceptualHash((String) response.get("perceptual_hash"));
        
        @SuppressWarnings("unchecked")
        List<String> explanations = (List<String>) response.getOrDefault("ai_explanations", List.of());
        result.setAiExplanations(explanations);
        
        return result;
    }

    private DocumentScoreResult getDefaultScoreResult() {
        DocumentScoreResult result = new DocumentScoreResult();
        result.setTotalScore(70);
        result.setImageQualityScore(70);
        result.setOcrAccuracyScore(70);
        result.setBlurDetectionScore(70);
        result.setTamperingDetectionScore(70);
        result.setFaceQualityScore(70);
        result.setDataConsistencyScore(70);
        result.setExpirationCheckScore(100);
        result.setOcrConfidence(0.7);
        result.setAiExplanations(List.of("AI service unavailable, using default scores"));
        return result;
    }

    // Inner classes for results
    @lombok.Data
    public static class DocumentScoreResult {
        private int totalScore;
        private int imageQualityScore;
        private int ocrAccuracyScore;
        private int blurDetectionScore;
        private int tamperingDetectionScore;
        private int faceQualityScore;
        private int dataConsistencyScore;
        private int expirationCheckScore;
        private double ocrConfidence;
        private Double faceMatchScore;
        private Double faceMatchConfidence;
        private String ocrExtractedName;
        private String ocrExtractedIdNumber;
        private String ocrExtractedDob;
        private boolean tampered;
        private boolean blurry;
        private boolean expired;
        private String documentHash;
        private String perceptualHash;
        private List<String> aiExplanations;
    }

    @lombok.Data
    public static class DuplicateCheckResult {
        private boolean isDuplicate;
        private double similarityScore;
        private List<String> matchedHashes;

        public DuplicateCheckResult(boolean isDuplicate, double similarityScore, List<String> matchedHashes) {
            this.isDuplicate = isDuplicate;
            this.similarityScore = similarityScore;
            this.matchedHashes = matchedHashes;
        }
    }
}

