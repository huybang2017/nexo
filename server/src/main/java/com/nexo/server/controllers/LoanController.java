package com.nexo.server.controllers;

import com.nexo.server.dto.common.ApiResponse;
import com.nexo.server.dto.common.PageResponse;
import com.nexo.server.dto.loan.*;

import com.nexo.server.enums.LoanStatus;
import com.nexo.server.security.CurrentUser;
import com.nexo.server.security.UserPrincipal;
import com.nexo.server.services.LoanService;
import org.springframework.http.MediaType;
import org.springframework.web.multipart.MultipartFile;
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

import java.util.List;

@RestController
@RequestMapping("/api/loans")
@RequiredArgsConstructor
@Tag(name = "Loans", description = "Loan management endpoints")
public class LoanController {

    private final LoanService loanService;

    @PostMapping
    @Operation(summary = "Create a new loan request")
    public ResponseEntity<ApiResponse<LoanResponse>> createLoan(
            @CurrentUser UserPrincipal user,
            @Valid @RequestBody CreateLoanRequest request) {
        LoanResponse response = loanService.createLoan(user.getId(), request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Loan request created successfully", response));
    }

    @GetMapping("/my")
    @Operation(summary = "Get my loans")
    public ResponseEntity<ApiResponse<PageResponse<LoanResponse>>> getMyLoans(
            @CurrentUser UserPrincipal user,
            @RequestParam(required = false) LoanStatus status,
            @PageableDefault(sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        PageResponse<LoanResponse> response = loanService.getMyLoans(user.getId(), status, pageable);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get loan by ID")
    public ResponseEntity<ApiResponse<LoanResponse>> getLoanById(@PathVariable Long id) {
        LoanResponse response = loanService.getLoanById(id);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/code/{code}")
    @Operation(summary = "Get loan by code")
    public ResponseEntity<ApiResponse<LoanResponse>> getLoanByCode(@PathVariable String code) {
        LoanResponse response = loanService.getLoanByCode(code);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PostMapping("/{id}/cancel")
    @Operation(summary = "Cancel loan request")
    public ResponseEntity<ApiResponse<Void>> cancelLoan(
            @CurrentUser UserPrincipal user,
            @PathVariable Long id) {
        loanService.cancelLoan(id, user.getId());
        return ResponseEntity.ok(ApiResponse.success("Loan cancelled successfully"));
    }

    // Loan Documents
    @GetMapping("/{id}/documents")
    @Operation(summary = "Get loan documents")
    public ResponseEntity<ApiResponse<List<LoanDocumentResponse>>> getLoanDocuments(@PathVariable Long id) {
        List<LoanDocumentResponse> documents = loanService.getLoanDocuments(id);
        return ResponseEntity.ok(ApiResponse.success(documents));
    }

    @PostMapping(value = "/{id}/documents", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "Upload loan document")
    public ResponseEntity<ApiResponse<LoanDocumentResponse>> uploadLoanDocument(
            @PathVariable Long id,
            @CurrentUser UserPrincipal user,
            @RequestParam("file") MultipartFile file,
            @RequestParam("documentType") String documentType,
            @RequestParam(required = false) String description) {
        LoanDocumentResponse document = loanService.uploadLoanDocument(
                id, user.getId(), file, documentType, description);
        return ResponseEntity.ok(ApiResponse.success("Document uploaded successfully", document));
    }

    @DeleteMapping("/documents/{documentId}")
    @Operation(summary = "Delete loan document")
    public ResponseEntity<ApiResponse<Void>> deleteLoanDocument(
            @PathVariable Long documentId,
            @CurrentUser UserPrincipal user) {
        loanService.deleteLoanDocument(documentId, user.getId());
        return ResponseEntity.ok(ApiResponse.success("Document deleted successfully"));
    }

    @GetMapping("/{id}/investments")
    @Operation(summary = "Get loan investments (for borrower to see investors)")
    public ResponseEntity<ApiResponse<List<com.nexo.server.dto.investment.InvestmentResponse>>> getLoanInvestments(
            @PathVariable Long id,
            @CurrentUser UserPrincipal user) {
        List<com.nexo.server.dto.investment.InvestmentResponse> investments = loanService.getLoanInvestments(id,
                user.getId());
        return ResponseEntity.ok(ApiResponse.success(investments));
    }
}
