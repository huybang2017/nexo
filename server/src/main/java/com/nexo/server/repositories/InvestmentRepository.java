package com.nexo.server.repositories;

import com.nexo.server.entities.Investment;
import com.nexo.server.enums.InvestmentStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@Repository
public interface InvestmentRepository extends JpaRepository<Investment, Long> {

    Optional<Investment> findByInvestmentCode(String investmentCode);

    boolean existsByInvestmentCode(String investmentCode);

    Page<Investment> findByLenderId(Long lenderId, Pageable pageable);

    Page<Investment> findByLenderIdAndStatus(Long lenderId, InvestmentStatus status, Pageable pageable);

    List<Investment> findByLoanId(Long loanId);

    @Query("SELECT i FROM Investment i JOIN FETCH i.loan l JOIN FETCH l.borrower WHERE i.loan.id = :loanId")
    List<Investment> findByLoanIdWithDetails(@Param("loanId") Long loanId);

    List<Investment> findByLoanIdAndStatus(Long loanId, InvestmentStatus status);

    @Query("SELECT i FROM Investment i JOIN FETCH i.loan JOIN FETCH i.lender WHERE i.id = :id")
    Optional<Investment> findByIdWithDetails(@Param("id") Long id);

    @Query("SELECT i FROM Investment i JOIN FETCH i.loan WHERE i.lender.id = :lenderId")
    Page<Investment> findByLenderIdWithLoan(@Param("lenderId") Long lenderId, Pageable pageable);

    // Portfolio stats
    @Query("SELECT COALESCE(SUM(i.amount), 0) FROM Investment i WHERE i.lender.id = :lenderId AND i.status = :status")
    BigDecimal sumAmountByLenderIdAndStatus(@Param("lenderId") Long lenderId, @Param("status") InvestmentStatus status);

    @Query("SELECT COALESCE(SUM(i.actualReturn), 0) FROM Investment i WHERE i.lender.id = :lenderId")
    BigDecimal sumActualReturnByLenderId(@Param("lenderId") Long lenderId);

    @Query("SELECT COALESCE(SUM(i.expectedReturn), 0) FROM Investment i WHERE i.lender.id = :lenderId AND i.status = 'ACTIVE'")
    BigDecimal sumExpectedReturnByLenderId(@Param("lenderId") Long lenderId);

    @Query("SELECT COUNT(i) FROM Investment i WHERE i.lender.id = :lenderId AND i.status = :status")
    long countByLenderIdAndStatus(@Param("lenderId") Long lenderId, @Param("status") InvestmentStatus status);

    // Check if lender already invested in loan
    boolean existsByLoanIdAndLenderId(Long loanId, Long lenderId);
}

