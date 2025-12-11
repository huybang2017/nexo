package com.nexo.server.dto.ticket;

import com.nexo.server.dto.user.UserResponse;
import com.nexo.server.enums.TicketPriority;
import com.nexo.server.enums.TicketStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TicketResponse {
    private Long id;
    private String ticketCode;
    private UserResponse user;
    private UserResponse assignedTo;
    private String subject;
    private String category;
    private TicketStatus status;
    private TicketPriority priority;
    private LocalDateTime resolvedAt;
    private List<TicketMessageResponse> messages;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}


