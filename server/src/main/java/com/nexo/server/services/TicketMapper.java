package com.nexo.server.services;

import com.nexo.server.dto.ticket.TicketMessageResponse;
import com.nexo.server.dto.ticket.TicketResponse;
import com.nexo.server.entities.Ticket;
import com.nexo.server.entities.TicketMessage;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.stream.Collectors;

@Component
@RequiredArgsConstructor
public class TicketMapper {

    private final UserMapper userMapper;

    public TicketResponse toResponse(Ticket ticket) {
        if (ticket == null) return null;

        return TicketResponse.builder()
                .id(ticket.getId())
                .ticketCode(ticket.getTicketCode())
                .user(userMapper.toResponse(ticket.getUser()))
                .assignedTo(userMapper.toResponse(ticket.getAssignedTo()))
                .subject(ticket.getSubject())
                .category(ticket.getCategory())
                .status(ticket.getStatus())
                .priority(ticket.getPriority())
                .resolvedAt(ticket.getResolvedAt())
                .messages(ticket.getMessages() != null ? 
                    ticket.getMessages().stream()
                        .map(this::toMessageResponse)
                        .collect(Collectors.toList()) : null)
                .createdAt(ticket.getCreatedAt())
                .updatedAt(ticket.getUpdatedAt())
                .build();
    }

    private TicketMessageResponse toMessageResponse(TicketMessage message) {
        if (message == null) return null;

        return TicketMessageResponse.builder()
                .id(message.getId())
                .createdBy(userMapper.toResponse(message.getSender()))
                .isStaffReply(message.getSender() != null && 
                    (message.getSender().getRole() != null && 
                     (message.getSender().getRole().name().equals("ADMIN") || 
                      message.getSender().getRole().name().equals("STAFF"))))
                .message(message.getMessage())
                .isInternal(message.getIsInternal())
                .attachmentPath(message.getAttachmentPath())
                .attachmentName(message.getAttachmentName())
                .createdAt(message.getCreatedAt())
                .updatedAt(message.getUpdatedAt())
                .build();
    }
}


