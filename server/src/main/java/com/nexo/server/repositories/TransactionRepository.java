package com.nexo.server.repositories;

import com.nexo.server.entities.Transaction;
import com.nexo.server.enums.TransactionStatus;
import com.nexo.server.enums.TransactionType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface TransactionRepository extends JpaRepository<Transaction, Long> {

    Optional<Transaction> findByReferenceCode(String referenceCode);

    boolean existsByReferenceCode(String referenceCode);

    Page<Transaction> findByUserId(Long userId, Pageable pageable);

    Page<Transaction> findByWalletId(Long walletId, Pageable pageable);

    Page<Transaction> findByUserIdAndType(Long userId, TransactionType type, Pageable pageable);

    Page<Transaction> findByUserIdAndStatus(Long userId, TransactionStatus status, Pageable pageable);

    @Query("SELECT t FROM Transaction t WHERE t.user.id = :userId " +
           "AND (:type IS NULL OR t.type = :type) " +
           "AND (:status IS NULL OR t.status = :status) " +
           "AND (:fromDate IS NULL OR t.createdAt >= :fromDate) " +
           "AND (:toDate IS NULL OR t.createdAt <= :toDate)")
    Page<Transaction> findByUserIdWithFilters(
            @Param("userId") Long userId,
            @Param("type") TransactionType type,
            @Param("status") TransactionStatus status,
            @Param("fromDate") LocalDateTime fromDate,
            @Param("toDate") LocalDateTime toDate,
            Pageable pageable);

    @Query("SELECT SUM(t.amount) FROM Transaction t WHERE t.user.id = :userId " +
           "AND t.type = :type AND t.status = 'COMPLETED'")
    BigDecimal sumAmountByUserIdAndType(@Param("userId") Long userId, @Param("type") TransactionType type);

    List<Transaction> findByLoanId(Long loanId);

    List<Transaction> findByInvestmentId(Long investmentId);

    Page<Transaction> findByType(TransactionType type, Pageable pageable);

    Page<Transaction> findByTypeAndStatus(TransactionType type, TransactionStatus status, Pageable pageable);

    @Query("SELECT t FROM Transaction t JOIN FETCH t.user WHERE t.type = :type")
    Page<Transaction> findByTypeWithUser(@Param("type") TransactionType type, Pageable pageable);

    @Query("SELECT t FROM Transaction t JOIN FETCH t.user WHERE t.type = :type AND t.status = :status")
    Page<Transaction> findByTypeAndStatusWithUser(
            @Param("type") TransactionType type,
            @Param("status") TransactionStatus status,
            Pageable pageable);
}

