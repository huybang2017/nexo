package com.nexo.server.services;

import com.nexo.server.dto.common.PageResponse;
import com.nexo.server.dto.creditscore.CreditScoreResponse;
import com.nexo.server.dto.loan.*;
import com.nexo.server.entities.*;
import com.nexo.server.enums.*;
import com.nexo.server.exceptions.BadRequestException;
import com.nexo.server.exceptions.BusinessException;
import com.nexo.server.exceptions.ForbiddenException;
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
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class LoanService {

    private final LoanRepository loanRepository;
    private final LoanDocumentRepository loanDocumentRepository;
    private final UserRepository userRepository;
    private final RepaymentScheduleRepository scheduleRepository;
    private final InvestmentRepository investmentRepository;
    private final WalletService walletService;
    private final FileStorageService fileStorageService;
    private final NotificationService notificationService;
    private final CreditScoreService creditScoreService;

    private static final BigDecimal PLATFORM_FEE_RATE = new BigDecimal("2.00");
    private static final int FUNDING_DAYS = 30;

    @Transactional
    public LoanResponse createLoan(Long borrowerId, CreateLoanRequest request) {
        User borrower = userRepository.findById(borrowerId)
                .orElseThrow(() -> new ResourceNotFoundException("User", borrowerId));

        // Check KYC status
        if (borrower.getKycStatus() != KycStatus.APPROVED) {
            throw new BusinessException("KYC must be approved before creating a loan");
        }

        // Check credit score eligibility
        CreditScoreResponse creditScore = creditScoreService.getOrCreateCreditScore(borrowerId);
        if (!creditScore.getIsEligibleForLoan()) {
            throw new BusinessException("Not eligible for loan: " + creditScore.getEligibilityReason());
        }

        // Check if requested amount exceeds max allowed
        if (request.getAmount().compareTo(creditScore.getMaxLoanAmount()) > 0) {
            throw new BusinessException(String.format(
                    "Requested amount exceeds your maximum loan limit of %s VND based on your credit score",
                    creditScore.getMaxLoanAmount().toPlainString()));
        }

        // Validate interest rate is within allowed range based on credit score
        if (request.getInterestRate().compareTo(creditScore.getMinInterestRate()) < 0 ||
                request.getInterestRate().compareTo(creditScore.getMaxInterestRate()) > 0) {
            throw new BusinessException(String.format(
                    "Interest rate must be between %s%% and %s%% based on your credit score",
                    creditScore.getMinInterestRate().toPlainString(),
                    creditScore.getMaxInterestRate().toPlainString()));
        }

        BigDecimal interestRate = request.getInterestRate();
        String riskGrade = calculateRiskGrade(borrower.getCreditScore());

        Loan loan = Loan.builder()
                .loanCode(CodeGenerator.generateLoanCode())
                .borrower(borrower)
                .title(request.getTitle())
                .description(request.getDescription())
                .purpose(request.getPurpose())
                .requestedAmount(request.getAmount())
                .interestRate(interestRate)
                .platformFeeRate(PLATFORM_FEE_RATE)
                .termMonths(request.getTermMonths())
                .riskGrade(riskGrade)
                .creditScoreAtRequest(borrower.getCreditScore())
                .status(LoanStatus.PENDING_REVIEW)
                .fundingDeadline(LocalDateTime.now().plusDays(FUNDING_DAYS))
                .build();

        loan = loanRepository.save(loan);

        log.info("Loan created: {} by user: {}", loan.getLoanCode(), borrower.getEmail());

        // Notify admins
        notificationService.notifyAdminsNewLoan(loan);

        return toLoanResponse(loan);
    }

    public PageResponse<LoanResponse> getMyLoans(Long borrowerId, LoanStatus status, Pageable pageable) {
        Page<Loan> loans = status != null
                ? loanRepository.findByBorrowerIdAndStatus(borrowerId, status, pageable)
                : loanRepository.findByBorrowerId(borrowerId, pageable);

        return PageResponse.of(loans, loans.getContent().stream().map(this::toLoanResponse).toList());
    }

    public LoanResponse getLoanById(Long loanId) {
        Loan loan = loanRepository.findByIdWithBorrower(loanId)
                .orElseThrow(() -> new ResourceNotFoundException("Loan", loanId));
        return toLoanResponse(loan);
    }

    public LoanResponse getLoanByCode(String loanCode) {
        Loan loan = loanRepository.findByLoanCode(loanCode)
                .orElseThrow(() -> new ResourceNotFoundException("Loan", "code", loanCode));
        return toLoanResponse(loan);
    }

    // Marketplace - for lenders
    public PageResponse<LoanResponse> getMarketplaceLoans(
            String search,
            LoanPurpose purpose, List<String> riskGrades,
            BigDecimal minRate, BigDecimal maxRate,
            BigDecimal minAmount, BigDecimal maxAmount,
            Integer minTerm, Integer maxTerm,
            Pageable pageable) {

        Page<Loan> loans = loanRepository.findMarketplaceLoans(
                search, purpose, riskGrades, minRate, maxRate, minAmount, maxAmount, minTerm, maxTerm, pageable);

        return PageResponse.of(loans, loans.getContent().stream().map(this::toLoanResponse).toList());
    }

    // Admin - Review loan
    @Transactional
    public LoanResponse reviewLoan(Long loanId, Long adminId, LoanReviewRequest request) {
        Loan loan = loanRepository.findByIdWithBorrower(loanId)
                .orElseThrow(() -> new ResourceNotFoundException("Loan", loanId));

        if (loan.getStatus() != LoanStatus.PENDING_REVIEW) {
            throw new BadRequestException("Loan is not pending review");
        }

        User admin = userRepository.findById(adminId)
                .orElseThrow(() -> new ResourceNotFoundException("User", adminId));

        loan.setReviewedBy(admin);
        loan.setReviewedAt(LocalDateTime.now());

        if (request.getAction() == LoanReviewRequest.ReviewAction.APPROVE) {
            if (request.getAdjustedInterestRate() != null) {
                loan.setInterestRate(request.getAdjustedInterestRate());
            }
            loan.setStatus(LoanStatus.FUNDING);
            loan.setFundingDeadline(LocalDateTime.now().plusDays(FUNDING_DAYS));

            log.info("Loan approved: {} by admin: {}", loan.getLoanCode(), admin.getEmail());
            notificationService.notifyLoanApproved(loan);
        } else {
            loan.setStatus(LoanStatus.REJECTED);
            loan.setRejectionReason(request.getRejectionReason());

            log.info("Loan rejected: {} by admin: {}", loan.getLoanCode(), admin.getEmail());
            notificationService.notifyLoanRejected(loan);
        }

        loan = loanRepository.save(loan);
        return toLoanResponse(loan);
    }

    @Transactional
    public void cancelLoan(Long loanId, Long userId) {
        Loan loan = loanRepository.findByIdWithBorrower(loanId)
                .orElseThrow(() -> new ResourceNotFoundException("Loan", loanId));

        if (!loan.getBorrower().getId().equals(userId)) {
            throw new ForbiddenException("You can only cancel your own loans");
        }

        if (loan.getStatus() != LoanStatus.DRAFT && loan.getStatus() != LoanStatus.PENDING_REVIEW) {
            throw new BadRequestException("Loan cannot be cancelled in current status");
        }

        loan.setStatus(LoanStatus.CANCELLED);
        loanRepository.save(loan);

        log.info("Loan cancelled: {}", loan.getLoanCode());
    }

    // Called when loan is fully funded
    @Transactional
    public void disburseLoan(Loan loan) {
        if (!loan.isFullyFunded()) {
            throw new BusinessException("Loan is not fully funded");
        }

        loan.setStatus(LoanStatus.FUNDED);

        // Generate repayment schedule
        generateRepaymentSchedule(loan);

        // Transfer funds to borrower's wallet
        BigDecimal platformFee = loan.getRequestedAmount()
                .multiply(loan.getPlatformFeeRate())
                .divide(new BigDecimal("100"), 2, RoundingMode.HALF_UP);
        BigDecimal disbursementAmount = loan.getRequestedAmount().subtract(platformFee);

        walletService.createTransaction(
                loan.getBorrower().getId(),
                TransactionType.LOAN_DISBURSEMENT,
                disbursementAmount,
                platformFee,
                "Loan disbursement: " + loan.getLoanCode());

        loan.setStatus(LoanStatus.ACTIVE);
        loan.setDisbursedAt(LocalDateTime.now());
        loan.setMaturityDate(LocalDate.now().plusMonths(loan.getTermMonths()));

        loanRepository.save(loan);

        log.info("Loan disbursed: {} - Amount: {}", loan.getLoanCode(), disbursementAmount);
        notificationService.notifyLoanDisbursed(loan);
    }

    private void generateRepaymentSchedule(Loan loan) {
        BigDecimal principal = loan.getRequestedAmount();
        BigDecimal monthlyRate = loan.getInterestRate().divide(new BigDecimal("1200"), 10, RoundingMode.HALF_UP);
        int months = loan.getTermMonths();

        // Calculate EMI (Equated Monthly Installment)
        BigDecimal emi = calculateEMI(principal, monthlyRate, months);
        BigDecimal remainingPrincipal = principal;

        for (int i = 1; i <= months; i++) {
            BigDecimal interestAmount = remainingPrincipal.multiply(monthlyRate).setScale(2, RoundingMode.HALF_UP);
            BigDecimal principalAmount = emi.subtract(interestAmount).setScale(2, RoundingMode.HALF_UP);

            // Adjust last payment
            if (i == months) {
                principalAmount = remainingPrincipal;
                emi = principalAmount.add(interestAmount);
            }

            remainingPrincipal = remainingPrincipal.subtract(principalAmount);

            RepaymentSchedule schedule = RepaymentSchedule.builder()
                    .loan(loan)
                    .installmentNumber(i)
                    .dueDate(LocalDate.now().plusMonths(i))
                    .principalAmount(principalAmount)
                    .interestAmount(interestAmount)
                    .totalAmount(emi)
                    .remainingPrincipal(remainingPrincipal.max(BigDecimal.ZERO))
                    .build();

            scheduleRepository.save(schedule);
        }
    }

    private BigDecimal calculateEMI(BigDecimal principal, BigDecimal monthlyRate, int months) {
        // EMI = P * r * (1+r)^n / ((1+r)^n - 1)
        if (monthlyRate.compareTo(BigDecimal.ZERO) == 0) {
            return principal.divide(new BigDecimal(months), 2, RoundingMode.HALF_UP);
        }

        BigDecimal onePlusR = BigDecimal.ONE.add(monthlyRate);
        BigDecimal onePlusRPowN = onePlusR.pow(months);

        return principal.multiply(monthlyRate).multiply(onePlusRPowN)
                .divide(onePlusRPowN.subtract(BigDecimal.ONE), 2, RoundingMode.HALF_UP);
    }

    private BigDecimal calculateInterestRate(Integer creditScore) {
        // Fallback method - now interest rate comes from request
        // Adjusted to comply with Vietnamese law (max 20%/year)
        if (creditScore == null || creditScore < 300)
            return new BigDecimal("19.00");
        if (creditScore < 500)
            return new BigDecimal("18.00");
        if (creditScore < 600)
            return new BigDecimal("16.00");
        if (creditScore < 700)
            return new BigDecimal("14.00");
        if (creditScore < 800)
            return new BigDecimal("12.00");
        return new BigDecimal("10.00");
    }

    private String calculateRiskGrade(Integer creditScore) {
        if (creditScore == null || creditScore < 300)
            return "E";
        if (creditScore < 500)
            return "D";
        if (creditScore < 600)
            return "C";
        if (creditScore < 700)
            return "B";
        return "A";
    }

    // Public method for mapping loans (used by AdminController)
    public LoanResponse toLoanResponse(Loan loan) {
        int investorCount = investmentRepository.findByLoanId(loan.getId()).size();

        RepaymentSchedule nextSchedule = scheduleRepository.findNextUnpaidByLoanId(loan.getId()).orElse(null);

        return LoanResponse.builder()
                .id(loan.getId())
                .loanCode(loan.getLoanCode())
                .title(loan.getTitle())
                .description(loan.getDescription())
                .purpose(loan.getPurpose())
                .requestedAmount(loan.getRequestedAmount())
                .fundedAmount(loan.getFundedAmount())
                .remainingAmount(loan.getRemainingAmount())
                .fundingProgress(loan.getFundingProgress())
                .interestRate(loan.getInterestRate())
                .platformFeeRate(loan.getPlatformFeeRate())
                .termMonths(loan.getTermMonths())
                .riskGrade(loan.getRiskGrade())
                .creditScoreAtRequest(loan.getCreditScoreAtRequest())
                .status(loan.getStatus())
                .fundingDeadline(loan.getFundingDeadline())
                .disbursedAt(loan.getDisbursedAt())
                .maturityDate(loan.getMaturityDate())
                .totalRepaid(loan.getTotalRepaid())
                .totalInterestPaid(loan.getTotalInterestPaid())
                .investorCount(investorCount)
                .rejectionReason(loan.getRejectionReason())
                .borrowerId(loan.getBorrower() != null ? loan.getBorrower().getId() : null)
                .borrowerName(loan.getBorrower() != null ? maskName(loan.getBorrower().getFullName()) : "Unknown")
                .borrowerCreditScore(loan.getBorrower() != null ? loan.getBorrower().getCreditScore() : 0)
                .nextRepaymentDate(nextSchedule != null ? nextSchedule.getDueDate() : null)
                .nextRepaymentAmount(nextSchedule != null ? nextSchedule.getTotalAmount() : null)
                .createdAt(loan.getCreatedAt())
                .updatedAt(loan.getUpdatedAt())
                .build();
    }

    private String maskName(String name) {
        if (name == null || name.length() < 2)
            return "***";
        return name.charAt(0) + "***" + name.charAt(name.length() - 1);
    }

    // Loan Documents
    public List<com.nexo.server.dto.loan.LoanDocumentResponse> getLoanDocuments(Long loanId) {
        List<com.nexo.server.entities.LoanDocument> documents = loanDocumentRepository.findByLoanId(loanId);
        return documents.stream()
                .map(this::toLoanDocumentResponse)
                .toList();
    }

    @Transactional
    public com.nexo.server.dto.loan.LoanDocumentResponse uploadLoanDocument(
            Long loanId, Long userId, org.springframework.web.multipart.MultipartFile file,
            String documentType, String description) {
        com.nexo.server.entities.Loan loan = loanRepository.findByIdWithBorrower(loanId)
                .orElseThrow(() -> new ResourceNotFoundException("Loan", loanId));

        if (!loan.getBorrower().getId().equals(userId)) {
            throw new com.nexo.server.exceptions.ForbiddenException("You can only upload documents for your own loans");
        }

        if (loan.getStatus() != LoanStatus.DRAFT && loan.getStatus() != LoanStatus.PENDING_REVIEW) {
            throw new BadRequestException("Documents can only be uploaded for DRAFT or PENDING_REVIEW loans");
        }

        String filePath = fileStorageService.storeLoanDocument(file, loanId);

        com.nexo.server.entities.LoanDocument document = com.nexo.server.entities.LoanDocument.builder()
                .loan(loan)
                .documentType(documentType)
                .fileName(file.getOriginalFilename())
                .filePath(filePath)
                .fileSize(file.getSize())
                .mimeType(file.getContentType())
                .description(description)
                .build();

        document = loanDocumentRepository.save(document);
        log.info("Loan document uploaded: {} for loan: {}", document.getFileName(), loan.getLoanCode());
        return toLoanDocumentResponse(document);
    }

    @Transactional
    public void deleteLoanDocument(Long documentId, Long userId) {
        com.nexo.server.entities.LoanDocument document = loanDocumentRepository.findById(documentId)
                .orElseThrow(() -> new ResourceNotFoundException("Loan document", documentId));

        com.nexo.server.entities.Loan loan = document.getLoan();
        if (!loan.getBorrower().getId().equals(userId)) {
            throw new com.nexo.server.exceptions.ForbiddenException("You can only delete documents for your own loans");
        }

        loanDocumentRepository.delete(document);
        log.info("Loan document deleted: {} for loan: {}", document.getFileName(), loan.getLoanCode());
    }

    public List<com.nexo.server.dto.investment.InvestmentResponse> getLoanInvestments(Long loanId, Long userId) {
        Loan loan = loanRepository.findByIdWithBorrower(loanId)
                .orElseThrow(() -> new ResourceNotFoundException("Loan", loanId));

        // Only borrower can see investors
        if (!loan.getBorrower().getId().equals(userId)) {
            throw new ForbiddenException("You can only view investors for your own loans");
        }

        // Use findByLoanIdWithDetails to eager load loan and borrower
        List<Investment> investments = investmentRepository.findByLoanIdWithDetails(loanId);

        return investments.stream()
                .map(this::toInvestmentResponseForBorrower)
                .toList();
    }

    private com.nexo.server.dto.investment.InvestmentResponse toInvestmentResponseForBorrower(Investment investment) {
        BigDecimal returnProgress = BigDecimal.ZERO;
        if (investment.getExpectedReturn().compareTo(BigDecimal.ZERO) > 0) {
            returnProgress = investment.getActualReturn()
                    .divide(investment.getExpectedReturn(), 4, RoundingMode.HALF_UP)
                    .multiply(new BigDecimal("100"));
        }

        // Safely access loan and borrower with null checks
        Loan loan = investment.getLoan();
        User borrower = loan != null ? loan.getBorrower() : null;

        return com.nexo.server.dto.investment.InvestmentResponse.builder()
                .id(investment.getId())
                .investmentCode(investment.getInvestmentCode())
                .loanId(loan != null ? loan.getId() : null)
                .loanCode(loan != null ? loan.getLoanCode() : null)
                .loanTitle(loan != null ? loan.getTitle() : null)
                .amount(investment.getAmount())
                .interestRate(investment.getInterestRate())
                .status(investment.getStatus())
                .expectedReturn(investment.getExpectedReturn())
                .actualReturn(investment.getActualReturn())
                .returnProgress(returnProgress)
                .investedAt(investment.getInvestedAt())
                .maturityDate(investment.getMaturityDate())
                .loanStatus(loan != null ? loan.getStatus().name() : null)
                .borrowerCreditScore(borrower != null ? borrower.getCreditScore() : null)
                .createdAt(investment.getCreatedAt())
                .build();
    }

    private com.nexo.server.dto.loan.LoanDocumentResponse toLoanDocumentResponse(
            com.nexo.server.entities.LoanDocument document) {
        return com.nexo.server.dto.loan.LoanDocumentResponse.builder()
                .id(document.getId())
                .loanId(document.getLoan().getId())
                .documentType(document.getDocumentType())
                .fileName(document.getFileName())
                .filePath(document.getFilePath())
                .fileUrl("/api/files/" + document.getFilePath())
                .fileSize(document.getFileSize())
                .mimeType(document.getMimeType())
                .description(document.getDescription())
                .createdAt(document.getCreatedAt())
                .updatedAt(document.getUpdatedAt())
                .build();
    }
}
