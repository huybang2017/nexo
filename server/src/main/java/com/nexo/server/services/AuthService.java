package com.nexo.server.services;

import com.nexo.server.dto.auth.*;
import com.nexo.server.dto.user.UserResponse;
import com.nexo.server.entities.User;
import com.nexo.server.entities.Wallet;
import com.nexo.server.enums.KycStatus;
import com.nexo.server.enums.UserStatus;
import com.nexo.server.exceptions.BadRequestException;
import com.nexo.server.exceptions.ResourceNotFoundException;
import com.nexo.server.exceptions.UnauthorizedException;
import com.nexo.server.repositories.UserRepository;
import com.nexo.server.repositories.WalletRepository;
import com.nexo.server.security.JwtTokenProvider;
import com.nexo.server.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthService {

    private final UserRepository userRepository;
    private final WalletRepository walletRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtTokenProvider tokenProvider;
    private final RefreshTokenService refreshTokenService;
    private final UserMapper userMapper;
    private final EmailService emailService;
    private final EmailVerificationService emailVerificationService;

    @Transactional
    public AuthResponse register(RegisterRequest request, String ipAddress) {
        // Validate passwords match
        if (!request.getPassword().equals(request.getConfirmPassword())) {
            throw new BadRequestException("Passwords do not match");
        }

        // Check if email exists
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new BadRequestException("Email already registered");
        }

        // Create user
        User user = User.builder()
                .email(request.getEmail())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .firstName(request.getFirstName())
                .lastName(request.getLastName())
                .phone(request.getPhone())
                .role(request.getRole())
                .status(UserStatus.ACTIVE) // TODO: Change to PENDING when email verification is implemented
                .emailVerified(false)
                .kycStatus(KycStatus.NOT_SUBMITTED)
                .creditScore(0)
                .build();

        user = userRepository.save(user);

        // Create wallet
        Wallet wallet = Wallet.builder()
                .user(user)
                .build();
        walletRepository.save(wallet);

        log.info("New user registered: {}", user.getEmail());

        // Send welcome email and verification email
        try {
            emailService.sendWelcomeEmail(user);
            emailVerificationService.sendVerificationEmail(user);
        } catch (Exception e) {
            log.error("Failed to send welcome/verification email: {}", e.getMessage());
        }

        // Generate tokens and return
        return generateAuthResponse(user, ipAddress);
    }

    public AuthResponse login(LoginRequest request, String ipAddress) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
        );

        UserPrincipal userPrincipal = (UserPrincipal) authentication.getPrincipal();
        
        User user = userRepository.findById(userPrincipal.getId())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        // Check user status
        if (user.getStatus() == UserStatus.BANNED) {
            throw new UnauthorizedException("Your account has been banned");
        }
        if (user.getStatus() == UserStatus.SUSPENDED) {
            throw new UnauthorizedException("Your account has been suspended");
        }

        // Update last login
        user.setLastLoginAt(LocalDateTime.now());
        userRepository.save(user);

        log.info("User logged in: {}", user.getEmail());

        return generateAuthResponse(user, ipAddress);
    }

    public TokenResponse refreshToken(RefreshTokenRequest request, String ipAddress) {
        return refreshTokenService.refreshAccessToken(request.getRefreshToken(), ipAddress);
    }

    @Transactional
    public void logout(String refreshToken) {
        if (refreshToken != null) {
            refreshTokenService.revokeToken(refreshToken);
        }
    }

    public UserResponse getCurrentUser(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", userId));
        return userMapper.toResponse(user);
    }

    private AuthResponse generateAuthResponse(User user, String ipAddress) {
        UserPrincipal userPrincipal = UserPrincipal.create(user);
        String accessToken = tokenProvider.generateAccessToken(userPrincipal);
        String refreshToken = refreshTokenService.createRefreshToken(user.getId(), ipAddress, null);

        return AuthResponse.of(
                accessToken,
                refreshToken,
                tokenProvider.getAccessTokenExpiration() / 1000,
                userMapper.toResponse(user)
        );
    }
}
