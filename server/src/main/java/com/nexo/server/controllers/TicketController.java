package com.nexo.server.controllers;

import com.nexo.server.dto.common.ApiResponse;
import com.nexo.server.dto.common.PageResponse;
import com.nexo.server.entities.Ticket;
import com.nexo.server.enums.TicketPriority;
import com.nexo.server.enums.TicketStatus;

import com.nexo.server.security.CurrentUser;
import com.nexo.server.security.UserPrincipal;
import com.nexo.server.services.TicketService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/tickets")
@RequiredArgsConstructor
@Tag(name = "Support Ticket", description = "Support ticket APIs")
public class TicketController {

    private final TicketService ticketService;

    // ==================== USER ENDPOINTS ====================

    @PostMapping
    @Operation(summary = "Create a new support ticket")
    public ResponseEntity<ApiResponse<Ticket>> createTicket(
            @CurrentUser UserPrincipal currentUser,
            @Valid @RequestBody CreateTicketRequest request) {
        Ticket ticket = ticketService.createTicket(
                currentUser.getId(),
                request.getSubject(),
                request.getCategory(),
                request.getDescription(),
                request.getRelatedLoanId());
        return ResponseEntity.ok(ApiResponse.success("Ticket created successfully", ticket));
    }

    @GetMapping("/my")
    @Operation(summary = "Get current user's tickets")
    public ResponseEntity<ApiResponse<PageResponse<Ticket>>> getMyTickets(
            @CurrentUser UserPrincipal currentUser,
            @RequestParam(required = false) TicketStatus status,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<Ticket> tickets = ticketService.getUserTickets(currentUser.getId(), status, pageable);
        PageResponse<Ticket> response = PageResponse.of(tickets);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/{ticketId}")
    @Operation(summary = "Get ticket detail")
    public ResponseEntity<ApiResponse<com.nexo.server.dto.ticket.TicketResponse>> getTicket(
            @PathVariable Long ticketId,
            @CurrentUser UserPrincipal currentUser) {
        boolean isAdmin = currentUser.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
        com.nexo.server.dto.ticket.TicketResponse ticket = ticketService.getTicketResponse(ticketId, currentUser.getId(), isAdmin);
        return ResponseEntity.ok(ApiResponse.success(ticket));
    }

    @PostMapping("/{ticketId}/messages")
    @Operation(summary = "Add message to ticket")
    public ResponseEntity<ApiResponse<Ticket>> addMessage(
            @PathVariable Long ticketId,
            @CurrentUser UserPrincipal currentUser,
            @Valid @RequestBody AddMessageRequest request) {
        boolean isStaffReply = currentUser.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
        Ticket ticket = ticketService.addMessage(ticketId, currentUser.getId(), request.getMessage(), isStaffReply);
        return ResponseEntity.ok(ApiResponse.success("Message added", ticket));
    }

    // ==================== ADMIN ENDPOINTS ====================

    @GetMapping("/admin")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Get all tickets (Admin)")
    public ResponseEntity<ApiResponse<PageResponse<Ticket>>> getAllTickets(
            @RequestParam(required = false) TicketStatus status,
            @RequestParam(required = false) TicketPriority priority,
            @RequestParam(required = false) String search,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<Ticket> tickets = ticketService.getAllTickets(status, priority, search, pageable);
        PageResponse<Ticket> response = PageResponse.of(tickets);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PutMapping("/admin/{ticketId}/status")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Update ticket status (Admin)")
    public ResponseEntity<ApiResponse<Void>> updateStatus(
            @PathVariable Long ticketId,
            @CurrentUser UserPrincipal currentUser,
            @RequestParam TicketStatus status) {
        ticketService.updateStatus(ticketId, status, currentUser.getId());
        return ResponseEntity.ok(ApiResponse.success("Status updated successfully"));
    }

    @PutMapping("/admin/{ticketId}/priority")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Update ticket priority (Admin)")
    public ResponseEntity<ApiResponse<Void>> updatePriority(
            @PathVariable Long ticketId,
            @RequestParam TicketPriority priority) {
        ticketService.updatePriority(ticketId, priority);
        return ResponseEntity.ok(ApiResponse.success("Priority updated successfully"));
    }

    @PutMapping("/admin/{ticketId}/assign")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Assign ticket to staff (Admin)")
    public ResponseEntity<ApiResponse<Void>> assignTicket(
            @PathVariable Long ticketId,
            @RequestParam Long staffId) {
        ticketService.assignTicket(ticketId, staffId);
        return ResponseEntity.ok(ApiResponse.success("Ticket assigned successfully"));
    }

    @GetMapping("/admin/stats")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Get ticket statistics (Admin)")
    public ResponseEntity<ApiResponse<TicketService.TicketStats>> getTicketStats() {
        TicketService.TicketStats stats = ticketService.getTicketStats();
        return ResponseEntity.ok(ApiResponse.success(stats));
    }

    // ==================== REQUEST DTOs ====================

    @Data
    public static class CreateTicketRequest {
        @NotBlank(message = "Subject is required")
        private String subject;

        @NotBlank(message = "Category is required")
        private String category;

        @NotBlank(message = "Description is required")
        private String description;

        private Long relatedLoanId;
    }

    @Data
    public static class AddMessageRequest {
        @NotBlank(message = "Message is required")
        private String message;
    }
}
