package com.nexo.server.entities;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "system_settings", indexes = {
    @Index(name = "idx_setting_key", columnList = "setting_key", unique = true)
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SystemSetting extends BaseEntity {

    @Column(name = "setting_key", nullable = false, unique = true, length = 100)
    private String settingKey;

    @Column(name = "setting_value", columnDefinition = "TEXT")
    private String settingValue;

    @Column(name = "setting_type", nullable = false, length = 50)
    private String settingType; // STRING, NUMBER, BOOLEAN, JSON

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "category", length = 50)
    private String category; // FEE, LIMIT, GENERAL, PAYMENT, etc.

    @Column(name = "is_editable", nullable = false)
    @Builder.Default
    private Boolean isEditable = true;
}


