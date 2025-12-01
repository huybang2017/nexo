package com.nexo.server.dto.admin;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateSystemSettingRequest {

    @NotBlank(message = "Setting value is required")
    private String settingValue;

    private String description;
}


