package com.nexo.server.controllers;

import com.nexo.server.dto.common.ApiResponse;
import com.nexo.server.dto.repayment.RepaymentResponse;
import com.nexo.server.dto.repayment.RepaymentScheduleResponse;
import com.nexo.server.entities.LenderReturn;
import com.nexo.server.entities.Repayment;
import com.nexo.server.entities.RepaymentSchedule;
import com.nexo.server.security.CurrentUser;
import com.nexo.server.security.UserPrincipal;
import com.nexo.server.services.RepaymentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/repayments")
@RequiredArgsConstructor
@Tag(name = "Repayment", description = "Loan repayment APIs")
public class RepaymentController {

    private final RepaymentService repaymentService;

    // ==================== BORROWER ENDPOINTS ====================

    @GetMapping("/loan/{loanId}/schedule")
    @Operation(summary = "Get repayment schedule for a loan")
    public ResponseEntity<ApiResponse<List<RepaymentScheduleResponse>>> getSchedule(@PathVariable Long loanId) {
        List<RepaymentSchedule> schedules = repaymentService.getSchedule(loanId);
        List<RepaymentScheduleResponse> responses = schedules.stream()
                .map(repaymentService::toRepaymentScheduleResponse)
                .toList();
        return ResponseEntity.ok(ApiResponse.success(responses));
    }

    @GetMapping("/upcoming")
    @Operation(summary = "Get upcoming repayments")
    public ResponseEntity<ApiResponse<List<RepaymentScheduleResponse>>> getUpcomingRepayments(
            @CurrentUser UserPrincipal currentUser) {
        List<RepaymentSchedule> schedules = repaymentService.getUpcomingRepayments(currentUser.getId());
        List<RepaymentScheduleResponse> responses = schedules.stream()
                .map(repaymentService::toRepaymentScheduleResponse)
                .toList();
        return ResponseEntity.ok(ApiResponse.success(responses));
    }

    @GetMapping("/overdue")
    @Operation(summary = "Get overdue repayments")
    public ResponseEntity<ApiResponse<List<RepaymentScheduleResponse>>> getOverdueRepayments(
            @CurrentUser UserPrincipal currentUser) {
        List<RepaymentSchedule> schedules = repaymentService.getOverdueRepayments(currentUser.getId());
        List<RepaymentScheduleResponse> responses = schedules.stream()
                .map(repaymentService::toRepaymentScheduleResponse)
                .toList();
        return ResponseEntity.ok(ApiResponse.success(responses));
    }

    @GetMapping("/paid")
    @Operation(summary = "Get paid repayments")
    public ResponseEntity<ApiResponse<List<RepaymentScheduleResponse>>> getPaidRepayments(
            @CurrentUser UserPrincipal currentUser) {
        List<RepaymentSchedule> schedules = repaymentService.getPaidRepayments(currentUser.getId());
        List<RepaymentScheduleResponse> responses = schedules.stream()
                .map(repaymentService::toRepaymentScheduleResponse)
                .toList();
        return ResponseEntity.ok(ApiResponse.success(responses));
    }

    @PostMapping("/schedule/{scheduleId}/pay")
    @Operation(summary = "Process a repayment")
    public ResponseEntity<ApiResponse<RepaymentResponse>> processRepayment(
            @PathVariable Long scheduleId,
            @CurrentUser UserPrincipal currentUser) {
        Repayment repayment = repaymentService.processRepayment(scheduleId, currentUser.getId());
        RepaymentResponse response = repaymentService.toRepaymentResponse(repayment);
        return ResponseEntity.ok(ApiResponse.success("Repayment processed successfully", response));
    }

    @GetMapping("/loan/{loanId}/history")
    @Operation(summary = "Get repayment history for a loan")
    public ResponseEntity<ApiResponse<List<RepaymentResponse>>> getRepaymentHistory(@PathVariable Long loanId) {
        List<Repayment> repayments = repaymentService.getRepaymentHistory(loanId);
        List<RepaymentResponse> responses = repayments.stream()
                .map(repaymentService::toRepaymentResponse)
                .toList();
        return ResponseEntity.ok(ApiResponse.success(responses));
    }

    // ==================== LENDER ENDPOINTS ====================

    @GetMapping("/investment/{investmentId}/returns")
    @Operation(summary = "Get returns for an investment")
    public ResponseEntity<ApiResponse<List<LenderReturn>>> getLenderReturns(@PathVariable Long investmentId) {
        List<LenderReturn> returns = repaymentService.getLenderReturns(investmentId);
        return ResponseEntity.ok(ApiResponse.success(returns));
    }

    // ==================== ADMIN ENDPOINTS ====================

    @GetMapping("/admin/overdue")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Get overdue repayments (Admin)")
    public ResponseEntity<ApiResponse<List<RepaymentScheduleResponse>>> getOverdueRepayments() {
        List<RepaymentSchedule> overdueSchedules = repaymentService.getOverdueRepayments();
        List<RepaymentScheduleResponse> responses = overdueSchedules.stream()
                .map(repaymentService::toRepaymentScheduleResponse)
                .toList();
        return ResponseEntity.ok(ApiResponse.success(responses));
    }

    @PostMapping("/loan/{loanId}/generate-schedule")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Generate repayment schedule for a loan (Admin)")
    public ResponseEntity<ApiResponse<List<RepaymentScheduleResponse>>> generateSchedule(@PathVariable Long loanId) {
        List<RepaymentSchedule> schedules = repaymentService.generateSchedule(loanId);
        List<RepaymentScheduleResponse> responses = schedules.stream()
                .map(repaymentService::toRepaymentScheduleResponse)
                .toList();
        return ResponseEntity.ok(ApiResponse.success("Schedule generated successfully", responses));
    }
}


