package com.nexo.server.services;

import com.nexo.server.dto.admin.SystemSettingRequest;
import com.nexo.server.dto.admin.SystemSettingResponse;
import com.nexo.server.dto.admin.UpdateSystemSettingRequest;
import com.nexo.server.entities.SystemSetting;
import com.nexo.server.exceptions.BadRequestException;
import com.nexo.server.exceptions.ResourceNotFoundException;
import com.nexo.server.repositories.SystemSettingRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class SystemSettingService {

    private final SystemSettingRepository settingRepository;

    public List<SystemSettingResponse> getAllSettings() {
        return settingRepository.findAll().stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    public List<SystemSettingResponse> getSettingsByCategory(String category) {
        return settingRepository.findByCategory(category).stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    public SystemSettingResponse getSettingByKey(String key) {
        SystemSetting setting = settingRepository.findBySettingKey(key)
                .orElseThrow(() -> new ResourceNotFoundException("System setting", "key", key));
        return toResponse(setting);
    }

    public SystemSettingResponse getSettingById(Long id) {
        SystemSetting setting = settingRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("System setting", id));
        return toResponse(setting);
    }

    @Transactional
    public SystemSettingResponse createSetting(SystemSettingRequest request) {
        if (settingRepository.findBySettingKey(request.getSettingKey()).isPresent()) {
            throw new BadRequestException("Setting with key '" + request.getSettingKey() + "' already exists");
        }

        SystemSetting setting = SystemSetting.builder()
                .settingKey(request.getSettingKey())
                .settingValue(request.getSettingValue())
                .settingType(request.getSettingType())
                .description(request.getDescription())
                .category(request.getCategory())
                .isEditable(request.getIsEditable())
                .build();

        setting = settingRepository.save(setting);
        log.info("System setting created: {}", setting.getSettingKey());
        return toResponse(setting);
    }

    @Transactional
    public SystemSettingResponse updateSetting(Long id, UpdateSystemSettingRequest request) {
        SystemSetting setting = settingRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("System setting", id));

        if (!setting.getIsEditable()) {
            throw new BadRequestException("This setting is not editable");
        }

        setting.setSettingValue(request.getSettingValue());
        if (request.getDescription() != null) {
            setting.setDescription(request.getDescription());
        }

        setting = settingRepository.save(setting);
        log.info("System setting updated: {}", setting.getSettingKey());
        return toResponse(setting);
    }

    @Transactional
    public SystemSettingResponse updateSettingByKey(String key, UpdateSystemSettingRequest request) {
        SystemSetting setting = settingRepository.findBySettingKey(key)
                .orElseThrow(() -> new ResourceNotFoundException("System setting", "key", key));

        if (!setting.getIsEditable()) {
            throw new BadRequestException("This setting is not editable");
        }

        setting.setSettingValue(request.getSettingValue());
        if (request.getDescription() != null) {
            setting.setDescription(request.getDescription());
        }

        setting = settingRepository.save(setting);
        log.info("System setting updated: {}", setting.getSettingKey());
        return toResponse(setting);
    }

    @Transactional
    public void deleteSetting(Long id) {
        SystemSetting setting = settingRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("System setting", id));

        if (!setting.getIsEditable()) {
            throw new BadRequestException("This setting cannot be deleted");
        }

        settingRepository.delete(setting);
        log.info("System setting deleted: {}", setting.getSettingKey());
    }

    // Helper methods to get typed values
    public String getStringValue(String key, String defaultValue) {
        return settingRepository.findBySettingKey(key)
                .map(SystemSetting::getSettingValue)
                .orElse(defaultValue);
    }

    public BigDecimal getBigDecimalValue(String key, BigDecimal defaultValue) {
        return settingRepository.findBySettingKey(key)
                .map(s -> new BigDecimal(s.getSettingValue()))
                .orElse(defaultValue);
    }

    public Integer getIntegerValue(String key, Integer defaultValue) {
        return settingRepository.findBySettingKey(key)
                .map(s -> Integer.parseInt(s.getSettingValue()))
                .orElse(defaultValue);
    }

    public Boolean getBooleanValue(String key, Boolean defaultValue) {
        return settingRepository.findBySettingKey(key)
                .map(s -> Boolean.parseBoolean(s.getSettingValue()))
                .orElse(defaultValue);
    }

    private SystemSettingResponse toResponse(SystemSetting setting) {
        return SystemSettingResponse.builder()
                .id(setting.getId())
                .settingKey(setting.getSettingKey())
                .settingValue(setting.getSettingValue())
                .settingType(setting.getSettingType())
                .description(setting.getDescription())
                .category(setting.getCategory())
                .isEditable(setting.getIsEditable())
                .createdAt(setting.getCreatedAt())
                .updatedAt(setting.getUpdatedAt())
                .build();
    }
}


