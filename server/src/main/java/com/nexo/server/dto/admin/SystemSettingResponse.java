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
public class SystemSettingResponse {

    private Long id;
    private String settingKey;
    private String settingValue;
    private String settingType;
    private String description;
    private String category;
    private Boolean isEditable;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}


