package com.nexo.server.dto.kyc;

import com.nexo.server.enums.KycDocumentType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class KycDocumentResponse {

    private Long id;
    private KycDocumentType documentType;
    private String fileName;
    private String fileUrl;
    private Long fileSize;
    private Boolean verified;
    private LocalDateTime verifiedAt;
    private LocalDateTime createdAt;
}

