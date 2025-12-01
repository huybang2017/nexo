package com.nexo.server.entities;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "loan_documents", indexes = {
    @Index(name = "idx_loan_doc_loan", columnList = "loan_id")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LoanDocument extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "loan_id", nullable = false)
    private Loan loan;

    @Column(name = "document_type", nullable = false, length = 100)
    private String documentType;

    @Column(name = "file_name", nullable = false)
    private String fileName;

    @Column(name = "file_path", nullable = false, length = 500)
    private String filePath;

    @Column(name = "file_size")
    private Long fileSize;

    @Column(name = "mime_type", length = 100)
    private String mimeType;

    @Column(columnDefinition = "TEXT")
    private String description;
}

