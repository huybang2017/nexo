package com.nexo.server.controllers;

import com.nexo.server.dto.common.ApiResponse;
import com.nexo.server.dto.common.PageResponse;
import com.nexo.server.entities.Notification;
import com.nexo.server.security.CurrentUser;
import com.nexo.server.security.UserPrincipal;
import com.nexo.server.services.NotificationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
@Tag(name = "Notifications", description = "Notification management APIs")
public class NotificationController {

    private final NotificationService notificationService;

    @GetMapping
    @Operation(summary = "Get user notifications")
    public ResponseEntity<ApiResponse<PageResponse<NotificationResponse>>> getNotifications(
            @CurrentUser UserPrincipal currentUser,
            @RequestParam(defaultValue = "false") Boolean unreadOnly,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {

        Pageable pageable = PageRequest.of(page, size);
        Page<Notification> notifications = notificationService.getNotifications(
                currentUser.getId(), unreadOnly, pageable);

        PageResponse<NotificationResponse> response = PageResponse.<NotificationResponse>builder()
                .content(notifications.getContent().stream().map(this::toResponse).toList())
                .page(notifications.getNumber())
                .size(notifications.getSize())
                .totalElements(notifications.getTotalElements())
                .totalPages(notifications.getTotalPages())
                .last(notifications.isLast())
                .build();

        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/unread-count")
    @Operation(summary = "Get unread notifications count")
    public ResponseEntity<ApiResponse<Long>> getUnreadCount(@CurrentUser UserPrincipal currentUser) {
        long count = notificationService.getUnreadCount(currentUser.getId());
        return ResponseEntity.ok(ApiResponse.success(count));
    }

    @PatchMapping("/{id}/read")
    @Operation(summary = "Mark notification as read")
    public ResponseEntity<ApiResponse<Void>> markAsRead(
            @CurrentUser UserPrincipal currentUser,
            @PathVariable Long id) {
        notificationService.markAsRead(id, currentUser.getId());
        return ResponseEntity.ok(ApiResponse.success("Notification marked as read", null));
    }

    @PatchMapping("/read-all")
    @Operation(summary = "Mark all notifications as read")
    public ResponseEntity<ApiResponse<Void>> markAllAsRead(@CurrentUser UserPrincipal currentUser) {
        notificationService.markAllAsRead(currentUser.getId());
        return ResponseEntity.ok(ApiResponse.success("All notifications marked as read", null));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete notification")
    public ResponseEntity<ApiResponse<Void>> deleteNotification(
            @CurrentUser UserPrincipal currentUser,
            @PathVariable Long id) {
        notificationService.deleteNotification(id, currentUser.getId());
        return ResponseEntity.ok(ApiResponse.success("Notification deleted", null));
    }

    private NotificationResponse toResponse(Notification notification) {
        return NotificationResponse.builder()
                .id(notification.getId())
                .type(notification.getType().name())
                .title(notification.getTitle())
                .message(notification.getMessage())
                .actionUrl(notification.getActionUrl())
                .isRead(notification.getIsRead())
                .createdAt(notification.getCreatedAt())
                .build();
    }

    @lombok.Data
    @lombok.Builder
    @lombok.NoArgsConstructor
    @lombok.AllArgsConstructor
    public static class NotificationResponse {
        private Long id;
        private String type;
        private String title;
        private String message;
        private String actionUrl;
        private Boolean isRead;
        private java.time.LocalDateTime createdAt;
    }
}

