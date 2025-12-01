package com.nexo.server.controllers;

import com.nexo.server.dto.kycscore.*;
import com.nexo.server.services.KycScoringService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/kyc-score")
@RequiredArgsConstructor
public class KycScoringController {

    private final KycScoringService kycScoringService;
    private final com.nexo.server.repositories.UserRepository userRepository;

    // ==================== USER ENDPOINTS ====================

    /**
     * Get current user's KYC score
     */
    @GetMapping("/me")
    public ResponseEntity<KycScoreResponse> getMyKycScore(
            @AuthenticationPrincipal UserDetails userDetails) {
        Long userId = getUserId(userDetails);
        KycScoreResponse score = kycScoringService.getKycScore(userId);
        return ResponseEntity.ok(score);
    }

    /**
     * Get current user's KYC score summary
     */
    @GetMapping("/me/summary")
    public ResponseEntity<KycScoreSummaryResponse> getMyKycScoreSummary(
            @AuthenticationPrincipal UserDetails userDetails) {
        Long userId = getUserId(userDetails);
        KycScoreSummaryResponse summary = kycScoringService.getKycScoreSummary(userId);
        return ResponseEntity.ok(summary);
    }

    // ==================== ADMIN ENDPOINTS ====================

    /**
     * Admin: Calculate/recalculate KYC score for a profile
     */
    @PostMapping("/admin/calculate/{kycProfileId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<KycScoreResponse> calculateKycScore(
            @PathVariable Long kycProfileId) {
        KycScoreResponse score = kycScoringService.calculateKycScore(kycProfileId);
        return ResponseEntity.ok(score);
    }

    /**
     * Admin: Get KYC score for any user
     */
    @GetMapping("/admin/user/{userId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<KycScoreResponse> getKycScoreByUserId(
            @PathVariable Long userId) {
        KycScoreResponse score = kycScoringService.getKycScore(userId);
        return ResponseEntity.ok(score);
    }

    /**
     * Admin: Check for duplicates
     */
    @GetMapping("/admin/check-duplicates/{kycProfileId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<DuplicateCheckResponse> checkDuplicates(
            @PathVariable Long kycProfileId) {
        DuplicateCheckResponse result = kycScoringService.checkForDuplicates(kycProfileId);
        return ResponseEntity.ok(result);
    }

    /**
     * Admin: Score a specific document
     */
    @PostMapping("/admin/document/{documentId}/score")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<KycDocumentScoreResponse> scoreDocument(
            @PathVariable Long documentId) {
        KycDocumentScoreResponse score = kycScoringService.scoreDocument(documentId);
        return ResponseEntity.ok(score);
    }

    /**
     * Admin: Get fraud flags for a profile
     */
    @GetMapping("/admin/fraud-flags/{kycProfileId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<KycScoreResponse.FraudFlagResponse>> getFraudFlags(
            @PathVariable Long kycProfileId) {
        List<KycScoreResponse.FraudFlagResponse> flags = kycScoringService.getFraudFlags(kycProfileId);
        return ResponseEntity.ok(flags);
    }

    /**
     * Admin: Manually adjust score
     */
    @PostMapping("/admin/adjust/{kycProfileId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<KycScoreResponse> adjustScore(
            @PathVariable Long kycProfileId,
            @RequestBody Map<String, Object> request) {
        int adjustment = (Integer) request.get("adjustment");
        String reason = (String) request.get("reason");
        KycScoreResponse score = kycScoringService.adminAdjustScore(kycProfileId, adjustment, reason);
        return ResponseEntity.ok(score);
    }

    /**
     * Admin: Resolve fraud flag
     */
    @PostMapping("/admin/fraud-flags/{flagId}/resolve")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> resolveFraudFlag(
            @PathVariable Long flagId,
            @RequestBody Map<String, String> request,
            @AuthenticationPrincipal UserDetails userDetails) {
        Long adminId = getUserId(userDetails);
        String resolutionNote = request.get("resolutionNote");
        kycScoringService.resolveFraudFlag(flagId, adminId, resolutionNote);
        return ResponseEntity.ok().build();
    }

    /**
     * Admin: Force recalculate score
     */
    @PostMapping("/admin/recalculate/{kycProfileId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<KycScoreResponse> recalculateScore(
            @PathVariable Long kycProfileId) {
        KycScoreResponse score = kycScoringService.recalculateScore(kycProfileId);
        return ResponseEntity.ok(score);
    }

    // ==================== HELPER METHODS ====================

    private Long getUserId(UserDetails userDetails) {
        return userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new RuntimeException("User not found"))
                .getId();
    }
}


