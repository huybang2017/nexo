package com.nexo.server.controllers;

import com.nexo.server.dto.common.ApiResponse;
import com.nexo.server.dto.kyc.KycDocumentResponse;
import com.nexo.server.dto.kyc.KycProfileResponse;
import com.nexo.server.dto.kyc.KycReviewRequest;
import com.nexo.server.dto.kyc.KycSubmitRequest;
import com.nexo.server.enums.KycDocumentType;
import com.nexo.server.enums.KycStatus;
import com.nexo.server.security.CurrentUser;
import com.nexo.server.security.UserPrincipal;
import com.nexo.server.services.KycService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/kyc")
@RequiredArgsConstructor
@Tag(name = "KYC", description = "KYC verification APIs")
public class KycController {

    private final KycService kycService;

    // ==================== USER ENDPOINTS ====================

    @GetMapping("/me")
    @Operation(summary = "Get current user's KYC profile")
    public ResponseEntity<ApiResponse<KycProfileResponse>> getMyKyc(
            @CurrentUser UserPrincipal currentUser) {
        KycProfileResponse profile = kycService.getKycProfile(currentUser.getId());
        return ResponseEntity.ok(ApiResponse.success(profile));
    }

    @PostMapping("/submit")
    @Operation(summary = "Submit KYC profile")
    public ResponseEntity<ApiResponse<KycProfileResponse>> submitKyc(
            @CurrentUser UserPrincipal currentUser,
            @Valid @RequestBody KycSubmitRequest request) {
        KycProfileResponse profile = kycService.submitKyc(currentUser.getId(), request);
        return ResponseEntity.ok(ApiResponse.success("KYC submitted successfully", profile));
    }

    @PostMapping(value = "/documents", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "Upload KYC document")
    public ResponseEntity<ApiResponse<KycDocumentResponse>> uploadDocument(
            @CurrentUser UserPrincipal currentUser,
            @RequestParam("file") MultipartFile file,
            @RequestParam("documentType") KycDocumentType documentType) {
        KycDocumentResponse document = kycService.uploadDocument(currentUser.getId(), file, documentType);
        return ResponseEntity.ok(ApiResponse.success("Document uploaded successfully", document));
    }

    // ==================== ADMIN ENDPOINTS ====================

    @GetMapping("/admin/pending")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Get pending KYC profiles (Admin)")
    public ResponseEntity<ApiResponse<Page<KycProfileResponse>>> getPendingKyc(
            @PageableDefault(size = 20, sort = "submittedAt", direction = Sort.Direction.ASC) Pageable pageable) {
        Page<KycProfileResponse> profiles = kycService.getPendingKyc(pageable);
        return ResponseEntity.ok(ApiResponse.success(profiles));
    }

    @GetMapping("/admin")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Get all KYC profiles (Admin)")
    public ResponseEntity<ApiResponse<Page<KycProfileResponse>>> getAllKyc(
            @RequestParam(required = false) KycStatus status,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<KycProfileResponse> profiles = kycService.getAllKyc(status, pageable);
        return ResponseEntity.ok(ApiResponse.success(profiles));
    }

    @GetMapping("/admin/{kycId}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Get KYC profile by ID (Admin)")
    public ResponseEntity<ApiResponse<KycProfileResponse>> getKycById(@PathVariable Long kycId) {
        KycProfileResponse profile = kycService.getKycById(kycId);
        return ResponseEntity.ok(ApiResponse.success(profile));
    }

    @PostMapping("/admin/{kycId}/review")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Review KYC profile (Admin)")
    public ResponseEntity<ApiResponse<KycProfileResponse>> reviewKyc(
            @PathVariable Long kycId,
            @CurrentUser UserPrincipal currentUser,
            @Valid @RequestBody KycReviewRequest request) {
        KycProfileResponse profile = kycService.reviewKyc(kycId, currentUser.getId(), request);
        String message = request.getAction() == KycReviewRequest.ReviewAction.APPROVE 
                ? "KYC approved successfully" : "KYC rejected";
        return ResponseEntity.ok(ApiResponse.success(message, profile));
    }
}

