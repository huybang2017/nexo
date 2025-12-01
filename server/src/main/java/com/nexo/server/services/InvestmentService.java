package com.nexo.server.services;

import com.nexo.server.dto.common.PageResponse;
import com.nexo.server.dto.investment.*;
import com.nexo.server.entities.*;
import com.nexo.server.enums.*;
import com.nexo.server.exceptions.BadRequestException;
import com.nexo.server.exceptions.BusinessException;
import com.nexo.server.exceptions.ResourceNotFoundException;
import com.nexo.server.repositories.*;
import com.nexo.server.utils.CodeGenerator;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class InvestmentService {

    private final InvestmentRepository investmentRepository;
    private final LoanRepository loanRepository;
    private final UserRepository userRepository;
    private final WalletService walletService;
    private final LoanService loanService;
    private final NotificationService notificationService;

    @Transactional
    public InvestmentResponse createInvestment(Long lenderId, InvestRequest request) {
        User lender = userRepository.findById(lenderId)
                .orElseThrow(() -> new ResourceNotFoundException("User", lenderId));

        // Check KYC status
        if (lender.getKycStatus() != KycStatus.APPROVED) {
            throw new BusinessException("KYC must be approved before investing");
        }

        Loan loan = loanRepository.findById(request.getLoanId())
                .orElseThrow(() -> new ResourceNotFoundException("Loan", request.getLoanId()));

        // Validate loan status
        if (loan.getStatus() != LoanStatus.FUNDING) {
            throw new BadRequestException("Loan is not available for investment");
        }

        // Check if lender is not the borrower
        if (loan.getBorrower().getId().equals(lenderId)) {
            throw new BadRequestException("You cannot invest in your own loan");
        }

        // Validate investment amount
        BigDecimal remainingAmount = loan.getRemainingAmount();
        if (request.getAmount().compareTo(remainingAmount) > 0) {
            throw new BusinessException("Investment amount exceeds remaining loan amount. Maximum: " + remainingAmount);
        }

        // Calculate expected return
        BigDecimal expectedReturn = calculateExpectedReturn(request.getAmount(), loan.getInterestRate(), loan.getTermMonths());

        // Create investment
        Investment investment = Investment.builder()
                .investmentCode(CodeGenerator.generateInvestmentCode())
                .loan(loan)
                .lender(lender)
                .amount(request.getAmount())
                .interestRate(loan.getInterestRate())
                .status(InvestmentStatus.ACTIVE)
                .expectedReturn(expectedReturn)
                .maturityDate(LocalDate.now().plusMonths(loan.getTermMonths()))
                .investedAt(LocalDateTime.now())
                .build();

        investment = investmentRepository.save(investment);

        // Create transaction (this will deduct from balance directly)
        Transaction transaction = walletService.createTransaction(
                lenderId,
                TransactionType.INVESTMENT,
                request.getAmount(),
                BigDecimal.ZERO,
                "Investment in loan: " + loan.getLoanCode()
        );

            // Update loan funded amount
            loan.setFundedAmount(loan.getFundedAmount().add(request.getAmount()));
            loanRepository.save(loan);

            log.info("Investment created: {} - Loan: {} - Amount: {}", 
                    investment.getInvestmentCode(), loan.getLoanCode(), request.getAmount());

            // Check if fully funded
            if (loan.isFullyFunded()) {
                loanService.disburseLoan(loan);
            }

            // Notify borrower
            notificationService.notifyNewInvestment(loan, investment);

            return toInvestmentResponse(investment);
    }

    public PageResponse<InvestmentResponse> getMyInvestments(Long lenderId, InvestmentStatus status, Pageable pageable) {
        Page<Investment> investments = status != null
                ? investmentRepository.findByLenderIdAndStatus(lenderId, status, pageable)
                : investmentRepository.findByLenderId(lenderId, pageable);

        return PageResponse.of(investments, investments.getContent().stream().map(this::toInvestmentResponse).toList());
    }

    public InvestmentResponse getInvestmentById(Long investmentId, Long lenderId) {
        Investment investment = investmentRepository.findByIdWithDetails(investmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Investment", investmentId));

        if (!investment.getLender().getId().equals(lenderId)) {
            throw new ResourceNotFoundException("Investment", investmentId);
        }

        return toInvestmentResponse(investment);
    }

    public PortfolioResponse getPortfolio(Long lenderId) {
        BigDecimal totalInvested = investmentRepository.sumAmountByLenderIdAndStatus(lenderId, InvestmentStatus.ACTIVE);
        BigDecimal totalExpectedReturn = investmentRepository.sumExpectedReturnByLenderId(lenderId);
        BigDecimal totalActualReturn = investmentRepository.sumActualReturnByLenderId(lenderId);

        long activeCount = investmentRepository.countByLenderIdAndStatus(lenderId, InvestmentStatus.ACTIVE);
        long completedCount = investmentRepository.countByLenderIdAndStatus(lenderId, InvestmentStatus.COMPLETED);

        // Risk distribution
        List<Investment> investments = investmentRepository.findByLenderId(lenderId, Pageable.unpaged()).getContent();
        Map<String, BigDecimal> riskDistribution = new HashMap<>();
        Map<String, Integer> statusDistribution = new HashMap<>();

        for (Investment inv : investments) {
            String grade = inv.getLoan().getRiskGrade();
            riskDistribution.merge(grade, inv.getAmount(), BigDecimal::add);
            statusDistribution.merge(inv.getStatus().name(), 1, Integer::sum);
        }

        // Calculate average interest rate
        BigDecimal avgRate = BigDecimal.ZERO;
        if (!investments.isEmpty()) {
            avgRate = investments.stream()
                    .map(Investment::getInterestRate)
                    .reduce(BigDecimal.ZERO, BigDecimal::add)
                    .divide(new BigDecimal(investments.size()), 2, RoundingMode.HALF_UP);
        }

        // Portfolio health
        String health = calculatePortfolioHealth(investments);

        return PortfolioResponse.builder()
                .totalInvested(totalInvested != null ? totalInvested : BigDecimal.ZERO)
                .totalActiveInvestments((int) activeCount)
                .totalCompletedInvestments((int) completedCount)
                .totalExpectedReturn(totalExpectedReturn != null ? totalExpectedReturn : BigDecimal.ZERO)
                .totalActualReturn(totalActualReturn != null ? totalActualReturn : BigDecimal.ZERO)
                .averageInterestRate(avgRate)
                .portfolioHealth(health)
                .riskDistribution(riskDistribution)
                .statusDistribution(statusDistribution)
                .build();
    }

    private BigDecimal calculateExpectedReturn(BigDecimal amount, BigDecimal annualRate, int months) {
        // Simple interest for estimation
        return amount.multiply(annualRate)
                .multiply(new BigDecimal(months))
                .divide(new BigDecimal("1200"), 2, RoundingMode.HALF_UP);
    }

    private String calculatePortfolioHealth(List<Investment> investments) {
        if (investments.isEmpty()) return "N/A";

        long activeCount = investments.stream().filter(i -> i.getStatus() == InvestmentStatus.ACTIVE).count();
        long completedCount = investments.stream().filter(i -> i.getStatus() == InvestmentStatus.COMPLETED).count();

        // Check for defaulted loans
        long defaultedCount = investments.stream()
                .filter(i -> i.getLoan().getStatus() == LoanStatus.DEFAULTED)
                .count();

        if (defaultedCount > 0) return "AT_RISK";
        if (completedCount > activeCount) return "EXCELLENT";
        if (activeCount > 0) return "GOOD";
        return "N/A";
    }

    private InvestmentResponse toInvestmentResponse(Investment investment) {
        BigDecimal returnProgress = BigDecimal.ZERO;
        if (investment.getExpectedReturn().compareTo(BigDecimal.ZERO) > 0) {
            returnProgress = investment.getActualReturn()
                    .divide(investment.getExpectedReturn(), 4, RoundingMode.HALF_UP)
                    .multiply(new BigDecimal("100"));
        }

        return InvestmentResponse.builder()
                .id(investment.getId())
                .investmentCode(investment.getInvestmentCode())
                .loanId(investment.getLoan().getId())
                .loanCode(investment.getLoan().getLoanCode())
                .loanTitle(investment.getLoan().getTitle())
                .amount(investment.getAmount())
                .interestRate(investment.getInterestRate())
                .status(investment.getStatus())
                .expectedReturn(investment.getExpectedReturn())
                .actualReturn(investment.getActualReturn())
                .returnProgress(returnProgress)
                .investedAt(investment.getInvestedAt())
                .maturityDate(investment.getMaturityDate())
                .loanStatus(investment.getLoan().getStatus().name())
                .borrowerCreditScore(investment.getLoan().getBorrower().getCreditScore())
                .createdAt(investment.getCreatedAt())
                .build();
    }
}

