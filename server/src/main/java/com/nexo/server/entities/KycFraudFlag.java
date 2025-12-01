package com.nexo.server.entities;

import com.nexo.server.enums.KycFraudType;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "kyc_fraud_flags", indexes = {
    @Index(name = "idx_kyc_fraud_profile", columnList = "kyc_profile_id"),
    @Index(name = "idx_kyc_fraud_type", columnList = "fraud_type"),
    @Index(name = "idx_kyc_fraud_critical", columnList = "is_critical")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class KycFraudFlag extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "kyc_profile_id", nullable = false)
    private KycProfile kycProfile;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "kyc_document_id")
    private KycDocument kycDocument;

    @Enumerated(EnumType.STRING)
    @Column(name = "fraud_type", nullable = false)
    private KycFraudType fraudType;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "score_penalty", nullable = false)
    private Integer scorePenalty;

    @Column(name = "is_critical", nullable = false)
    @Builder.Default
    private Boolean isCritical = false;

    @Column(name = "is_resolved")
    @Builder.Default
    private Boolean isResolved = false;

    @Column(name = "resolved_by")
    private Long resolvedBy;

    @Column(name = "resolution_note", columnDefinition = "TEXT")
    private String resolutionNote;

    // Evidence/details
    @Column(name = "evidence_data", columnDefinition = "TEXT")
    private String evidenceData;

    @Column(name = "confidence_score")
    private Integer confidenceScore;

    // For duplicate detection
    @Column(name = "matched_profile_id")
    private Long matchedProfileId;

    @Column(name = "matched_document_id")
    private Long matchedDocumentId;
}


