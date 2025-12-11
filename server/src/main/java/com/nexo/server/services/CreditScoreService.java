package com.nexo.server.services;

import com.nexo.server.dto.common.PageResponse;
import com.nexo.server.dto.creditscore.*;
import com.nexo.server.entities.*;
import com.nexo.server.enums.*;
import com.nexo.server.exceptions.ResourceNotFoundException;
import com.nexo.server.repositories.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class CreditScoreService {

    private final CreditScoreRepository creditScoreRepository;
    private final CreditScoreHistoryRepository historyRepository;
    private final UserRepository userRepository;
    private final LoanRepository loanRepository;
    private final RepaymentRepository repaymentRepository;
    private final KycProfileRepository kycProfileRepository;

    // ==================== SCORING WEIGHTS ====================
    // Total = 1000 points
    private static final int PAYMENT_HISTORY_WEIGHT = 350;      // 35%
    private static final int CREDIT_UTILIZATION_WEIGHT = 200;   // 20%
    private static final int CREDIT_HISTORY_LENGTH_WEIGHT = 150;// 15%
    private static final int IDENTITY_VERIFICATION_WEIGHT = 150;// 15%
    private static final int INCOME_STABILITY_WEIGHT = 100;     // 10%
    private static final int BEHAVIOR_WEIGHT = 50;              // 5%

    private static final int MAX_SCORE = 1000;
    private static final int MIN_SCORE = 0;
    private static final int INITIAL_SCORE = 300;

    // ==================== PUBLIC METHODS ====================

    @Transactional
    public CreditScoreResponse getOrCreateCreditScore(Long userId) {
        CreditScore creditScore = creditScoreRepository.findByUserId(userId)
                .orElseGet(() -> initializeCreditScore(userId));
        return toResponse(creditScore);
    }

    @Transactional(readOnly = true)
    public CreditScoreResponse getCreditScore(Long userId) {
        CreditScore creditScore = creditScoreRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Credit score not found for user: " + userId));
        return toResponse(creditScore);
    }

    @Transactional(readOnly = true)
    public CreditScoreSummaryResponse getCreditScoreSummary(Long userId) {
        CreditScore creditScore = creditScoreRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Credit score not found for user: " + userId));
        
        // Calculate 30-day change
        LocalDateTime thirtyDaysAgo = LocalDateTime.now().minusDays(30);
        List<CreditScoreHistory> recentHistory = historyRepository.findByUserIdAndDateRange(
                userId, thirtyDaysAgo, LocalDateTime.now());
        
        int scoreChange30Days = recentHistory.stream()
                .mapToInt(CreditScoreHistory::getScoreChange)
                .sum();
        
        String trend = scoreChange30Days > 0 ? "UP" : (scoreChange30Days < 0 ? "DOWN" : "STABLE");
        
        return CreditScoreSummaryResponse.builder()
                .totalScore(creditScore.getTotalScore())
                .maxScore(MAX_SCORE)
                .riskLevel(creditScore.getRiskLevel().name())
                .riskGrade(creditScore.getRiskGrade())
                .isEligibleForLoan(creditScore.getIsEligibleForLoan())
                .maxLoanAmount(creditScore.getMaxLoanAmount())
                .scoreChange30Days(scoreChange30Days)
                .recentEventsCount(recentHistory.size())
                .trend(trend)
                .build();
    }

    @Transactional(readOnly = true)
    public PageResponse<CreditScoreHistoryResponse> getCreditScoreHistory(Long userId, Pageable pageable) {
        Page<CreditScoreHistory> page = historyRepository.findByUserIdOrderByCreatedAtDesc(userId, pageable);
        
        List<CreditScoreHistoryResponse> content = page.getContent().stream()
                .map(this::toHistoryResponse)
                .collect(Collectors.toList());
        
        return PageResponse.<CreditScoreHistoryResponse>builder()
                .content(content)
                .page(page.getNumber())
                .size(page.getSize())
                .totalElements(page.getTotalElements())
                .totalPages(page.getTotalPages())
                .first(page.isFirst())
                .last(page.isLast())
                .build();
    }

    // ==================== SCORE CALCULATION ====================

    @Transactional
    public CreditScore initializeCreditScore(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + userId));
        
        if (creditScoreRepository.existsByUserId(userId)) {
            return creditScoreRepository.findByUserId(userId).get();
        }
        
        CreditScore creditScore = CreditScore.builder()
                .user(user)
                .totalScore(INITIAL_SCORE)
                .behaviorScore(50)
                .lastCalculatedAt(LocalDateTime.now())
                .nextReviewAt(LocalDateTime.now().plusDays(30))
                .build();
        
        creditScore.updateRiskLevel();
        creditScore.updateLoanEligibility();
        
        creditScore = creditScoreRepository.save(creditScore);
        
        // Record initial score
        recordScoreChange(creditScore, CreditScoreEventType.INITIAL_SCORE, 
                0, INITIAL_SCORE, "Initial credit score created", null, null);
        
        // Calculate initial components
        calculateAllComponents(creditScore);
        
        return creditScore;
    }

    @Transactional
    public CreditScore recalculateScore(Long userId) {
        CreditScore creditScore = creditScoreRepository.findByUserId(userId)
                .orElseGet(() -> initializeCreditScore(userId));
        
        int oldScore = creditScore.getTotalScore();
        calculateAllComponents(creditScore);
        int newScore = creditScore.getTotalScore();
        
        if (oldScore != newScore) {
            recordScoreChange(creditScore, CreditScoreEventType.SCORE_RECALCULATED,
                    oldScore, newScore, "Periodic score recalculation", null, null);
        }
        
        creditScore.setLastCalculatedAt(LocalDateTime.now());
        creditScore.setNextReviewAt(LocalDateTime.now().plusDays(30));
        
        return creditScoreRepository.save(creditScore);
    }

    private void calculateAllComponents(CreditScore creditScore) {
        Long userId = creditScore.getUser().getId();
        
        // Calculate each component
        int paymentHistoryScore = calculatePaymentHistoryScore(userId);
        int creditUtilizationScore = calculateCreditUtilizationScore(userId);
        int creditHistoryLengthScore = calculateCreditHistoryLengthScore(userId);
        int identityVerificationScore = calculateIdentityVerificationScore(userId);
        int incomeStabilityScore = calculateIncomeStabilityScore(userId);
        int behaviorScore = creditScore.getBehaviorScore();
        
        // Update component scores
        creditScore.setPaymentHistoryScore(paymentHistoryScore);
        creditScore.setCreditUtilizationScore(creditUtilizationScore);
        creditScore.setCreditHistoryLengthScore(creditHistoryLengthScore);
        creditScore.setIdentityVerificationScore(identityVerificationScore);
        creditScore.setIncomeStabilityScore(incomeStabilityScore);
        
        // Calculate total weighted score
        int totalScore = calculateTotalScore(
                paymentHistoryScore,
                creditUtilizationScore,
                creditHistoryLengthScore,
                identityVerificationScore,
                incomeStabilityScore,
                behaviorScore
        );
        
        creditScore.setTotalScore(Math.max(MIN_SCORE, Math.min(MAX_SCORE, totalScore)));
        creditScore.updateRiskLevel();
        creditScore.updateLoanEligibility();
        
        // Update statistics
        updateStatistics(creditScore, userId);
    }

    private int calculateTotalScore(int payment, int utilization, int history, int identity, int income, int behavior) {
        // Each component is 0-100, weighted to MAX_SCORE
        double score = 0;
        score += (payment / 100.0) * PAYMENT_HISTORY_WEIGHT;
        score += (utilization / 100.0) * CREDIT_UTILIZATION_WEIGHT;
        score += (history / 100.0) * CREDIT_HISTORY_LENGTH_WEIGHT;
        score += (identity / 100.0) * IDENTITY_VERIFICATION_WEIGHT;
        score += (income / 100.0) * INCOME_STABILITY_WEIGHT;
        score += (behavior / 100.0) * BEHAVIOR_WEIGHT;
        return (int) Math.round(score);
    }

    // ==================== COMPONENT CALCULATIONS ====================

    /**
     * Payment History Score (0-100)
     * Based on: on-time payments, late payments, defaults
     */
    private int calculatePaymentHistoryScore(Long userId) {
        List<Repayment> repayments = repaymentRepository.findByBorrowerId(userId);
        
        if (repayments.isEmpty()) {
            return 50; // No history = neutral score
        }
        
        int totalRepayments = repayments.size();
        int onTimePayments = 0;
        int latePayments = 0;
        int defaults = 0;
        
        for (Repayment r : repayments) {
            if (r.getStatus() == RepaymentStatus.PAID) {
                if (r.getDaysOverdue() == null || r.getDaysOverdue() == 0) {
                    onTimePayments++;
                } else if (r.getDaysOverdue() <= 30) {
                    latePayments++;
                } else {
                    defaults++;
                }
            } else if (r.getStatus() == RepaymentStatus.OVERDUE && 
                       r.getDaysOverdue() != null && r.getDaysOverdue() > 90) {
                defaults++;
            }
        }
        
        // Calculate score
        double onTimeRate = (double) onTimePayments / totalRepayments;
        double lateRate = (double) latePayments / totalRepayments;
        double defaultRate = (double) defaults / totalRepayments;
        
        // Score formula: 100 * onTimeRate - 30 * lateRate - 70 * defaultRate
        int score = (int) (100 * onTimeRate - 30 * lateRate - 70 * defaultRate);
        
        return Math.max(0, Math.min(100, score));
    }

    /**
     * Credit Utilization Score (0-100)
     * Based on: current loans vs max allowed
     */
    private int calculateCreditUtilizationScore(Long userId) {
        List<Loan> activeLoans = loanRepository.findByBorrowerIdAndStatusIn(userId, 
                List.of(LoanStatus.ACTIVE, LoanStatus.FUNDING));
        
        if (activeLoans.isEmpty()) {
            return 100; // No active loans = best score
        }
        
        BigDecimal totalBorrowed = activeLoans.stream()
                .map(Loan::getRequestedAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        
        // Assume max credit limit of 500M VND
        BigDecimal maxCredit = new BigDecimal("500000000");
        double utilizationRate = totalBorrowed.divide(maxCredit, 4, RoundingMode.HALF_UP).doubleValue();
        
        // Lower utilization = higher score
        if (utilizationRate <= 0.1) return 100;
        if (utilizationRate <= 0.3) return 85;
        if (utilizationRate <= 0.5) return 70;
        if (utilizationRate <= 0.7) return 50;
        if (utilizationRate <= 0.9) return 30;
        return 10;
    }

    /**
     * Credit History Length Score (0-100)
     * Based on: account age, first loan date
     */
    private int calculateCreditHistoryLengthScore(Long userId) {
        User user = userRepository.findById(userId).orElse(null);
        if (user == null) return 0;
        
        LocalDateTime createdAt = user.getCreatedAt();
        if (createdAt == null) return 30;
        
        long monthsOnPlatform = ChronoUnit.MONTHS.between(createdAt, LocalDateTime.now());
        
        // Longer history = higher score
        if (monthsOnPlatform < 1) return 20;
        if (monthsOnPlatform < 3) return 35;
        if (monthsOnPlatform < 6) return 50;
        if (monthsOnPlatform < 12) return 65;
        if (monthsOnPlatform < 24) return 80;
        if (monthsOnPlatform < 36) return 90;
        return 100;
    }

    /**
     * Identity Verification Score (0-100)
     * Based on: KYC status, verified documents
     */
    private int calculateIdentityVerificationScore(Long userId) {
        KycProfile kycProfile = kycProfileRepository.findByUserId(userId).orElse(null);
        User user = userRepository.findById(userId).orElse(null);
        
        int score = 0;
        
        // KYC Status
        if (kycProfile != null) {
            switch (kycProfile.getStatus()) {
                case APPROVED -> score += 50;
                case PENDING -> score += 20;
                case REJECTED -> score += 0;
                default -> score += 10;
            }
            
            // Additional verified info
            if (kycProfile.getIdCardNumber() != null && !kycProfile.getIdCardNumber().isEmpty()) {
                score += 15;
            }
            if (kycProfile.getBankAccountNumber() != null && !kycProfile.getBankAccountNumber().isEmpty()) {
                score += 15;
            }
            if (kycProfile.getEmployerName() != null && !kycProfile.getEmployerName().isEmpty()) {
                score += 10;
            }
        }
        
        // Email/Phone verification
        if (user != null) {
            if (Boolean.TRUE.equals(user.getEmailVerified())) {
                score += 5;
            }
            if (Boolean.TRUE.equals(user.getPhoneVerified())) {
                score += 5;
            }
        }
        
        return Math.min(100, score);
    }

    /**
     * Income Stability Score (0-100)
     * Based on: declared income, employment status
     */
    private int calculateIncomeStabilityScore(Long userId) {
        KycProfile kycProfile = kycProfileRepository.findByUserId(userId).orElse(null);
        
        if (kycProfile == null || kycProfile.getMonthlyIncome() == null) {
            return 30; // No income data
        }
        
        BigDecimal monthlyIncome = kycProfile.getMonthlyIncome();
        int score = 30;
        
        // Income level scoring (in VND)
        if (monthlyIncome.compareTo(new BigDecimal("5000000")) >= 0) score += 10;
        if (monthlyIncome.compareTo(new BigDecimal("10000000")) >= 0) score += 15;
        if (monthlyIncome.compareTo(new BigDecimal("20000000")) >= 0) score += 15;
        if (monthlyIncome.compareTo(new BigDecimal("50000000")) >= 0) score += 15;
        
        // Employment status
        if (kycProfile.getEmployerName() != null && !kycProfile.getEmployerName().isEmpty()) {
            score += 15;
        }
        if (kycProfile.getOccupation() != null && !kycProfile.getOccupation().isEmpty()) {
            score += 10;
        }
        
        return Math.min(100, score);
    }

    private void updateStatistics(CreditScore creditScore, Long userId) {
        // Count loans
        List<Loan> allLoans = loanRepository.findByBorrowerId(userId);
        long completedLoans = allLoans.stream()
                .filter(l -> l.getStatus() == LoanStatus.COMPLETED)
                .count();
        long defaultedLoans = allLoans.stream()
                .filter(l -> l.getStatus() == LoanStatus.DEFAULTED)
                .count();
        
        // Count repayments
        List<Repayment> repayments = repaymentRepository.findByBorrowerId(userId);
        long onTimePayments = repayments.stream()
                .filter(r -> r.getStatus() == RepaymentStatus.PAID && 
                            (r.getDaysOverdue() == null || r.getDaysOverdue() == 0))
                .count();
        long latePayments = repayments.stream()
                .filter(r -> r.getDaysOverdue() != null && r.getDaysOverdue() > 0)
                .count();
        
        // Calculate average days late
        double avgDaysLate = repayments.stream()
                .filter(r -> r.getDaysOverdue() != null && r.getDaysOverdue() > 0)
                .mapToInt(Repayment::getDaysOverdue)
                .average()
                .orElse(0.0);
        
        // Calculate totals
        BigDecimal totalBorrowed = allLoans.stream()
                .map(Loan::getRequestedAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        
        BigDecimal totalRepaid = repayments.stream()
                .filter(r -> r.getPaidAmount() != null)
                .map(Repayment::getPaidAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        
        // Update credit score statistics
        creditScore.setTotalLoansCompleted((int) completedLoans);
        creditScore.setTotalLoansDefaulted((int) defaultedLoans);
        creditScore.setTotalOnTimePayments((int) onTimePayments);
        creditScore.setTotalLatePayments((int) latePayments);
        creditScore.setAverageDaysLate(avgDaysLate);
        creditScore.setTotalAmountBorrowed(totalBorrowed);
        creditScore.setTotalAmountRepaid(totalRepaid);
    }

    // ==================== EVENT-BASED SCORE UPDATES ====================

    @Transactional
    public void onRepaymentMade(Long userId, Long repaymentId, int daysLate) {
        CreditScore creditScore = creditScoreRepository.findByUserId(userId)
                .orElseGet(() -> initializeCreditScore(userId));
        
        int oldScore = creditScore.getTotalScore();
        CreditScoreEventType eventType;
        int impact;
        
        if (daysLate < 0) {
            // Early payment
            eventType = CreditScoreEventType.REPAYMENT_EARLY;
            impact = eventType.getDefaultImpact();
        } else if (daysLate == 0) {
            // On-time payment
            eventType = CreditScoreEventType.REPAYMENT_ON_TIME;
            impact = eventType.getDefaultImpact();
        } else if (daysLate <= 7) {
            eventType = CreditScoreEventType.REPAYMENT_LATE_1_7_DAYS;
            impact = eventType.getDefaultImpact();
        } else if (daysLate <= 14) {
            eventType = CreditScoreEventType.REPAYMENT_LATE_8_14_DAYS;
            impact = eventType.getDefaultImpact();
        } else if (daysLate <= 30) {
            eventType = CreditScoreEventType.REPAYMENT_LATE_15_30_DAYS;
            impact = eventType.getDefaultImpact();
        } else {
            eventType = CreditScoreEventType.REPAYMENT_LATE_OVER_30_DAYS;
            impact = eventType.getDefaultImpact();
        }
        
        // Apply behavior score adjustment
        int newBehaviorScore = creditScore.getBehaviorScore() + (impact > 0 ? 2 : -5);
        creditScore.setBehaviorScore(Math.max(0, Math.min(100, newBehaviorScore)));
        
        // Recalculate total score
        calculateAllComponents(creditScore);
        int newScore = creditScore.getTotalScore();
        
        recordScoreChange(creditScore, eventType, oldScore, newScore, 
                eventType.getDescription(), null, repaymentId);
        
        creditScoreRepository.save(creditScore);
        
        // Update user's credit score
        updateUserCreditScore(userId, newScore);
    }

    @Transactional
    public void onLoanCompleted(Long userId, Long loanId) {
        CreditScore creditScore = creditScoreRepository.findByUserId(userId)
                .orElseGet(() -> initializeCreditScore(userId));
        
        int oldScore = creditScore.getTotalScore();
        
        // Boost behavior score
        int newBehaviorScore = creditScore.getBehaviorScore() + 10;
        creditScore.setBehaviorScore(Math.min(100, newBehaviorScore));
        
        calculateAllComponents(creditScore);
        int newScore = creditScore.getTotalScore();
        
        recordScoreChange(creditScore, CreditScoreEventType.LOAN_COMPLETED, 
                oldScore, newScore, "Loan fully repaid successfully", loanId, null);
        
        creditScoreRepository.save(creditScore);
        updateUserCreditScore(userId, newScore);
    }

    @Transactional
    public void onLoanDefaulted(Long userId, Long loanId) {
        CreditScore creditScore = creditScoreRepository.findByUserId(userId)
                .orElseGet(() -> initializeCreditScore(userId));
        
        int oldScore = creditScore.getTotalScore();
        
        // Heavy penalty on behavior score
        creditScore.setBehaviorScore(Math.max(0, creditScore.getBehaviorScore() - 50));
        
        calculateAllComponents(creditScore);
        int newScore = creditScore.getTotalScore();
        
        recordScoreChange(creditScore, CreditScoreEventType.LOAN_DEFAULTED, 
                oldScore, newScore, "Loan defaulted - significant credit impact", loanId, null);
        
        creditScoreRepository.save(creditScore);
        updateUserCreditScore(userId, newScore);
    }

    @Transactional
    public void onKycVerified(Long userId) {
        CreditScore creditScore = creditScoreRepository.findByUserId(userId)
                .orElseGet(() -> initializeCreditScore(userId));
        
        int oldScore = creditScore.getTotalScore();
        
        // Boost behavior score for completing KYC
        creditScore.setBehaviorScore(Math.min(100, creditScore.getBehaviorScore() + 10));
        
        calculateAllComponents(creditScore);
        int newScore = creditScore.getTotalScore();
        
        recordScoreChange(creditScore, CreditScoreEventType.KYC_VERIFIED, 
                oldScore, newScore, "KYC verification completed successfully", null, null);
        
        creditScoreRepository.save(creditScore);
        updateUserCreditScore(userId, newScore);
    }

    @Transactional
    public void onKycRejected(Long userId) {
        CreditScore creditScore = creditScoreRepository.findByUserId(userId)
                .orElseGet(() -> initializeCreditScore(userId));
        
        int oldScore = creditScore.getTotalScore();
        
        creditScore.setBehaviorScore(Math.max(0, creditScore.getBehaviorScore() - 5));
        
        calculateAllComponents(creditScore);
        int newScore = creditScore.getTotalScore();
        
        recordScoreChange(creditScore, CreditScoreEventType.KYC_REJECTED, 
                oldScore, newScore, "KYC verification rejected", null, null);
        
        creditScoreRepository.save(creditScore);
        updateUserCreditScore(userId, newScore);
    }

    @Transactional
    public void onFraudDetected(Long userId, String reason) {
        CreditScore creditScore = creditScoreRepository.findByUserId(userId)
                .orElseGet(() -> initializeCreditScore(userId));
        
        int oldScore = creditScore.getTotalScore();
        
        // Severe penalty
        creditScore.setBehaviorScore(0);
        creditScore.setIsEligibleForLoan(false);
        creditScore.setEligibilityReason("Account flagged for fraudulent activity");
        
        calculateAllComponents(creditScore);
        int newScore = Math.max(0, creditScore.getTotalScore() - 200);
        creditScore.setTotalScore(newScore);
        creditScore.updateRiskLevel();
        creditScore.updateLoanEligibility();
        creditScore.updateRiskLevel();
        
        recordScoreChange(creditScore, CreditScoreEventType.FRAUD_DETECTED, 
                oldScore, newScore, "Fraudulent activity detected: " + reason, null, null);
        
        creditScoreRepository.save(creditScore);
        updateUserCreditScore(userId, newScore);
    }

    // ==================== ADMIN FUNCTIONS ====================

    @Transactional
    public CreditScoreResponse adminAdjustScore(Long userId, Long adminId, AdminAdjustScoreRequest request) {
        CreditScore creditScore = creditScoreRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Credit score not found for user: " + userId));
        
        int oldScore = creditScore.getTotalScore();
        int newScore = Math.max(MIN_SCORE, Math.min(MAX_SCORE, oldScore + request.getAdjustment()));
        
        creditScore.setTotalScore(newScore);
        creditScore.updateRiskLevel();
        creditScore.updateLoanEligibility();
        creditScore.updateRiskLevel();
        creditScore.updateLoanEligibility();
        
        CreditScoreHistory history = CreditScoreHistory.builder()
                .user(creditScore.getUser())
                .eventType(CreditScoreEventType.MANUAL_ADJUSTMENT)
                .scoreBefore(oldScore)
                .scoreAfter(newScore)
                .scoreChange(request.getAdjustment())
                .description("Admin manual adjustment: " + request.getReason())
                .metadata(request.getMetadata())
                .processedBy("ADMIN:" + adminId)
                .build();
        
        historyRepository.save(history);
        creditScoreRepository.save(creditScore);
        updateUserCreditScore(userId, newScore);
        
        log.info("Admin {} adjusted credit score for user {} by {} points. New score: {}", 
                adminId, userId, request.getAdjustment(), newScore);
        
        return toResponse(creditScore);
    }

    // ==================== SCHEDULED TASKS ====================

    @Scheduled(cron = "0 0 2 * * ?") // Run at 2 AM daily
    @Transactional
    public void scheduledScoreRecalculation() {
        log.info("Starting scheduled credit score recalculation");
        
        List<CreditScore> dueForReview = creditScoreRepository.findDueForReview();
        for (CreditScore cs : dueForReview) {
            try {
                recalculateScore(cs.getUser().getId());
            } catch (Exception e) {
                log.error("Error recalculating score for user {}: {}", cs.getUser().getId(), e.getMessage());
            }
        }
        
        log.info("Completed scheduled recalculation for {} credit scores", dueForReview.size());
    }

    // ==================== HELPER METHODS ====================

    private void recordScoreChange(CreditScore creditScore, CreditScoreEventType eventType,
                                   int oldScore, int newScore, String description,
                                   Long loanId, Long repaymentId) {
        CreditScoreHistory history = CreditScoreHistory.builder()
                .user(creditScore.getUser())
                .eventType(eventType)
                .scoreBefore(oldScore)
                .scoreAfter(newScore)
                .scoreChange(newScore - oldScore)
                .description(description)
                .relatedLoanId(loanId)
                .relatedRepaymentId(repaymentId)
                .processedBy("SYSTEM")
                .build();
        
        historyRepository.save(history);
    }

    private void updateUserCreditScore(Long userId, int newScore) {
        userRepository.findById(userId).ifPresent(user -> {
            user.setCreditScore(newScore);
            userRepository.save(user);
        });
    }

    // ==================== RESPONSE MAPPERS ====================

    public CreditScoreResponse toResponse(CreditScore cs) {
        int totalPayments = cs.getTotalOnTimePayments() + cs.getTotalLatePayments();
        double onTimeRate = totalPayments > 0 ? (double) cs.getTotalOnTimePayments() / totalPayments * 100 : 0;
        double repaymentRate = cs.getTotalAmountBorrowed().compareTo(BigDecimal.ZERO) > 0 
                ? cs.getTotalAmountRepaid().divide(cs.getTotalAmountBorrowed(), 4, RoundingMode.HALF_UP).doubleValue() * 100 
                : 0;
        
        return CreditScoreResponse.builder()
                .id(cs.getId())
                .userId(cs.getUser().getId())
                .totalScore(cs.getTotalScore())
                .maxScore(MAX_SCORE)
                .components(CreditScoreResponse.ScoreComponentsResponse.builder()
                        .paymentHistoryScore(cs.getPaymentHistoryScore())
                        .paymentHistoryWeight(PAYMENT_HISTORY_WEIGHT)
                        .creditUtilizationScore(cs.getCreditUtilizationScore())
                        .creditUtilizationWeight(CREDIT_UTILIZATION_WEIGHT)
                        .creditHistoryLengthScore(cs.getCreditHistoryLengthScore())
                        .creditHistoryLengthWeight(CREDIT_HISTORY_LENGTH_WEIGHT)
                        .identityVerificationScore(cs.getIdentityVerificationScore())
                        .identityVerificationWeight(IDENTITY_VERIFICATION_WEIGHT)
                        .incomeStabilityScore(cs.getIncomeStabilityScore())
                        .incomeStabilityWeight(INCOME_STABILITY_WEIGHT)
                        .behaviorScore(cs.getBehaviorScore())
                        .behaviorWeight(BEHAVIOR_WEIGHT)
                        .build())
                .riskLevel(cs.getRiskLevel().name())
                .riskGrade(cs.getRiskGrade())
                .riskDescription(cs.getRiskLevel().getDescription())
                .isEligibleForLoan(cs.getIsEligibleForLoan())
                .eligibilityReason(cs.getEligibilityReason())
                .maxLoanAmount(cs.getMaxLoanAmount())
                .minInterestRate(cs.getMinInterestRate())
                .maxInterestRate(cs.getMaxInterestRate())
                .statistics(CreditScoreResponse.CreditStatsResponse.builder()
                        .totalLoansCompleted(cs.getTotalLoansCompleted())
                        .totalLoansDefaulted(cs.getTotalLoansDefaulted())
                        .totalOnTimePayments(cs.getTotalOnTimePayments())
                        .totalLatePayments(cs.getTotalLatePayments())
                        .averageDaysLate(cs.getAverageDaysLate())
                        .totalAmountBorrowed(cs.getTotalAmountBorrowed())
                        .totalAmountRepaid(cs.getTotalAmountRepaid())
                        .repaymentRate(repaymentRate)
                        .onTimePaymentRate(onTimeRate)
                        .build())
                .lastCalculatedAt(cs.getLastCalculatedAt())
                .nextReviewAt(cs.getNextReviewAt())
                .createdAt(cs.getCreatedAt())
                .updatedAt(cs.getUpdatedAt())
                .build();
    }

    private CreditScoreHistoryResponse toHistoryResponse(CreditScoreHistory h) {
        return CreditScoreHistoryResponse.builder()
                .id(h.getId())
                .userId(h.getUser().getId())
                .eventType(h.getEventType().name())
                .eventDescription(h.getEventType().getDescription())
                .scoreBefore(h.getScoreBefore())
                .scoreAfter(h.getScoreAfter())
                .scoreChange(h.getScoreChange())
                .description(h.getDescription())
                .relatedLoanId(h.getRelatedLoanId())
                .relatedRepaymentId(h.getRelatedRepaymentId())
                .createdAt(h.getCreatedAt())
                .build();
    }
}

