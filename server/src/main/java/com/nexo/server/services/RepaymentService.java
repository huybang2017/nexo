package com.nexo.server.services;

import com.nexo.server.entities.*;
import com.nexo.server.enums.*;
import com.nexo.server.exceptions.BadRequestException;
import com.nexo.server.exceptions.ResourceNotFoundException;
import com.nexo.server.repositories.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class RepaymentService {

    private final LoanRepository loanRepository;
    private final RepaymentScheduleRepository scheduleRepository;
    private final RepaymentRepository repaymentRepository;
    private final InvestmentRepository investmentRepository;
    private final LenderReturnRepository lenderReturnRepository;
    private final WalletRepository walletRepository;
    private final TransactionRepository transactionRepository;
    private final NotificationService notificationService;
    private final CreditScoreService creditScoreService;

    private static final BigDecimal LATE_FEE_RATE = new BigDecimal("0.01"); // 1% per day late

    /**
     * Generate repayment schedule for a loan
     */
    @Transactional
    public List<RepaymentSchedule> generateSchedule(Long loanId) {
        Loan loan = loanRepository.findById(loanId)
                .orElseThrow(() -> new ResourceNotFoundException("Loan not found"));

        if (loan.getStatus() != LoanStatus.FUNDED && loan.getStatus() != LoanStatus.ACTIVE) {
            throw new BadRequestException("Loan must be FUNDED or ACTIVE to generate schedule");
        }

        // Delete existing schedules if any
        scheduleRepository.deleteByLoanId(loanId);

        List<RepaymentSchedule> schedules = new ArrayList<>();
        BigDecimal principal = loan.getFundedAmount();
        BigDecimal monthlyRate = loan.getInterestRate().divide(BigDecimal.valueOf(12 * 100), 10, RoundingMode.HALF_UP);
        int termMonths = loan.getTermMonths();

        // Calculate EMI (Equal Monthly Installment)
        BigDecimal onePlusR = BigDecimal.ONE.add(monthlyRate);
        BigDecimal onePlusRPowN = onePlusR.pow(termMonths);
        BigDecimal emi = principal.multiply(monthlyRate).multiply(onePlusRPowN)
                .divide(onePlusRPowN.subtract(BigDecimal.ONE), 2, RoundingMode.HALF_UP);

        BigDecimal remainingPrincipal = principal;
        LocalDate dueDate = loan.getDisbursedAt() != null 
                ? loan.getDisbursedAt().toLocalDate().plusMonths(1)
                : LocalDate.now().plusMonths(1);

        for (int i = 1; i <= termMonths; i++) {
            BigDecimal interestAmount = remainingPrincipal.multiply(monthlyRate).setScale(2, RoundingMode.HALF_UP);
            BigDecimal principalAmount = emi.subtract(interestAmount);

            // Adjust last payment for rounding
            if (i == termMonths) {
                principalAmount = remainingPrincipal;
            }

            BigDecimal totalAmount = principalAmount.add(interestAmount);
            remainingPrincipal = remainingPrincipal.subtract(principalAmount);

            RepaymentSchedule schedule = RepaymentSchedule.builder()
                    .loan(loan)
                    .installmentNumber(i)
                    .dueDate(dueDate)
                    .principalAmount(principalAmount)
                    .interestAmount(interestAmount)
                    .totalAmount(totalAmount)
                    .remainingPrincipal(remainingPrincipal.max(BigDecimal.ZERO))
                    .build();

            schedules.add(schedule);
            dueDate = dueDate.plusMonths(1);
        }

        scheduleRepository.saveAll(schedules);
        log.info("Generated {} repayment schedules for loan {}", schedules.size(), loanId);

        return schedules;
    }

    /**
     * Get repayment schedule for a loan
     */
    public List<RepaymentSchedule> getSchedule(Long loanId) {
        return scheduleRepository.findByLoanIdOrderByInstallmentNumberAsc(loanId);
    }

    /**
     * Get upcoming repayments for a borrower
     */
    public List<RepaymentSchedule> getUpcomingRepayments(Long borrowerId) {
        return scheduleRepository.findSchedulesDueBetween(LocalDate.now(), LocalDate.now().plusMonths(1), borrowerId);
    }

    /**
     * Convert RepaymentSchedule entity to DTO
     */
    public com.nexo.server.dto.repayment.RepaymentScheduleResponse toRepaymentScheduleResponse(RepaymentSchedule schedule) {
        if (schedule == null) return null;
        
        com.nexo.server.entities.Loan loan = schedule.getLoan();
        com.nexo.server.entities.Repayment repayment = schedule.getRepayment();
        
        // Calculate late fee for overdue schedules (if not already paid)
        BigDecimal lateFee = null;
        if (repayment != null) {
            // If repayment exists, use its late fee
            lateFee = repayment.getLateFee();
        } else {
            // For unpaid schedules, calculate late fee if overdue
            LocalDate today = LocalDate.now();
            if (schedule.getDueDate().isBefore(today)) {
                long daysOverdue = ChronoUnit.DAYS.between(schedule.getDueDate(), today);
                if (daysOverdue > 0) {
                    // Calculate late fee: 1% per day of total amount
                    lateFee = schedule.getTotalAmount()
                            .multiply(LATE_FEE_RATE)
                            .multiply(new BigDecimal(daysOverdue))
                            .setScale(2, RoundingMode.HALF_UP);
                }
            }
        }
        
        return com.nexo.server.dto.repayment.RepaymentScheduleResponse.builder()
                .id(schedule.getId())
                .loanId(loan != null ? loan.getId() : null)
                .loanCode(loan != null ? loan.getLoanCode() : null)
                .loanTitle(loan != null ? loan.getTitle() : null)
                .installmentNumber(schedule.getInstallmentNumber())
                .dueDate(schedule.getDueDate())
                .principalAmount(schedule.getPrincipalAmount())
                .interestAmount(schedule.getInterestAmount())
                .totalAmount(schedule.getTotalAmount())
                .remainingPrincipal(schedule.getRemainingPrincipal())
                .isPaid(schedule.isPaid())
                .paidAmount(repayment != null ? repayment.getPaidAmount() : null)
                .lateFee(lateFee)
                .paidAt(repayment != null ? repayment.getPaidAt() : null)
                .createdAt(schedule.getCreatedAt())
                .updatedAt(schedule.getUpdatedAt())
                .build();
    }

    /**
     * Convert Repayment entity to DTO
     */
    public com.nexo.server.dto.repayment.RepaymentResponse toRepaymentResponse(Repayment repayment) {
        if (repayment == null) return null;
        
        com.nexo.server.entities.Loan loan = repayment.getLoan();
        com.nexo.server.entities.RepaymentSchedule schedule = repayment.getSchedule();
        
        return com.nexo.server.dto.repayment.RepaymentResponse.builder()
                .id(repayment.getId())
                .repaymentCode(repayment.getRepaymentCode())
                .loanId(loan != null ? loan.getId() : null)
                .loanCode(loan != null ? loan.getLoanCode() : null)
                .scheduleId(schedule != null ? schedule.getId() : null)
                .installmentNumber(schedule != null ? schedule.getInstallmentNumber() : null)
                .status(repayment.getStatus())
                .dueAmount(repayment.getDueAmount())
                .paidAmount(repayment.getPaidAmount())
                .lateFee(repayment.getLateFee())
                .dueDate(repayment.getDueDate())
                .paidAt(repayment.getPaidAt())
                .daysOverdue(repayment.getDaysOverdue())
                .createdAt(repayment.getCreatedAt())
                .updatedAt(repayment.getUpdatedAt())
                .build();
    }

    /**
     * Get overdue repayments for a borrower
     */
    public List<RepaymentSchedule> getOverdueRepayments(Long borrowerId) {
        return scheduleRepository.findOverdueSchedulesByBorrower(LocalDate.now(), borrowerId);
    }

    /**
     * Get overdue repayments (all - for admin)
     */
    public List<RepaymentSchedule> getOverdueRepayments() {
        return scheduleRepository.findOverdueSchedules(LocalDate.now());
    }

    /**
     * Get paid repayments for a borrower
     */
    public List<RepaymentSchedule> getPaidRepayments(Long borrowerId) {
        List<RepaymentSchedule> schedules = scheduleRepository.findPaidSchedulesByBorrower(borrowerId);
        // Eager load repayment to avoid lazy loading issues when mapping to DTO
        schedules.forEach(schedule -> {
            if (schedule.getRepayment() != null) {
                // Access repayment fields to trigger lazy load within transaction
                schedule.getRepayment().getPaidAt();
                schedule.getRepayment().getPaidAmount();
                schedule.getRepayment().getLateFee();
            }
        });
        return schedules;
    }

    /**
     * Process a repayment
     */
    @Transactional
    public Repayment processRepayment(Long scheduleId, Long borrowerId) {
        RepaymentSchedule schedule = scheduleRepository.findByIdWithLoan(scheduleId)
                .orElseThrow(() -> new ResourceNotFoundException("Repayment schedule not found"));

        Loan loan = schedule.getLoan();

        // Verify borrower
        if (!loan.getBorrower().getId().equals(borrowerId)) {
            throw new BadRequestException("You are not the borrower of this loan");
        }

        // Check if already paid
        if (repaymentRepository.existsByScheduleId(scheduleId)) {
            throw new BadRequestException("This installment has already been paid");
        }

        // Calculate late fee if applicable
        BigDecimal lateFee = BigDecimal.ZERO;
        int daysLate = 0;
        if (LocalDate.now().isAfter(schedule.getDueDate())) {
            daysLate = (int) ChronoUnit.DAYS.between(schedule.getDueDate(), LocalDate.now());
            lateFee = schedule.getTotalAmount().multiply(LATE_FEE_RATE).multiply(BigDecimal.valueOf(daysLate))
                    .setScale(2, RoundingMode.HALF_UP);
        }

        BigDecimal totalAmount = schedule.getTotalAmount().add(lateFee);

        // Check borrower wallet balance
        Wallet borrowerWallet = walletRepository.findByUserId(borrowerId)
                .orElseThrow(() -> new ResourceNotFoundException("Wallet not found"));

        if (borrowerWallet.getAvailableBalance().compareTo(totalAmount) < 0) {
            throw new BadRequestException("Insufficient wallet balance. Required: " + totalAmount);
        }

        // Deduct from borrower wallet
        borrowerWallet.setBalance(borrowerWallet.getBalance().subtract(totalAmount));
        walletRepository.save(borrowerWallet);

        // Generate repayment code
        String repaymentCode = "REP-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();

        // Create repayment record
        Repayment repayment = Repayment.builder()
                .repaymentCode(repaymentCode)
                .loan(loan)
                .borrower(loan.getBorrower())
                .schedule(schedule)
                .dueAmount(schedule.getTotalAmount())
                .paidAmount(totalAmount)
                .lateFee(lateFee)
                .dueDate(schedule.getDueDate())
                .status(RepaymentStatus.PAID)
                .paidAt(LocalDateTime.now())
                .daysOverdue(daysLate)
                .build();
        repaymentRepository.save(repayment);

        // Create transaction for borrower
        String txCode = "TXN-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        Transaction borrowerTx = Transaction.builder()
                .user(loan.getBorrower())
                .wallet(borrowerWallet)
                .loan(loan)
                .repayment(repayment)
                .type(TransactionType.REPAYMENT_PAID)
                .amount(totalAmount)
                .fee(BigDecimal.ZERO)
                .netAmount(totalAmount)
                .balanceBefore(borrowerWallet.getBalance().add(totalAmount))
                .balanceAfter(borrowerWallet.getBalance())
                .status(TransactionStatus.COMPLETED)
                .referenceCode(txCode)
                .description("Repayment installment #" + schedule.getInstallmentNumber() + " for loan " + loan.getLoanCode())
                .currency("VND")
                .build();
        transactionRepository.save(borrowerTx);

        // Update loan totals
        loan.setTotalRepaid(loan.getTotalRepaid().add(schedule.getPrincipalAmount().add(schedule.getInterestAmount())));
        loan.setTotalInterestPaid(loan.getTotalInterestPaid().add(schedule.getInterestAmount()));

        // Distribute to lenders
        distributeToLenders(loan, schedule, repayment);

        // Check if loan is completed
        boolean loanCompleted = isLoanFullyRepaid(loan.getId());
        if (loanCompleted) {
            loan.setStatus(LoanStatus.COMPLETED);
            notificationService.createNotification(borrowerId, "LOAN", "Loan Completed",
                    "Congratulations! You have fully repaid loan " + loan.getLoanCode());
        }

        loanRepository.save(loan);

        // Update credit score based on repayment
        try {
            creditScoreService.onRepaymentMade(borrowerId, repayment.getId(), daysLate);
            if (loanCompleted) {
                creditScoreService.onLoanCompleted(borrowerId, loan.getId());
            }
        } catch (Exception e) {
            log.error("Failed to update credit score after repayment: {}", e.getMessage());
        }

        log.info("Processed repayment {} for loan {}", repayment.getId(), loan.getLoanCode());

        return repayment;
    }

    /**
     * Distribute repayment to lenders proportionally
     */
    private void distributeToLenders(Loan loan, RepaymentSchedule schedule, Repayment repayment) {
        List<Investment> investments = investmentRepository.findByLoanIdAndStatus(loan.getId(), InvestmentStatus.ACTIVE);
        BigDecimal totalFunded = loan.getFundedAmount();

        for (Investment investment : investments) {
            // Calculate lender's share
            BigDecimal shareRatio = investment.getAmount().divide(totalFunded, 10, RoundingMode.HALF_UP);
            BigDecimal principalShare = schedule.getPrincipalAmount().multiply(shareRatio).setScale(2, RoundingMode.HALF_UP);
            BigDecimal interestShare = schedule.getInterestAmount().multiply(shareRatio).setScale(2, RoundingMode.HALF_UP);
            BigDecimal totalShare = principalShare.add(interestShare);

            // Create lender return record
            LenderReturn lenderReturn = LenderReturn.builder()
                    .investment(investment)
                    .repayment(repayment)
                    .lender(investment.getLender())
                    .principalAmount(principalShare)
                    .interestAmount(interestShare)
                    .totalAmount(totalShare)
                    .build();
            lenderReturnRepository.save(lenderReturn);

            // Credit lender wallet
            Wallet lenderWallet = walletRepository.findByUserId(investment.getLender().getId())
                    .orElse(null);
            if (lenderWallet != null) {
                BigDecimal balanceBefore = lenderWallet.getBalance();
                lenderWallet.setBalance(balanceBefore.add(totalShare));
                walletRepository.save(lenderWallet);

                // Create transaction for lender
                String txCode = "TXN-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
                Transaction lenderTx = Transaction.builder()
                        .user(investment.getLender())
                        .wallet(lenderWallet)
                        .loan(loan)
                        .repayment(repayment)
                        .investment(investment)
                        .type(TransactionType.REPAYMENT_RECEIVED)
                        .amount(totalShare)
                        .fee(BigDecimal.ZERO)
                        .netAmount(totalShare)
                        .balanceBefore(balanceBefore)
                        .balanceAfter(lenderWallet.getBalance())
                        .status(TransactionStatus.COMPLETED)
                        .referenceCode(txCode)
                        .description("Return from loan " + loan.getLoanCode() + " - Installment #" + schedule.getInstallmentNumber())
                        .currency("VND")
                        .build();
                transactionRepository.save(lenderTx);

                // Notify lender
                notificationService.createNotification(investment.getLender().getId(), "PAYMENT", "Repayment Received",
                        String.format("You received %,.0f VND from loan %s", totalShare, loan.getLoanCode()));
            }

            // Update investment actual return
            investment.setActualReturn(investment.getActualReturn().add(totalShare));
            investmentRepository.save(investment);
        }
    }

    /**
     * Check if loan is fully repaid
     */
    private boolean isLoanFullyRepaid(Long loanId) {
        List<RepaymentSchedule> schedules = scheduleRepository.findByLoanIdOrderByInstallmentNumberAsc(loanId);
        long paidCount = schedules.stream()
                .filter(s -> repaymentRepository.existsByScheduleId(s.getId()))
                .count();
        return paidCount == schedules.size();
    }

    /**
     * Get repayment history for a loan
     */
    public List<Repayment> getRepaymentHistory(Long loanId) {
        return repaymentRepository.findByLoanIdOrderByPaidAtDesc(loanId);
    }

    /**
     * Get lender returns for an investment
     */
    public List<LenderReturn> getLenderReturns(Long investmentId) {
        return lenderReturnRepository.findByInvestmentIdOrderByCreatedAtDesc(investmentId);
    }

    /**
     * Process late fees for overdue repayments (Scheduled task)
     */
    @Transactional
    public void processLateFees() {
        List<RepaymentSchedule> overdueSchedules = getOverdueRepayments();
        for (RepaymentSchedule schedule : overdueSchedules) {
            User borrower = schedule.getLoan().getBorrower();
            notificationService.createNotification(borrower.getId(), "PAYMENT", "Overdue Payment",
                    "Your repayment for loan " + schedule.getLoan().getLoanCode() + " is overdue. Late fees may apply.");
        }
        log.info("Processed {} overdue repayments", overdueSchedules.size());
    }
}
