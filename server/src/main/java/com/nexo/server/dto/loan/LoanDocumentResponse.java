package com.nexo.server.dto.loan;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LoanDocumentResponse {

    private Long id;
    private Long loanId;
    private String documentType;
    private String fileName;
    private String filePath;
    private String fileUrl;
    private Long fileSize;
    private String mimeType;
    private String description;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}


