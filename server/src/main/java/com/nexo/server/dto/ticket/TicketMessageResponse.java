package com.nexo.server.dto.ticket;

import com.nexo.server.dto.user.UserResponse;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TicketMessageResponse {
    private Long id;
    private UserResponse createdBy;
    private Boolean isStaffReply;
    private String message;
    private Boolean isInternal;
    private String attachmentPath;
    private String attachmentName;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}


