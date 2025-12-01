package com.nexo.server.dto.admin;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SystemSettingRequest {

    @NotBlank(message = "Setting key is required")
    private String settingKey;

    @NotBlank(message = "Setting value is required")
    private String settingValue;

    @NotBlank(message = "Setting type is required")
    private String settingType;

    private String description;

    private String category;

    @NotNull(message = "Is editable is required")
    private Boolean isEditable;
}


