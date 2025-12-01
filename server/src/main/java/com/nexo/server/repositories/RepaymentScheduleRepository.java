package com.nexo.server.repositories;

import com.nexo.server.entities.RepaymentSchedule;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface RepaymentScheduleRepository extends JpaRepository<RepaymentSchedule, Long> {

    List<RepaymentSchedule> findByLoanIdOrderByInstallmentNumberAsc(Long loanId);

    Optional<RepaymentSchedule> findByLoanIdAndInstallmentNumber(Long loanId, Integer installmentNumber);

    @Query("SELECT rs FROM RepaymentSchedule rs JOIN FETCH rs.loan WHERE rs.id = :id")
    Optional<RepaymentSchedule> findByIdWithLoan(@Param("id") Long id);

    @Query("SELECT rs FROM RepaymentSchedule rs WHERE rs.loan.id = :loanId " +
           "AND rs.repayment IS NULL ORDER BY rs.installmentNumber ASC")
    List<RepaymentSchedule> findUnpaidByLoanId(@Param("loanId") Long loanId);

    @Query("SELECT rs FROM RepaymentSchedule rs WHERE rs.loan.id = :loanId " +
           "AND rs.repayment IS NULL ORDER BY rs.installmentNumber ASC LIMIT 1")
    Optional<RepaymentSchedule> findNextUnpaidByLoanId(@Param("loanId") Long loanId);

    // Find overdue schedules (all - for admin)
    @Query("SELECT rs FROM RepaymentSchedule rs WHERE rs.repayment IS NULL AND rs.dueDate < :today")
    List<RepaymentSchedule> findOverdueSchedules(@Param("today") LocalDate today);

    // Find overdue schedules for a borrower
    @Query("SELECT rs FROM RepaymentSchedule rs JOIN FETCH rs.loan l JOIN FETCH l.borrower " +
           "WHERE rs.repayment IS NULL AND rs.dueDate < :today AND l.borrower.id = :borrowerId")
    List<RepaymentSchedule> findOverdueSchedulesByBorrower(@Param("today") LocalDate today, @Param("borrowerId") Long borrowerId);

    // Find schedules due soon (for reminders) - filter by borrower
    @Query("SELECT rs FROM RepaymentSchedule rs JOIN FETCH rs.loan l WHERE rs.repayment IS NULL " +
           "AND rs.dueDate BETWEEN :from AND :to " +
           "AND l.borrower.id = :borrowerId")
    List<RepaymentSchedule> findSchedulesDueBetween(@Param("from") LocalDate from, @Param("to") LocalDate to, @Param("borrowerId") Long borrowerId);

    // Find paid schedules for a borrower
    @Query("SELECT DISTINCT rs FROM RepaymentSchedule rs " +
           "JOIN FETCH rs.loan l " +
           "JOIN FETCH l.borrower " +
           "LEFT JOIN FETCH rs.repayment r " +
           "WHERE rs.repayment IS NOT NULL AND l.borrower.id = :borrowerId " +
           "ORDER BY rs.dueDate DESC")
    List<RepaymentSchedule> findPaidSchedulesByBorrower(@Param("borrowerId") Long borrowerId);

    void deleteByLoanId(Long loanId);
}

