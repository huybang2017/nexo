package com.nexo.server.controllers;

import com.nexo.server.dto.common.ApiResponse;
import com.nexo.server.dto.common.PageResponse;
import com.nexo.server.dto.investment.*;
import com.nexo.server.enums.InvestmentStatus;
import com.nexo.server.security.CurrentUser;
import com.nexo.server.security.UserPrincipal;
import com.nexo.server.services.InvestmentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/investments")
@RequiredArgsConstructor
@Tag(name = "Investments", description = "Investment management endpoints")
public class InvestmentController {

    private final InvestmentService investmentService;

    @PostMapping
    @Operation(summary = "Create a new investment")
    public ResponseEntity<ApiResponse<InvestmentResponse>> createInvestment(
            @CurrentUser UserPrincipal user,
            @Valid @RequestBody InvestRequest request) {
        InvestmentResponse response = investmentService.createInvestment(user.getId(), request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Investment successful", response));
    }

    @GetMapping("/my")
    @Operation(summary = "Get my investments")
    public ResponseEntity<ApiResponse<PageResponse<InvestmentResponse>>> getMyInvestments(
            @CurrentUser UserPrincipal user,
            @RequestParam(required = false) InvestmentStatus status,
            @PageableDefault(sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        PageResponse<InvestmentResponse> response = investmentService.getMyInvestments(user.getId(), status, pageable);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get investment by ID")
    public ResponseEntity<ApiResponse<InvestmentResponse>> getInvestment(
            @CurrentUser UserPrincipal user,
            @PathVariable Long id) {
        InvestmentResponse response = investmentService.getInvestmentById(id, user.getId());
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/portfolio")
    @Operation(summary = "Get investment portfolio summary")
    public ResponseEntity<ApiResponse<PortfolioResponse>> getPortfolio(@CurrentUser UserPrincipal user) {
        PortfolioResponse response = investmentService.getPortfolio(user.getId());
        return ResponseEntity.ok(ApiResponse.success(response));
    }
}
