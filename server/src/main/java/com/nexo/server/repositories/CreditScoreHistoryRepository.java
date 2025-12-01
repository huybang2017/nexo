package com.nexo.server.repositories;

import com.nexo.server.entities.CreditScoreHistory;
import com.nexo.server.enums.CreditScoreEventType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface CreditScoreHistoryRepository extends JpaRepository<CreditScoreHistory, Long> {

    @Query("SELECT csh FROM CreditScoreHistory csh WHERE csh.user.id = :userId ORDER BY csh.createdAt DESC")
    List<CreditScoreHistory> findByUserIdOrderByCreatedAtDesc(@Param("userId") Long userId);

    @Query("SELECT csh FROM CreditScoreHistory csh WHERE csh.user.id = :userId ORDER BY csh.createdAt DESC")
    Page<CreditScoreHistory> findByUserIdOrderByCreatedAtDesc(@Param("userId") Long userId, Pageable pageable);

    @Query("SELECT csh FROM CreditScoreHistory csh WHERE csh.user.id = :userId AND csh.eventType = :eventType")
    List<CreditScoreHistory> findByUserIdAndEventType(@Param("userId") Long userId, @Param("eventType") CreditScoreEventType eventType);

    @Query("SELECT csh FROM CreditScoreHistory csh WHERE csh.user.id = :userId " +
           "AND csh.createdAt >= :startDate AND csh.createdAt <= :endDate " +
           "ORDER BY csh.createdAt DESC")
    List<CreditScoreHistory> findByUserIdAndDateRange(
            @Param("userId") Long userId,
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate);

    @Query("SELECT csh FROM CreditScoreHistory csh WHERE csh.relatedLoanId = :loanId ORDER BY csh.createdAt DESC")
    List<CreditScoreHistory> findByRelatedLoanId(@Param("loanId") Long loanId);

    @Query("SELECT SUM(csh.scoreChange) FROM CreditScoreHistory csh WHERE csh.user.id = :userId")
    Integer getTotalScoreChange(@Param("userId") Long userId);

    @Query("SELECT csh.eventType, COUNT(csh) FROM CreditScoreHistory csh " +
           "WHERE csh.user.id = :userId GROUP BY csh.eventType")
    List<Object[]> countEventsByType(@Param("userId") Long userId);

    @Query("SELECT csh FROM CreditScoreHistory csh WHERE csh.user.id = :userId " +
           "ORDER BY csh.createdAt DESC")
    List<CreditScoreHistory> findRecentHistory(@Param("userId") Long userId, Pageable pageable);
}

