package com.nexo.server.services;

import com.nexo.server.dto.user.UserResponse;
import com.nexo.server.entities.User;
import org.hibernate.proxy.HibernateProxy;
import org.springframework.stereotype.Component;

@Component
public class UserMapper {

    public UserResponse toResponse(User user) {
        if (user == null) return null;
        
        // Handle Hibernate proxy - access fields to force initialization
        try {
            // Access all fields to ensure they're loaded
            Long id = user.getId();
            String uuid = user.getUuid();
            String email = user.getEmail();
            String firstName = user.getFirstName();
            String lastName = user.getLastName();
            String fullName = user.getFullName();
            String phone = user.getPhone();
            String avatarUrl = user.getAvatarUrl();
            java.time.LocalDate dateOfBirth = user.getDateOfBirth();
            com.nexo.server.enums.UserRole role = user.getRole();
            com.nexo.server.enums.UserStatus status = user.getStatus();
            com.nexo.server.enums.KycStatus kycStatus = user.getKycStatus();
            Boolean emailVerified = user.getEmailVerified();
            Integer creditScore = user.getCreditScore();
            String oauthProvider = user.getOauthProvider();
            java.time.LocalDateTime lastLoginAt = user.getLastLoginAt();
            java.time.LocalDateTime createdAt = user.getCreatedAt();
            
            return UserResponse.builder()
                    .id(id)
                    .uuid(uuid)
                    .email(email)
                    .firstName(firstName)
                    .lastName(lastName)
                    .fullName(fullName)
                    .phone(phone)
                    .avatarUrl(avatarUrl)
                    .dateOfBirth(dateOfBirth)
                    .role(role)
                    .status(status)
                    .kycStatus(kycStatus)
                    .emailVerified(emailVerified)
                    .creditScore(creditScore)
                    .oauthProvider(oauthProvider)
                    .lastLoginAt(lastLoginAt)
                    .createdAt(createdAt)
                    .build();
        } catch (Exception e) {
            // If there's an error accessing proxy, return null
            return null;
        }
    }
}

