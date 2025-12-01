package com.nexo.server.controllers;

import com.nexo.server.dto.common.ApiResponse;
import com.nexo.server.security.CurrentUser;
import com.nexo.server.security.UserPrincipal;
import com.nexo.server.services.EmailVerificationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/email")
@RequiredArgsConstructor
@Tag(name = "Email Verification", description = "Email verification APIs")
public class EmailVerificationController {

    private final EmailVerificationService emailVerificationService;

    @PostMapping("/verify")
    @Operation(summary = "Verify email with token")
    public ResponseEntity<ApiResponse<Void>> verifyEmail(@RequestParam String token) {
        emailVerificationService.verifyEmail(token);
        return ResponseEntity.ok(ApiResponse.success("Email verified successfully", null));
    }

    @PostMapping("/resend")
    @Operation(summary = "Resend verification email")
    public ResponseEntity<ApiResponse<Void>> resendVerificationEmail(@CurrentUser UserPrincipal currentUser) {
        emailVerificationService.resendVerificationEmail(currentUser.getId());
        return ResponseEntity.ok(ApiResponse.success("Verification email sent", null));
    }
}


