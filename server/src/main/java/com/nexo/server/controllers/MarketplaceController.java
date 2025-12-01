package com.nexo.server.controllers;

import com.nexo.server.dto.common.ApiResponse;
import com.nexo.server.dto.common.PageResponse;
import com.nexo.server.dto.loan.LoanResponse;
import com.nexo.server.enums.LoanPurpose;
import com.nexo.server.services.LoanService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;

@RestController
@RequestMapping("/api/marketplace")
@RequiredArgsConstructor
@Tag(name = "Marketplace", description = "Loan marketplace")
public class MarketplaceController {

    private final LoanService loanService;

    @GetMapping("/loans")
    @Operation(summary = "Browse loans available for investment")
    public ResponseEntity<ApiResponse<PageResponse<LoanResponse>>> browseLoans(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) LoanPurpose purpose,
            @RequestParam(required = false) List<String> riskGrades,
            @RequestParam(required = false) BigDecimal minRate,
            @RequestParam(required = false) BigDecimal maxRate,
            @RequestParam(required = false) BigDecimal minAmount,
            @RequestParam(required = false) BigDecimal maxAmount,
            @RequestParam(required = false) Integer minTerm,
            @RequestParam(required = false) Integer maxTerm,
            @PageableDefault(sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        
        PageResponse<LoanResponse> response = loanService.getMarketplaceLoans(
                search, purpose, riskGrades, minRate, maxRate, minAmount, maxAmount, minTerm, maxTerm, pageable);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/loans/{id}")
    @Operation(summary = "Get loan details for investment")
    public ResponseEntity<ApiResponse<LoanResponse>> getLoanDetail(@PathVariable Long id) {
        LoanResponse response = loanService.getLoanById(id);
        return ResponseEntity.ok(ApiResponse.success(response));
    }
}

