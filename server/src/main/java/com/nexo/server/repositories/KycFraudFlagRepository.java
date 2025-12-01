package com.nexo.server.repositories;

import com.nexo.server.entities.KycFraudFlag;
import com.nexo.server.enums.KycFraudType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface KycFraudFlagRepository extends JpaRepository<KycFraudFlag, Long> {

    List<KycFraudFlag> findByKycProfileId(Long profileId);

    List<KycFraudFlag> findByKycProfileIdAndIsResolvedFalse(Long profileId);

    List<KycFraudFlag> findByKycProfileIdAndIsCriticalTrue(Long profileId);

    List<KycFraudFlag> findByKycDocumentId(Long documentId);

    List<KycFraudFlag> findByFraudType(KycFraudType fraudType);

    @Query("SELECT SUM(ff.scorePenalty) FROM KycFraudFlag ff WHERE ff.kycProfile.id = :profileId AND ff.isResolved = false")
    Integer getTotalPenaltyByProfileId(@Param("profileId") Long profileId);

    @Query("SELECT COUNT(ff) FROM KycFraudFlag ff WHERE ff.kycProfile.id = :profileId AND ff.isCritical = true AND ff.isResolved = false")
    Long countCriticalFlagsByProfileId(@Param("profileId") Long profileId);

    @Query("SELECT COUNT(ff) FROM KycFraudFlag ff WHERE ff.kycProfile.id = :profileId AND ff.isResolved = false")
    Long countUnresolvedFlagsByProfileId(@Param("profileId") Long profileId);

    boolean existsByKycProfileIdAndFraudType(Long profileId, KycFraudType fraudType);
}


