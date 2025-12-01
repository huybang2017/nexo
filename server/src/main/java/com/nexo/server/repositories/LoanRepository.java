package com.nexo.server.repositories;

import com.nexo.server.entities.Loan;
import com.nexo.server.enums.LoanPurpose;
import com.nexo.server.enums.LoanStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface LoanRepository extends JpaRepository<Loan, Long> {

    Optional<Loan> findByLoanCode(String loanCode);

    boolean existsByLoanCode(String loanCode);

    Page<Loan> findByBorrowerId(Long borrowerId, Pageable pageable);
    
    List<Loan> findByBorrowerId(Long borrowerId);

    Page<Loan> findByBorrowerIdAndStatus(Long borrowerId, LoanStatus status, Pageable pageable);
    
    List<Loan> findByBorrowerIdAndStatusIn(Long borrowerId, List<LoanStatus> statuses);

    Page<Loan> findByStatus(LoanStatus status, Pageable pageable);

    List<Loan> findByStatusIn(List<LoanStatus> statuses);

    // Marketplace query - loans available for investment
    @Query("SELECT l FROM Loan l WHERE l.status = 'FUNDING' " +
           "AND (:search IS NULL OR :search = '' OR l.loanCode LIKE CONCAT('%', CAST(:search AS string), '%') " +
           "OR l.title LIKE CONCAT('%', CAST(:search AS string), '%') " +
           "OR l.description LIKE CONCAT('%', CAST(:search AS string), '%')) " +
           "AND (:purpose IS NULL OR l.purpose = :purpose) " +
           "AND (:riskGrades IS NULL OR l.riskGrade IN :riskGrades) " +
           "AND (:minRate IS NULL OR l.interestRate >= :minRate) " +
           "AND (:maxRate IS NULL OR l.interestRate <= :maxRate) " +
           "AND (:minAmount IS NULL OR l.requestedAmount >= :minAmount) " +
           "AND (:maxAmount IS NULL OR l.requestedAmount <= :maxAmount) " +
           "AND (:minTerm IS NULL OR l.termMonths >= :minTerm) " +
           "AND (:maxTerm IS NULL OR l.termMonths <= :maxTerm)")
    Page<Loan> findMarketplaceLoans(
            @Param("search") String search,
            @Param("purpose") LoanPurpose purpose,
            @Param("riskGrades") List<String> riskGrades,
            @Param("minRate") BigDecimal minRate,
            @Param("maxRate") BigDecimal maxRate,
            @Param("minAmount") BigDecimal minAmount,
            @Param("maxAmount") BigDecimal maxAmount,
            @Param("minTerm") Integer minTerm,
            @Param("maxTerm") Integer maxTerm,
            Pageable pageable);

    @Query("SELECT l FROM Loan l JOIN FETCH l.borrower WHERE l.id = :id")
    Optional<Loan> findByIdWithBorrower(@Param("id") Long id);

    @Query("SELECT l FROM Loan l JOIN FETCH l.borrower LEFT JOIN FETCH l.investments WHERE l.id = :id")
    Optional<Loan> findByIdWithDetails(@Param("id") Long id);

    // Admin search - fix null parameter type casting issue
    @Query("SELECT l FROM Loan l WHERE " +
           "(:search IS NULL OR :search = '' OR l.loanCode LIKE CONCAT('%', CAST(:search AS string), '%') " +
           "OR l.title LIKE CONCAT('%', CAST(:search AS string), '%')) " +
           "AND (:status IS NULL OR l.status = :status) " +
           "AND (:purpose IS NULL OR l.purpose = :purpose)")
    Page<Loan> searchLoans(
            @Param("search") String search,
            @Param("status") LoanStatus status,
            @Param("purpose") LoanPurpose purpose,
            Pageable pageable);
    
    // Fetch loans with borrowers using separate query
    @Query("SELECT DISTINCT l FROM Loan l LEFT JOIN FETCH l.borrower WHERE l.id IN :ids")
    List<Loan> findByIdsWithBorrower(@Param("ids") List<Long> ids);

    // Stats
    @Query("SELECT COUNT(l) FROM Loan l WHERE l.status = :status")
    long countByStatus(@Param("status") LoanStatus status);

    @Query("SELECT COALESCE(SUM(l.requestedAmount), 0) FROM Loan l WHERE l.status IN :statuses")
    BigDecimal sumRequestedAmountByStatusIn(@Param("statuses") List<LoanStatus> statuses);

    // Find loans with expired funding deadline
    @Query("SELECT l FROM Loan l WHERE l.status = 'FUNDING' AND l.fundingDeadline < :now")
    List<Loan> findExpiredFundingLoans(@Param("now") LocalDateTime now);
}

