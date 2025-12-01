package com.nexo.server.repositories;

import com.nexo.server.entities.Repayment;
import com.nexo.server.enums.RepaymentStatus;
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
public interface RepaymentRepository extends JpaRepository<Repayment, Long> {

    Optional<Repayment> findByRepaymentCode(String repaymentCode);

    boolean existsByRepaymentCode(String repaymentCode);

    List<Repayment> findByLoanId(Long loanId);

    Page<Repayment> findByBorrowerId(Long borrowerId, Pageable pageable);
    
    List<Repayment> findByBorrowerId(Long borrowerId);

    List<Repayment> findByLoanIdAndStatus(Long loanId, RepaymentStatus status);

    @Query("SELECT r FROM Repayment r JOIN FETCH r.schedule JOIN FETCH r.loan WHERE r.id = :id")
    Optional<Repayment> findByIdWithDetails(@Param("id") Long id);

    @Query("SELECT COALESCE(SUM(r.paidAmount), 0) FROM Repayment r WHERE r.loan.id = :loanId AND r.status = 'PAID'")
    BigDecimal sumPaidAmountByLoanId(@Param("loanId") Long loanId);

    // Find overdue repayments
    @Query("SELECT r FROM Repayment r WHERE r.status IN ('PENDING', 'PARTIAL') AND r.dueDate < CURRENT_DATE")
    List<Repayment> findOverdueRepayments();

    boolean existsByScheduleId(Long scheduleId);

    List<Repayment> findByLoanIdOrderByPaidAtDesc(Long loanId);
}

