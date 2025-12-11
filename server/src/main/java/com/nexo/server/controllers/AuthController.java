package com.nexo.server.controllers;

import com.nexo.server.dto.auth.*;
import com.nexo.server.dto.common.ApiResponse;
import com.nexo.server.dto.user.UserResponse;
import com.nexo.server.exceptions.ResourceNotFoundException;
import com.nexo.server.exceptions.UnauthorizedException;
import com.nexo.server.security.CurrentUser;
import com.nexo.server.security.UserPrincipal;
import com.nexo.server.services.AuthService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Authentication", description = "Authentication endpoints")
public class AuthController {

    private final AuthService authService;

    @PostMapping("/register")
    @Operation(summary = "Register a new user")
    public ResponseEntity<ApiResponse<AuthResponse>> register(
            @Valid @RequestBody RegisterRequest request,
            HttpServletRequest httpRequest) {
        AuthResponse response = authService.register(request, getClientIp(httpRequest));
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Registration successful", response));
    }

    @PostMapping("/login")
    @Operation(summary = "Login with email and password")
    public ResponseEntity<ApiResponse<AuthResponse>> login(
            @Valid @RequestBody LoginRequest request,
            HttpServletRequest httpRequest) {
        AuthResponse response = authService.login(request, getClientIp(httpRequest));
        return ResponseEntity.ok(ApiResponse.success("Login successful", response));
    }

    @PostMapping("/refresh")
    @Operation(summary = "Refresh access token")
    public ResponseEntity<ApiResponse<TokenResponse>> refreshToken(
            @Valid @RequestBody RefreshTokenRequest request,
            HttpServletRequest httpRequest) {
        TokenResponse response = authService.refreshToken(request, getClientIp(httpRequest));
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PostMapping("/logout")
    @Operation(summary = "Logout and revoke refresh token")
    public ResponseEntity<ApiResponse<Void>> logout(@RequestBody(required = false) RefreshTokenRequest request) {
        authService.logout(request != null ? request.getRefreshToken() : null);
        return ResponseEntity.ok(ApiResponse.success("Logged out successfully"));
    }

    @GetMapping("/me")
    @Operation(summary = "Get current user info")
    public ResponseEntity<ApiResponse<UserResponse>> getCurrentUser(@CurrentUser UserPrincipal userPrincipal) {
        log.debug("GET /me called, UserPrincipal: {}", userPrincipal != null ? "present (id: " + userPrincipal.getId() + ")" : "null");
        
        if (userPrincipal == null) {
            log.warn("UserPrincipal is null in /me endpoint - user not authenticated");
            throw new UnauthorizedException("User not authenticated. Please login again.");
        }
        
        try {
            log.debug("Fetching user for ID: {}", userPrincipal.getId());
            UserResponse response = authService.getCurrentUser(userPrincipal.getId());
            log.debug("User fetched successfully: {}", response.getEmail());
            return ResponseEntity.ok(ApiResponse.success(response));
        } catch (ResourceNotFoundException e) {
            log.error("User not found for ID: {}", userPrincipal.getId(), e);
            throw new UnauthorizedException("User not found. Please login again.");
        } catch (Exception e) {
            log.error("Unexpected error getting current user for user ID: {}", userPrincipal.getId(), e);
            throw e;
        }
    }

    private String getClientIp(HttpServletRequest request) {
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isEmpty()) {
            return xForwardedFor.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }
}
