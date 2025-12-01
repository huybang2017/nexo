package com.nexo.server.entities;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

@Entity
@Table(name = "kyc_document_scores", indexes = {
    @Index(name = "idx_kyc_doc_score_doc", columnList = "kyc_document_id"),
    @Index(name = "idx_kyc_doc_score_profile", columnList = "kyc_profile_id")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class KycDocumentScore extends BaseEntity {

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "kyc_document_id", nullable = false)
    private KycDocument kycDocument;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "kyc_profile_id", nullable = false)
    private KycProfile kycProfile;

    // Overall document score (0-100)
    @Column(name = "total_score", nullable = false)
    @Builder.Default
    private Integer totalScore = 0;

    // Component scores (0-100 each)
    @Column(name = "image_quality_score")
    @Builder.Default
    private Integer imageQualityScore = 0;

    @Column(name = "ocr_accuracy_score")
    @Builder.Default
    private Integer ocrAccuracyScore = 0;

    @Column(name = "blur_detection_score")
    @Builder.Default
    private Integer blurDetectionScore = 0;

    @Column(name = "tampering_detection_score")
    @Builder.Default
    private Integer tamperingDetectionScore = 0;

    @Column(name = "face_quality_score")
    @Builder.Default
    private Integer faceQualityScore = 0;

    @Column(name = "data_consistency_score")
    @Builder.Default
    private Integer dataConsistencyScore = 0;

    @Column(name = "expiration_check_score")
    @Builder.Default
    private Integer expirationCheckScore = 0;

    // OCR extracted data
    @Column(name = "ocr_extracted_name")
    private String ocrExtractedName;

    @Column(name = "ocr_extracted_id_number")
    private String ocrExtractedIdNumber;

    @Column(name = "ocr_extracted_dob")
    private String ocrExtractedDob;

    @Column(name = "ocr_confidence", precision = 5, scale = 2)
    @Builder.Default
    private BigDecimal ocrConfidence = BigDecimal.ZERO;

    // Face match data (for selfie)
    @Column(name = "face_match_score", precision = 5, scale = 2)
    @Builder.Default
    private BigDecimal faceMatchScore = BigDecimal.ZERO;

    @Column(name = "face_match_confidence", precision = 5, scale = 2)
    @Builder.Default
    private BigDecimal faceMatchConfidence = BigDecimal.ZERO;

    // AI explanations
    @Column(name = "ai_explanations", columnDefinition = "TEXT")
    private String aiExplanations;

    @Column(name = "processing_time_ms")
    private Long processingTimeMs;

    // Methods
    public void calculateTotalScore() {
        // Weighted calculation
        double score = 0;
        score += imageQualityScore * 0.15;
        score += ocrAccuracyScore * 0.25;
        score += blurDetectionScore * 0.10;
        score += tamperingDetectionScore * 0.25;
        score += faceQualityScore * 0.10;
        score += dataConsistencyScore * 0.10;
        score += expirationCheckScore * 0.05;
        this.totalScore = (int) Math.round(score);
    }
}


