package com.nexo.server.services;

import com.nexo.server.entities.EmailVerificationToken;
import com.nexo.server.entities.User;
import com.nexo.server.exceptions.BadRequestException;
import com.nexo.server.repositories.EmailVerificationTokenRepository;
import com.nexo.server.repositories.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailVerificationService {

    private final EmailVerificationTokenRepository tokenRepository;
    private final UserRepository userRepository;
    private final EmailService emailService;

    @Value("${app.email-verification.token-expiry-hours:48}")
    private int tokenExpiryHours;

    @Value("${app.frontend-url:http://localhost:3000}")
    private String frontendUrl;

    /**
     * Send verification email to user
     */
    @Transactional
    public void sendVerificationEmail(User user) {
        // Delete any existing tokens
        tokenRepository.deleteByUserId(user.getId());

        // Create new token
        String token = UUID.randomUUID().toString();
        EmailVerificationToken verificationToken = EmailVerificationToken.builder()
                .token(token)
                .user(user)
                .expiryDate(LocalDateTime.now().plusHours(tokenExpiryHours))
                .build();
        tokenRepository.save(verificationToken);

        // Send email
        String verifyLink = frontendUrl + "/verify-email?token=" + token;
        try {
            emailService.sendVerificationEmail(user.getEmail(), user.getFirstName(), verifyLink);
            log.info("Verification email sent to: {}", user.getEmail());
        } catch (Exception e) {
            log.error("Failed to send verification email: {}", e.getMessage());
        }
    }

    /**
     * Resend verification email
     */
    @Transactional
    public void resendVerificationEmail(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new BadRequestException("User not found"));

        if (user.getEmailVerified()) {
            throw new BadRequestException("Email is already verified");
        }

        sendVerificationEmail(user);
    }

    /**
     * Verify email with token
     */
    @Transactional
    public void verifyEmail(String token) {
        // First, try to find unused token
        EmailVerificationToken verificationToken = tokenRepository.findByTokenAndUsedFalse(token)
                .orElse(null);

        // If token not found or already used, check if it exists and user is already verified
        if (verificationToken == null) {
            EmailVerificationToken usedToken = tokenRepository.findByToken(token).orElse(null);
            if (usedToken != null && Boolean.TRUE.equals(usedToken.getUser().getEmailVerified())) {
                // Token was already used and email is verified - this is OK (user clicked link again)
                log.info("Email already verified for user: {}", usedToken.getUser().getEmail());
                return; // Success - email already verified
            }
            throw new BadRequestException("Invalid or expired verification token");
        }

        if (verificationToken.isExpired()) {
            throw new BadRequestException("Verification token has expired");
        }

        User user = verificationToken.getUser();
        user.setEmailVerified(true);
        userRepository.save(user);

        // Mark token as used
        verificationToken.setUsed(true);
        tokenRepository.save(verificationToken);

        log.info("Email verified for user: {}", user.getEmail());
    }

    /**
     * Cleanup expired tokens (scheduled task)
     */
    @Transactional
    public void cleanupExpiredTokens() {
        tokenRepository.deleteExpiredTokens(LocalDateTime.now());
        log.info("Cleaned up expired email verification tokens");
    }
}


