package com.nexo.server.entities;

import com.nexo.server.enums.KycDocumentType;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "kyc_documents", indexes = {
    @Index(name = "idx_kyc_doc_profile", columnList = "kyc_profile_id"),
    @Index(name = "idx_kyc_doc_hash", columnList = "document_hash"),
    @Index(name = "idx_kyc_doc_perceptual_hash", columnList = "perceptual_hash")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class KycDocument extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "kyc_profile_id", nullable = false)
    private KycProfile kycProfile;

    @Enumerated(EnumType.STRING)
    @Column(name = "document_type", nullable = false)
    private KycDocumentType documentType;

    @Column(name = "file_name", nullable = false)
    private String fileName;

    @Column(name = "file_path", nullable = false, length = 500)
    private String filePath;

    @Column(name = "file_size")
    private Long fileSize;

    @Column(name = "mime_type", length = 100)
    private String mimeType;

    // Document hash for duplicate detection (SHA-256)
    @Column(name = "document_hash", length = 64)
    private String documentHash;

    // Perceptual hash for image similarity detection
    @Column(name = "perceptual_hash", length = 64)
    private String perceptualHash;

    // Extracted ID number for duplicate ID detection
    @Column(name = "extracted_id_number", length = 50)
    private String extractedIdNumber;

    private Boolean verified = false;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "verified_by")
    private User verifiedBy;

    @Column(name = "verified_at")
    private LocalDateTime verifiedAt;

    // Score relationship
    @OneToOne(mappedBy = "kycDocument", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private KycDocumentScore documentScore;
}

