package com.nexo.server.repositories;

import com.nexo.server.entities.PasswordResetToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Optional;

@Repository
public interface PasswordResetTokenRepository extends JpaRepository<PasswordResetToken, Long> {

    Optional<PasswordResetToken> findByToken(String token);

    Optional<PasswordResetToken> findByTokenAndUsedFalse(String token);

    @Modifying
    @Query("DELETE FROM PasswordResetToken t WHERE t.expiryDate < ?1")
    void deleteExpiredTokens(LocalDateTime now);

    @Modifying
    @Query("DELETE FROM PasswordResetToken t WHERE t.user.id = ?1")
    void deleteByUserId(Long userId);
}


