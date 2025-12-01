package com.nexo.server.repositories;

import com.nexo.server.entities.CreditScore;
import com.nexo.server.enums.RiskLevel;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CreditScoreRepository extends JpaRepository<CreditScore, Long> {

    Optional<CreditScore> findByUserId(Long userId);

    boolean existsByUserId(Long userId);

    @Query("SELECT cs FROM CreditScore cs WHERE cs.totalScore >= :minScore AND cs.totalScore <= :maxScore")
    List<CreditScore> findByScoreRange(@Param("minScore") int minScore, @Param("maxScore") int maxScore);

    @Query("SELECT cs FROM CreditScore cs WHERE cs.riskLevel = :riskLevel")
    List<CreditScore> findByRiskLevel(@Param("riskLevel") RiskLevel riskLevel);

    @Query("SELECT cs FROM CreditScore cs WHERE cs.isEligibleForLoan = true")
    List<CreditScore> findAllEligibleForLoan();

    @Query("SELECT AVG(cs.totalScore) FROM CreditScore cs")
    Double findAverageScore();

    @Query("SELECT cs.riskLevel, COUNT(cs) FROM CreditScore cs GROUP BY cs.riskLevel")
    List<Object[]> countByRiskLevel();

    @Query("SELECT cs FROM CreditScore cs WHERE cs.nextReviewAt <= CURRENT_TIMESTAMP")
    List<CreditScore> findDueForReview();
}

