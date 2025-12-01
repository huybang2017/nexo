package com.nexo.server.controllers;

import com.nexo.server.dto.common.ApiResponse;
import com.nexo.server.dto.user.ChangePasswordRequest;
import com.nexo.server.dto.user.UpdateProfileRequest;
import com.nexo.server.dto.user.UserResponse;
import com.nexo.server.entities.User;
import com.nexo.server.exceptions.BadRequestException;
import com.nexo.server.exceptions.ResourceNotFoundException;
import com.nexo.server.repositories.UserRepository;
import com.nexo.server.security.CurrentUser;
import com.nexo.server.security.UserPrincipal;
import com.nexo.server.services.FileStorageService;
import com.nexo.server.services.UserMapper;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
@Tag(name = "User", description = "User profile APIs")
public class UserController {

    private final UserRepository userRepository;
    private final UserMapper userMapper;
    private final PasswordEncoder passwordEncoder;
    private final FileStorageService fileStorageService;

    @GetMapping("/me")
    @Operation(summary = "Get current user profile")
    public ResponseEntity<ApiResponse<UserResponse>> getCurrentUser(@CurrentUser UserPrincipal currentUser) {
        User user = userRepository.findById(currentUser.getId())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        return ResponseEntity.ok(ApiResponse.success(userMapper.toResponse(user)));
    }

    @PutMapping("/me")
    @Operation(summary = "Update current user profile")
    public ResponseEntity<ApiResponse<UserResponse>> updateProfile(
            @CurrentUser UserPrincipal currentUser,
            @Valid @RequestBody UpdateProfileRequest request) {
        User user = userRepository.findById(currentUser.getId())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        if (request.getFirstName() != null) {
            user.setFirstName(request.getFirstName());
        }
        if (request.getLastName() != null) {
            user.setLastName(request.getLastName());
        }
        if (request.getPhone() != null) {
            user.setPhone(request.getPhone());
        }
        if (request.getDateOfBirth() != null) {
            user.setDateOfBirth(request.getDateOfBirth());
        }

        userRepository.save(user);
        return ResponseEntity.ok(ApiResponse.success("Profile updated successfully", userMapper.toResponse(user)));
    }

    @PostMapping(value = "/me/avatar", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "Upload avatar")
    public ResponseEntity<ApiResponse<UserResponse>> uploadAvatar(
            @CurrentUser UserPrincipal currentUser,
            @RequestParam("file") MultipartFile file) {
        User user = userRepository.findById(currentUser.getId())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        // Delete old avatar if exists
        if (user.getAvatarUrl() != null) {
            fileStorageService.deleteFile(user.getAvatarUrl().replace("/api/files/", ""));
        }

        // Store new avatar
        String filePath = fileStorageService.storeAvatar(file, user.getId());
        user.setAvatarUrl(fileStorageService.getFileUrl(filePath));
        userRepository.save(user);

        return ResponseEntity.ok(ApiResponse.success("Avatar updated successfully", userMapper.toResponse(user)));
    }

    @PostMapping("/me/password")
    @Operation(summary = "Change password")
    public ResponseEntity<ApiResponse<Void>> changePassword(
            @CurrentUser UserPrincipal currentUser,
            @Valid @RequestBody ChangePasswordRequest request) {
        User user = userRepository.findById(currentUser.getId())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        // Check if user logged in via OAuth (no password)
        if (user.getOauthProvider() != null && !user.getOauthProvider().isEmpty()) {
            throw new BadRequestException("Cannot change password for OAuth accounts. Please use your OAuth provider to manage your password.");
        }

        // Check if user has a password
        if (user.getPasswordHash() == null || user.getPasswordHash().isEmpty()) {
            throw new BadRequestException("No password set for this account. Cannot change password.");
        }

        // Verify current password
        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPasswordHash())) {
            throw new BadRequestException("Current password is incorrect");
        }

        // Verify new password match
        if (!request.getNewPassword().equals(request.getConfirmPassword())) {
            throw new BadRequestException("New password and confirm password do not match");
        }

        // Check new password is different
        if (passwordEncoder.matches(request.getNewPassword(), user.getPasswordHash())) {
            throw new BadRequestException("New password must be different from current password");
        }

        // Update password
        user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);

        return ResponseEntity.ok(ApiResponse.success("Password changed successfully", null));
    }

    @DeleteMapping("/me/avatar")
    @Operation(summary = "Delete avatar")
    public ResponseEntity<ApiResponse<UserResponse>> deleteAvatar(@CurrentUser UserPrincipal currentUser) {
        User user = userRepository.findById(currentUser.getId())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        if (user.getAvatarUrl() != null) {
            fileStorageService.deleteFile(user.getAvatarUrl().replace("/api/files/", ""));
            user.setAvatarUrl(null);
            userRepository.save(user);
        }

        return ResponseEntity.ok(ApiResponse.success("Avatar deleted successfully", userMapper.toResponse(user)));
    }
}


