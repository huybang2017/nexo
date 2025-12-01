package com.nexo.server.security.oauth2;

import com.nexo.server.entities.User;
import com.nexo.server.entities.Wallet;
import com.nexo.server.enums.KycStatus;
import com.nexo.server.enums.UserRole;
import com.nexo.server.enums.UserStatus;
import com.nexo.server.exceptions.BadRequestException;
import com.nexo.server.repositories.UserRepository;
import com.nexo.server.repositories.WalletRepository;
import com.nexo.server.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class CustomOAuth2UserService extends DefaultOAuth2UserService {

    private final UserRepository userRepository;
    private final WalletRepository walletRepository;

    @Override
    @Transactional
    public OAuth2User loadUser(OAuth2UserRequest userRequest) throws OAuth2AuthenticationException {
        OAuth2User oauth2User = super.loadUser(userRequest);

        try {
            return processOAuth2User(userRequest, oauth2User);
        } catch (Exception ex) {
            log.error("OAuth2 processing error", ex);
            throw new OAuth2AuthenticationException(ex.getMessage());
        }
    }

    private OAuth2User processOAuth2User(OAuth2UserRequest userRequest, OAuth2User oauth2User) {
        String registrationId = userRequest.getClientRegistration().getRegistrationId();
        
        OAuth2UserInfo userInfo = OAuth2UserInfoFactory.getOAuth2UserInfo(
                registrationId,
                oauth2User.getAttributes()
        );

        if (!StringUtils.hasText(userInfo.getEmail())) {
            throw new BadRequestException("Email not found from OAuth2 provider");
        }

        Optional<User> userOptional = userRepository.findByEmail(userInfo.getEmail());
        User user;

        if (userOptional.isPresent()) {
            user = userOptional.get();
            
            if (user.getOauthProvider() == null) {
                // Link OAuth to existing account
                user.setOauthProvider(registrationId);
                user.setOauthId(userInfo.getId());
                user.setEmailVerified(true);
            } else if (!registrationId.equals(user.getOauthProvider())) {
                throw new BadRequestException("Account already linked with " + user.getOauthProvider());
            }
            
            // Update user info if missing
            updateExistingUser(user, userInfo);
        } else {
            user = registerNewUser(registrationId, userInfo);
        }

        user = userRepository.save(user);
        
        return UserPrincipal.create(user, oauth2User.getAttributes());
    }

    private User registerNewUser(String registrationId, OAuth2UserInfo userInfo) {
        User user = User.builder()
                .uuid(UUID.randomUUID().toString())
                .email(userInfo.getEmail())
                .firstName(userInfo.getFirstName())
                .lastName(userInfo.getLastName())
                .avatarUrl(userInfo.getImageUrl())
                .oauthProvider(registrationId)
                .oauthId(userInfo.getId())
                .role(UserRole.BORROWER)  // Default role
                .status(UserStatus.ACTIVE)
                .emailVerified(true)
                .kycStatus(KycStatus.NOT_SUBMITTED)
                .creditScore(0)
                .build();

        user = userRepository.save(user);

        // Create wallet
        Wallet wallet = Wallet.builder()
                .user(user)
                .build();
        walletRepository.save(wallet);

        log.info("Created new OAuth user: {}", user.getEmail());
        
        return user;
    }

    private void updateExistingUser(User user, OAuth2UserInfo userInfo) {
        if (!StringUtils.hasText(user.getFirstName()) && StringUtils.hasText(userInfo.getFirstName())) {
            user.setFirstName(userInfo.getFirstName());
        }
        if (!StringUtils.hasText(user.getLastName()) && StringUtils.hasText(userInfo.getLastName())) {
            user.setLastName(userInfo.getLastName());
        }
        if (!StringUtils.hasText(user.getAvatarUrl()) && StringUtils.hasText(userInfo.getImageUrl())) {
            user.setAvatarUrl(userInfo.getImageUrl());
        }
    }
}

