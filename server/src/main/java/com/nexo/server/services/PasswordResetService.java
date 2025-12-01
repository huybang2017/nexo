package com.nexo.server.services;

import com.nexo.server.entities.PasswordResetToken;
import com.nexo.server.entities.User;
import com.nexo.server.exceptions.BadRequestException;
import com.nexo.server.exceptions.ResourceNotFoundException;
import com.nexo.server.repositories.PasswordResetTokenRepository;
import com.nexo.server.repositories.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class PasswordResetService {

    private final PasswordResetTokenRepository tokenRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final EmailService emailService;

    @Value("${app.password-reset.token-expiry-hours:24}")
    private int tokenExpiryHours;

    @Value("${app.frontend-url:http://localhost:3000}")
    private String frontendUrl;

    /**
     * Request password reset - sends email with reset link
     */
    @Transactional
    public void requestPasswordReset(String email) {
        User user = userRepository.findByEmail(email).orElse(null);

        // Don't reveal if email exists or not for security
        if (user == null) {
            log.warn("Password reset requested for non-existent email: {}", email);
            return;
        }

        // Delete any existing tokens for this user
        tokenRepository.deleteByUserId(user.getId());

        // Create new token
        String token = UUID.randomUUID().toString();
        PasswordResetToken resetToken = PasswordResetToken.builder()
                .token(token)
                .user(user)
                .expiryDate(LocalDateTime.now().plusHours(tokenExpiryHours))
                .build();
        tokenRepository.save(resetToken);

        // Send email
        String resetLink = frontendUrl + "/reset-password?token=" + token;
        try {
            emailService.sendPasswordResetEmail(user.getEmail(), user.getFirstName(), resetLink);
            log.info("Password reset email sent to: {}", email);
        } catch (Exception e) {
            log.error("Failed to send password reset email: {}", e.getMessage());
            throw new BadRequestException("Failed to send password reset email. Please try again.");
        }
    }

    /**
     * Validate reset token
     */
    public boolean validateToken(String token) {
        return tokenRepository.findByTokenAndUsedFalse(token)
                .map(t -> !t.isExpired())
                .orElse(false);
    }

    /**
     * Reset password with token
     */
    @Transactional
    public void resetPassword(String token, String newPassword) {
        PasswordResetToken resetToken = tokenRepository.findByTokenAndUsedFalse(token)
                .orElseThrow(() -> new BadRequestException("Invalid or expired reset token"));

        if (resetToken.isExpired()) {
            throw new BadRequestException("Reset token has expired");
        }

        User user = resetToken.getUser();
        user.setPasswordHash(passwordEncoder.encode(newPassword));
        userRepository.save(user);

        // Mark token as used
        resetToken.setUsed(true);
        tokenRepository.save(resetToken);

        // Send confirmation email
        try {
            emailService.sendPasswordChangedEmail(user.getEmail(), user.getFirstName());
        } catch (Exception e) {
            log.error("Failed to send password changed email: {}", e.getMessage());
        }

        log.info("Password reset completed for user: {}", user.getEmail());
    }

    /**
     * Cleanup expired tokens (scheduled task)
     */
    @Transactional
    public void cleanupExpiredTokens() {
        tokenRepository.deleteExpiredTokens(LocalDateTime.now());
        log.info("Cleaned up expired password reset tokens");
    }
}


