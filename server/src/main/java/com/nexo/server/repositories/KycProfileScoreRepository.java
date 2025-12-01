package com.nexo.server.repositories;

import com.nexo.server.entities.KycProfileScore;
import com.nexo.server.enums.KycRiskLevel;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface KycProfileScoreRepository extends JpaRepository<KycProfileScore, Long> {

    Optional<KycProfileScore> findByKycProfileId(Long profileId);

    Optional<KycProfileScore> findByUserId(Long userId);

    List<KycProfileScore> findByRiskLevel(KycRiskLevel riskLevel);

    Page<KycProfileScore> findByRiskLevel(KycRiskLevel riskLevel, Pageable pageable);

    @Query("SELECT ps FROM KycProfileScore ps WHERE ps.totalScore < :threshold ORDER BY ps.totalScore ASC")
    List<KycProfileScore> findLowScoreProfiles(@Param("threshold") Integer threshold);

    @Query("SELECT ps FROM KycProfileScore ps WHERE ps.criticalFlagsCount > 0 ORDER BY ps.criticalFlagsCount DESC")
    List<KycProfileScore> findProfilesWithCriticalFlags();

    @Query("SELECT AVG(ps.totalScore) FROM KycProfileScore ps")
    Double getAverageScore();

    @Query("SELECT COUNT(ps) FROM KycProfileScore ps WHERE ps.riskLevel = :riskLevel")
    Long countByRiskLevel(@Param("riskLevel") KycRiskLevel riskLevel);
}


