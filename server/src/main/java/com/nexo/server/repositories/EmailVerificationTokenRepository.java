package com.nexo.server.repositories;

import com.nexo.server.entities.EmailVerificationToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Optional;

@Repository
public interface EmailVerificationTokenRepository extends JpaRepository<EmailVerificationToken, Long> {

    Optional<EmailVerificationToken> findByToken(String token);

    Optional<EmailVerificationToken> findByTokenAndUsedFalse(String token);

    @Modifying
    @Query("DELETE FROM EmailVerificationToken t WHERE t.expiryDate < ?1")
    void deleteExpiredTokens(LocalDateTime now);

    @Modifying
    @Query("DELETE FROM EmailVerificationToken t WHERE t.user.id = ?1")
    void deleteByUserId(Long userId);
}


