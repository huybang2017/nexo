package com.nexo.server.repositories;

import com.nexo.server.entities.KycProfile;
import com.nexo.server.enums.KycStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface KycProfileRepository extends JpaRepository<KycProfile, Long> {

    Optional<KycProfile> findByUserId(Long userId);

    boolean existsByUserId(Long userId);

    Page<KycProfile> findByStatus(KycStatus status, Pageable pageable);

    @Query("SELECT k FROM KycProfile k JOIN FETCH k.user WHERE k.id = :id")
    Optional<KycProfile> findByIdWithUser(@Param("id") Long id);

    @Query("SELECT k FROM KycProfile k JOIN FETCH k.user JOIN FETCH k.documents WHERE k.id = :id")
    Optional<KycProfile> findByIdWithUserAndDocuments(@Param("id") Long id);

    @Query("SELECT COUNT(k) FROM KycProfile k WHERE k.status = :status")
    long countByStatus(@Param("status") KycStatus status);

    // For duplicate ID card detection
    List<KycProfile> findByIdCardNumber(String idCardNumber);

    // Check if ID card number exists
    boolean existsByIdCardNumber(String idCardNumber);

    // Find profiles with same ID card number (excluding current profile)
    @Query("SELECT k FROM KycProfile k WHERE k.idCardNumber = :idCardNumber AND k.id != :excludeId")
    List<KycProfile> findDuplicateIdCardProfiles(@Param("idCardNumber") String idCardNumber, @Param("excludeId") Long excludeId);
}

