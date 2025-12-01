package com.nexo.server.controllers;

import com.nexo.server.dto.common.ApiResponse;
import com.nexo.server.dto.common.PageResponse;
import com.nexo.server.dto.creditscore.*;
import com.nexo.server.security.CurrentUser;
import com.nexo.server.security.UserPrincipal;
import com.nexo.server.services.CreditScoreService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/credit-score")
@RequiredArgsConstructor
@Tag(name = "Credit Score", description = "Credit score management APIs")
public class CreditScoreController {

    private final CreditScoreService creditScoreService;

    // ==================== USER ENDPOINTS ====================

    @GetMapping("/me")
    @Operation(summary = "Get current user's credit score")
    public ResponseEntity<ApiResponse<CreditScoreResponse>> getMyCreditScore(
            @CurrentUser UserPrincipal currentUser) {
        CreditScoreResponse response = creditScoreService.getOrCreateCreditScore(currentUser.getId());
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/me/summary")
    @Operation(summary = "Get current user's credit score summary")
    public ResponseEntity<ApiResponse<CreditScoreSummaryResponse>> getMyCreditScoreSummary(
            @CurrentUser UserPrincipal currentUser) {
        // Ensure credit score exists
        creditScoreService.getOrCreateCreditScore(currentUser.getId());
        CreditScoreSummaryResponse response = creditScoreService.getCreditScoreSummary(currentUser.getId());
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/me/history")
    @Operation(summary = "Get current user's credit score history")
    public ResponseEntity<ApiResponse<PageResponse<CreditScoreHistoryResponse>>> getMyCreditScoreHistory(
            @CurrentUser UserPrincipal currentUser,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        PageResponse<CreditScoreHistoryResponse> response = 
                creditScoreService.getCreditScoreHistory(currentUser.getId(), pageable);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PostMapping("/me/recalculate")
    @Operation(summary = "Request credit score recalculation")
    public ResponseEntity<ApiResponse<CreditScoreResponse>> recalculateMyScore(
            @CurrentUser UserPrincipal currentUser) {
        creditScoreService.recalculateScore(currentUser.getId());
        CreditScoreResponse response = creditScoreService.getCreditScore(currentUser.getId());
        return ResponseEntity.ok(ApiResponse.success("Credit score recalculated successfully", response));
    }

    // ==================== ADMIN ENDPOINTS ====================

    @GetMapping("/admin/user/{userId}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Get user's credit score (Admin)")
    public ResponseEntity<ApiResponse<CreditScoreResponse>> getUserCreditScore(
            @PathVariable Long userId) {
        CreditScoreResponse response = creditScoreService.getOrCreateCreditScore(userId);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/admin/user/{userId}/history")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Get user's credit score history (Admin)")
    public ResponseEntity<ApiResponse<PageResponse<CreditScoreHistoryResponse>>> getUserCreditScoreHistory(
            @PathVariable Long userId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        PageResponse<CreditScoreHistoryResponse> response = 
                creditScoreService.getCreditScoreHistory(userId, pageable);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PostMapping("/admin/user/{userId}/adjust")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Manually adjust user's credit score (Admin)")
    public ResponseEntity<ApiResponse<CreditScoreResponse>> adjustUserCreditScore(
            @PathVariable Long userId,
            @CurrentUser UserPrincipal currentUser,
            @Valid @RequestBody AdminAdjustScoreRequest request) {
        CreditScoreResponse response = creditScoreService.adminAdjustScore(
                userId, currentUser.getId(), request);
        return ResponseEntity.ok(ApiResponse.success("Credit score adjusted successfully", response));
    }

    @PostMapping("/admin/user/{userId}/recalculate")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Force recalculate user's credit score (Admin)")
    public ResponseEntity<ApiResponse<CreditScoreResponse>> forceRecalculateUserScore(
            @PathVariable Long userId) {
        creditScoreService.recalculateScore(userId);
        CreditScoreResponse response = creditScoreService.getCreditScore(userId);
        return ResponseEntity.ok(ApiResponse.success("Credit score recalculated successfully", response));
    }
}

