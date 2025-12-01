package com.nexo.server.services;

import com.nexo.server.dto.common.PageResponse;
import com.nexo.server.dto.wallet.*;
import com.nexo.server.entities.Transaction;
import com.nexo.server.entities.Wallet;
import com.nexo.server.enums.TransactionStatus;
import com.nexo.server.enums.TransactionType;
import com.nexo.server.exceptions.BadRequestException;
import com.nexo.server.exceptions.BusinessException;
import com.nexo.server.exceptions.ForbiddenException;
import com.nexo.server.exceptions.ResourceNotFoundException;
import com.nexo.server.repositories.TransactionRepository;
import com.nexo.server.repositories.WalletRepository;
import com.nexo.server.utils.CodeGenerator;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
@Slf4j
public class WalletService {

    private final WalletRepository walletRepository;
    private final TransactionRepository transactionRepository;
    private final PaymentService paymentService;

    public WalletResponse getWallet(Long userId) {
        Wallet wallet = walletRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Wallet not found for user: " + userId));
        return toWalletResponse(wallet);
    }

    public PageResponse<TransactionResponse> getTransactions(Long userId, TransactionType type, 
            TransactionStatus status, LocalDateTime fromDate, LocalDateTime toDate, Pageable pageable) {
        Page<Transaction> transactions;
        
        log.info("Fetching transactions for user {} with filters: type={}, status={}, from={}, to={}", 
                userId, type, status, fromDate, toDate);
        
        // Use specific repository methods when only one filter is applied for better performance and accuracy
        if (type == null && status == null && fromDate == null && toDate == null) {
            // No filters - use simple query
            transactions = transactionRepository.findByUserId(userId, pageable);
            log.info("No filters applied. Found {} transactions", transactions.getContent().size());
        } else if (type != null && status == null && fromDate == null && toDate == null) {
            // Only type filter
            transactions = transactionRepository.findByUserIdAndType(userId, type, pageable);
            log.info("Type filter applied: {}. Found {} transactions", type, transactions.getContent().size());
        } else if (type == null && status != null && fromDate == null && toDate == null) {
            // Only status filter - use specific method to ensure accuracy
            transactions = transactionRepository.findByUserIdAndStatus(userId, status, pageable);
            log.info("Status filter applied: {}. Found {} transactions", status, transactions.getContent().size());
            
            // Verify all results match the filter
            long matchingCount = transactions.getContent().stream()
                    .filter(t -> t.getStatus() == status)
                    .count();
            if (matchingCount != transactions.getContent().size()) {
                log.error("CRITICAL: Status filter failed! Expected all with status={}, but found {} out of {}", 
                        status, matchingCount, transactions.getContent().size());
            }
        } else {
            // Multiple filters - use filter query
            try {
                transactions = transactionRepository.findByUserIdWithFilters(
                        userId, type, status, fromDate, toDate, pageable);
                log.info("Multiple filters applied. Found {} transactions", transactions.getContent().size());
                
                // Verify filter results
                if (status != null) {
                    long filteredCount = transactions.getContent().stream()
                            .filter(t -> t.getStatus() == status)
                            .count();
                    if (filteredCount != transactions.getContent().size()) {
                        log.error("CRITICAL: Status filter mismatch! Expected all with status={}, but found {} out of {}", 
                                status, filteredCount, transactions.getContent().size());
                    }
                }
                if (type != null) {
                    long filteredCount = transactions.getContent().stream()
                            .filter(t -> t.getType() == type)
                            .count();
                    if (filteredCount != transactions.getContent().size()) {
                        log.error("CRITICAL: Type filter mismatch! Expected all with type={}, but found {} out of {}", 
                                type, filteredCount, transactions.getContent().size());
                    }
                }
            } catch (Exception e) {
                log.error("Error fetching transactions with filters for user {}: {}", userId, e.getMessage(), e);
                e.printStackTrace();
                // Fallback to simple query if filter query fails
                transactions = transactionRepository.findByUserId(userId, pageable);
            }
        }
        
        return PageResponse.of(transactions, 
                transactions.getContent().stream().map(this::toTransactionResponse).toList());
    }

    @Transactional
    public PaymentUrlResponse requestDeposit(Long userId, DepositRequest request) {
        Wallet wallet = walletRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Wallet not found"));

        // Create pending transaction
        Transaction transaction = Transaction.builder()
                .referenceCode(CodeGenerator.generateTransactionCode())
                .wallet(wallet)
                .user(wallet.getUser())
                .type(TransactionType.DEPOSIT)
                .status(TransactionStatus.PENDING)
                .amount(request.getAmount())
                .fee(BigDecimal.ZERO)
                .netAmount(request.getAmount())
                .balanceBefore(wallet.getBalance())
                .balanceAfter(wallet.getBalance()) // Will be updated after payment
                .description("Deposit via " + request.getProvider())
                .build();
        
        transaction = transactionRepository.save(transaction);

        // Create payment and get URL
        return paymentService.createPayment(userId, request, transaction);
    }

    @Transactional
    public void processDepositCallback(String paymentCode, boolean success, String providerTransactionId) {
        Transaction transaction = transactionRepository.findByReferenceCode(paymentCode)
                .orElseThrow(() -> new ResourceNotFoundException("Transaction not found"));

        if (transaction.getStatus() != TransactionStatus.PENDING) {
            log.warn("Transaction {} already processed", paymentCode);
            return;
        }

        if (success) {
            // Get wallet with lock
            Wallet wallet = walletRepository.findByUserIdForUpdate(transaction.getUser().getId())
                    .orElseThrow(() -> new ResourceNotFoundException("Wallet not found"));

            wallet.deposit(transaction.getAmount());
            walletRepository.save(wallet);

            transaction.setStatus(TransactionStatus.COMPLETED);
            transaction.setBalanceAfter(wallet.getBalance());
            transaction.setDescription(transaction.getDescription() + " - Provider: " + providerTransactionId);
            
            log.info("Deposit successful: {} - Amount: {}", paymentCode, transaction.getAmount());
        } else {
            transaction.setStatus(TransactionStatus.FAILED);
            log.info("Deposit failed: {}", paymentCode);
        }

        transactionRepository.save(transaction);
    }

    @Transactional
    public TransactionResponse requestWithdraw(Long userId, WithdrawRequest request) {
        Wallet wallet = walletRepository.findByUserIdForUpdate(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Wallet not found"));

        BigDecimal withdrawalFee = new BigDecimal("10000"); // Fixed fee
        BigDecimal totalAmount = request.getAmount().add(withdrawalFee);

        if (wallet.getAvailableBalance().compareTo(totalAmount) < 0) {
            throw new BusinessException("Insufficient balance. Available: " + wallet.getAvailableBalance());
        }

        // Lock the amount
        wallet.lock(totalAmount);
        walletRepository.save(wallet);

        // Create pending withdrawal transaction
        Transaction transaction = Transaction.builder()
                .referenceCode(CodeGenerator.generateTransactionCode())
                .wallet(wallet)
                .user(wallet.getUser())
                .type(TransactionType.WITHDRAW)
                .status(TransactionStatus.PENDING)
                .amount(request.getAmount())
                .fee(withdrawalFee)
                .netAmount(request.getAmount())
                .balanceBefore(wallet.getBalance())
                .balanceAfter(wallet.getBalance()) // Will be updated after approval
                .description(String.format("Withdraw to %s - %s - %s", 
                        request.getBankName(), request.getBankAccountNumber(), request.getBankAccountHolder()))
                .build();

        transaction = transactionRepository.save(transaction);
        
        log.info("Withdrawal requested: {} - Amount: {}", transaction.getReferenceCode(), request.getAmount());

        return toTransactionResponse(transaction);
    }

    @Transactional
    public void processWithdrawal(Long transactionId, boolean approved, String adminNote) {
        Transaction transaction = transactionRepository.findById(transactionId)
                .orElseThrow(() -> new ResourceNotFoundException("Transaction", transactionId));

        if (transaction.getStatus() != TransactionStatus.PENDING) {
            throw new BadRequestException("Transaction already processed");
        }
        if (transaction.getType() != TransactionType.WITHDRAW) {
            throw new BadRequestException("Not a withdrawal transaction");
        }

        Wallet wallet = walletRepository.findByUserIdForUpdate(transaction.getUser().getId())
                .orElseThrow(() -> new ResourceNotFoundException("Wallet not found"));

        BigDecimal totalAmount = transaction.getAmount().add(transaction.getFee());

        if (approved) {
            wallet.confirmLockedTransaction(totalAmount);
            transaction.setStatus(TransactionStatus.COMPLETED);
            transaction.setBalanceAfter(wallet.getBalance());
            log.info("Withdrawal approved: {}", transaction.getReferenceCode());
        } else {
            wallet.unlock(totalAmount);
            transaction.setStatus(TransactionStatus.CANCELLED);
            transaction.setDescription(transaction.getDescription() + " - Rejected: " + adminNote);
            log.info("Withdrawal rejected: {}", transaction.getReferenceCode());
        }

        walletRepository.save(wallet);
        transactionRepository.save(transaction);
    }

    @Transactional
    public void lockBalance(Long userId, BigDecimal amount) {
        Wallet wallet = walletRepository.findByUserIdForUpdate(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Wallet not found"));
        
        if (wallet.getAvailableBalance().compareTo(amount) < 0) {
            throw new BusinessException("Insufficient balance");
        }
        
        wallet.lock(amount);
        walletRepository.save(wallet);
    }

    @Transactional
    public void unlockBalance(Long userId, BigDecimal amount) {
        Wallet wallet = walletRepository.findByUserIdForUpdate(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Wallet not found"));
        
        wallet.unlock(amount);
        walletRepository.save(wallet);
    }

    @Transactional
    public Transaction createTransaction(Long userId, TransactionType type, BigDecimal amount, 
            BigDecimal fee, String description) {
        Wallet wallet = walletRepository.findByUserIdForUpdate(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Wallet not found"));

        BigDecimal balanceBefore = wallet.getBalance();
        BigDecimal netAmount = amount.subtract(fee != null ? fee : BigDecimal.ZERO);

        // Update wallet balance based on transaction type
        if (type == TransactionType.DEPOSIT || type == TransactionType.REPAYMENT_RECEIVED 
                || type == TransactionType.INVESTMENT_RETURN || type == TransactionType.LOAN_DISBURSEMENT) {
            wallet.deposit(netAmount);
        } else if (type == TransactionType.WITHDRAW || type == TransactionType.REPAYMENT_PAID) {
            // For WITHDRAW and REPAYMENT_PAID: confirm locked transaction (reduce balance and lockedBalance)
            wallet.confirmLockedTransaction(amount);
        } else if (type == TransactionType.INVESTMENT) {
            // For INVESTMENT: directly deduct from available balance
            // No locking needed - money is transferred immediately
            wallet.withdraw(amount);
        }

        walletRepository.save(wallet);

        Transaction transaction = Transaction.builder()
                .referenceCode(CodeGenerator.generateTransactionCode())
                .wallet(wallet)
                .user(wallet.getUser())
                .type(type)
                .status(TransactionStatus.COMPLETED)
                .amount(amount)
                .fee(fee != null ? fee : BigDecimal.ZERO)
                .netAmount(netAmount)
                .balanceBefore(balanceBefore)
                .balanceAfter(wallet.getBalance())
                .description(description)
                .build();

        return transactionRepository.save(transaction);
    }

    private WalletResponse toWalletResponse(Wallet wallet) {
        return WalletResponse.builder()
                .id(wallet.getId())
                .balance(wallet.getBalance())
                .lockedBalance(wallet.getLockedBalance())
                .availableBalance(wallet.getAvailableBalance())
                .currency(wallet.getCurrency())
                .isActive(wallet.getIsActive())
                .updatedAt(wallet.getUpdatedAt())
                .build();
    }

    public TransactionResponse getTransactionById(Long transactionId, Long userId) {
        Transaction transaction = transactionRepository.findById(transactionId)
                .orElseThrow(() -> new ResourceNotFoundException("Transaction", transactionId));
        
        // Verify transaction belongs to user
        if (!transaction.getUser().getId().equals(userId)) {
            throw new ForbiddenException("You can only view your own transactions");
        }
        
        return toTransactionResponse(transaction);
    }

    public TransactionResponse toTransactionResponse(Transaction transaction) {
        return TransactionResponse.builder()
                .id(transaction.getId())
                .referenceCode(transaction.getReferenceCode())
                .type(transaction.getType())
                .status(transaction.getStatus())
                .amount(transaction.getAmount())
                .fee(transaction.getFee())
                .netAmount(transaction.getNetAmount())
                .balanceBefore(transaction.getBalanceBefore())
                .balanceAfter(transaction.getBalanceAfter())
                .currency(transaction.getCurrency())
                .description(transaction.getDescription())
                .loanId(transaction.getLoan() != null ? transaction.getLoan().getId() : null)
                .loanCode(transaction.getLoan() != null ? transaction.getLoan().getLoanCode() : null)
                .investmentId(transaction.getInvestment() != null ? transaction.getInvestment().getId() : null)
                .investmentCode(transaction.getInvestment() != null ? transaction.getInvestment().getInvestmentCode() : null)
                .userId(transaction.getUser() != null ? transaction.getUser().getId() : null)
                .userName(transaction.getUser() != null ? transaction.getUser().getFullName() : null)
                .userEmail(transaction.getUser() != null ? transaction.getUser().getEmail() : null)
                .createdAt(transaction.getCreatedAt())
                .build();
    }
}

