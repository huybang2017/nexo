package com.nexo.server.dto.user;

import com.nexo.server.enums.KycStatus;
import com.nexo.server.enums.UserRole;
import com.nexo.server.enums.UserStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserResponse {

    private Long id;
    private String uuid;
    private String email;
    private String firstName;
    private String lastName;
    private String fullName;
    private String phone;
    private String avatarUrl;
    private LocalDate dateOfBirth;
    private UserRole role;
    private UserStatus status;
    private KycStatus kycStatus;
    private Boolean emailVerified;
    private Integer creditScore;
    private String oauthProvider;
    private LocalDateTime lastLoginAt;
    private LocalDateTime createdAt;
}

