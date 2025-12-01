package com.nexo.server.services;

import com.nexo.server.dto.user.UserResponse;
import com.nexo.server.entities.User;
import org.springframework.stereotype.Component;

@Component
public class UserMapper {

    public UserResponse toResponse(User user) {
        if (user == null) return null;
        
        return UserResponse.builder()
                .id(user.getId())
                .uuid(user.getUuid())
                .email(user.getEmail())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .fullName(user.getFullName())
                .phone(user.getPhone())
                .avatarUrl(user.getAvatarUrl())
                .dateOfBirth(user.getDateOfBirth())
                .role(user.getRole())
                .status(user.getStatus())
                .kycStatus(user.getKycStatus())
                .emailVerified(user.getEmailVerified())
                .creditScore(user.getCreditScore())
                .oauthProvider(user.getOauthProvider())
                .lastLoginAt(user.getLastLoginAt())
                .createdAt(user.getCreatedAt())
                .build();
    }
}

