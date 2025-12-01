package com.nexo.server.dto.admin;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AuditLogResponse {

    private Long id;
    private Long userId;
    private String userEmail;
    private String action;
    private String entityType;
    private Long entityId;
    private String oldValues;
    private String newValues;
    private String ipAddress;
    private String userAgent;
    private String description;
    private LocalDateTime createdAt;
}


