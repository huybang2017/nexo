package com.nexo.server.controllers;

import com.nexo.server.dto.common.ApiResponse;
import com.nexo.server.dto.common.PageResponse;
import com.nexo.server.dto.wallet.*;
import com.nexo.server.enums.TransactionStatus;
import com.nexo.server.enums.TransactionType;
import com.nexo.server.security.CurrentUser;
import com.nexo.server.security.UserPrincipal;
import com.nexo.server.services.WalletService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;

@RestController
@RequestMapping("/api/wallet")
@RequiredArgsConstructor
@Tag(name = "Wallet", description = "Wallet management endpoints")
public class WalletController {

    private final WalletService walletService;

    @GetMapping
    @Operation(summary = "Get wallet info")
    public ResponseEntity<ApiResponse<WalletResponse>> getWallet(@CurrentUser UserPrincipal user) {
        WalletResponse response = walletService.getWallet(user.getId());
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/transactions")
    @Operation(summary = "Get transaction history")
    public ResponseEntity<ApiResponse<PageResponse<TransactionResponse>>> getTransactions(
            @CurrentUser UserPrincipal user,
            @RequestParam(required = false) TransactionType type,
            @RequestParam(required = false) TransactionStatus status,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime to,
            @PageableDefault(sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        
        PageResponse<TransactionResponse> response = walletService.getTransactions(
                user.getId(), type, status, from, to, pageable);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/transactions/{id}")
    @Operation(summary = "Get transaction detail by ID")
    public ResponseEntity<ApiResponse<TransactionResponse>> getTransaction(
            @PathVariable Long id,
            @CurrentUser UserPrincipal user) {
        TransactionResponse response = walletService.getTransactionById(id, user.getId());
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PostMapping("/deposit")
    @Operation(summary = "Request deposit via payment gateway")
    public ResponseEntity<ApiResponse<PaymentUrlResponse>> requestDeposit(
            @CurrentUser UserPrincipal user,
            @Valid @RequestBody DepositRequest request) {
        PaymentUrlResponse response = walletService.requestDeposit(user.getId(), request);
        return ResponseEntity.ok(ApiResponse.success("Payment URL generated", response));
    }

    @PostMapping("/withdraw")
    @Operation(summary = "Request withdrawal")
    public ResponseEntity<ApiResponse<TransactionResponse>> requestWithdraw(
            @CurrentUser UserPrincipal user,
            @Valid @RequestBody WithdrawRequest request) {
        TransactionResponse response = walletService.requestWithdraw(user.getId(), request);
        return ResponseEntity.ok(ApiResponse.success("Withdrawal request submitted", response));
    }
}

