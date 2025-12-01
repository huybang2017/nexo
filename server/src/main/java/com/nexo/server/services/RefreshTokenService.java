package com.nexo.server.services;

import com.nexo.server.dto.auth.TokenResponse;
import com.nexo.server.entities.RefreshToken;
import com.nexo.server.entities.User;
import com.nexo.server.exceptions.UnauthorizedException;
import com.nexo.server.repositories.RefreshTokenRepository;
import com.nexo.server.repositories.UserRepository;
import com.nexo.server.security.JwtTokenProvider;
import com.nexo.server.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.codec.digest.DigestUtils;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class RefreshTokenService {

    private final RefreshTokenRepository refreshTokenRepository;
    private final UserRepository userRepository;
    private final JwtTokenProvider tokenProvider;

    @Value("${jwt.refresh-token-expiration}")
    private long refreshTokenExpiration;

    private static final int MAX_TOKENS_PER_USER = 5;

    @Transactional
    public String createRefreshToken(Long userId, String ipAddress, String userAgent) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new UnauthorizedException("User not found"));

        // Limit active tokens per user
        List<RefreshToken> existingTokens = refreshTokenRepository.findByUserIdAndRevokedFalse(userId);
        if (existingTokens.size() >= MAX_TOKENS_PER_USER) {
            RefreshToken oldest = existingTokens.get(0);
            oldest.revoke();
            refreshTokenRepository.save(oldest);
        }

        // Generate token
        String token = UUID.randomUUID().toString();
        String tokenHash = hashToken(token);

        RefreshToken refreshToken = RefreshToken.builder()
                .user(user)
                .tokenHash(tokenHash)
                .ipAddress(ipAddress)
                .deviceInfo(parseDeviceInfo(userAgent))
                .expiresAt(LocalDateTime.now().plusSeconds(refreshTokenExpiration / 1000))
                .build();

        refreshTokenRepository.save(refreshToken);

        return token;
    }

    @Transactional
    public TokenResponse refreshAccessToken(String token, String ipAddress) {
        String tokenHash = hashToken(token);

        RefreshToken storedToken = refreshTokenRepository.findByTokenHash(tokenHash)
                .orElseThrow(() -> new UnauthorizedException("Invalid refresh token"));

        // Check if revoked
        if (storedToken.getRevoked()) {
            // Token reuse detected - revoke all user tokens
            revokeAllUserTokens(storedToken.getUser().getId());
            throw new UnauthorizedException("Token has been revoked. Please login again.");
        }

        // Check if expired
        if (storedToken.isExpired()) {
            throw new UnauthorizedException("Refresh token expired");
        }

        // Revoke old token (rotation)
        storedToken.revoke();
        refreshTokenRepository.save(storedToken);

        // Generate new tokens
        User user = storedToken.getUser();
        UserPrincipal userPrincipal = UserPrincipal.create(user);
        String newAccessToken = tokenProvider.generateAccessToken(userPrincipal);
        String newRefreshToken = createRefreshToken(user.getId(), ipAddress, null);

        return TokenResponse.builder()
                .accessToken(newAccessToken)
                .refreshToken(newRefreshToken)
                .expiresIn(tokenProvider.getAccessTokenExpiration() / 1000)
                .build();
    }

    @Transactional
    public void revokeToken(String token) {
        String tokenHash = hashToken(token);
        refreshTokenRepository.findByTokenHash(tokenHash)
                .ifPresent(refreshToken -> {
                    refreshToken.revoke();
                    refreshTokenRepository.save(refreshToken);
                });
    }

    @Transactional
    public void revokeAllUserTokens(Long userId) {
        refreshTokenRepository.revokeAllByUserId(userId, LocalDateTime.now());
        log.info("Revoked all tokens for user: {}", userId);
    }

    private String hashToken(String token) {
        return DigestUtils.sha256Hex(token);
    }

    private String parseDeviceInfo(String userAgent) {
        if (userAgent == null) return "Unknown";
        if (userAgent.length() > 500) return userAgent.substring(0, 500);
        return userAgent;
    }

    @Scheduled(cron = "0 0 2 * * ?") // Run daily at 2 AM
    @Transactional
    public void cleanupExpiredTokens() {
        refreshTokenRepository.deleteExpiredOrRevoked(LocalDateTime.now());
        log.info("Cleaned up expired refresh tokens");
    }
}

