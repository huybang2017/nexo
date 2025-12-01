package com.nexo.server.entities;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "ticket_messages", indexes = {
    @Index(name = "idx_ticket_msg_ticket", columnList = "ticket_id")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TicketMessage extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ticket_id", nullable = false)
    private Ticket ticket;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "sender_id", nullable = false)
    private User sender;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String message;

    @Column(name = "is_internal")
    @Builder.Default
    private Boolean isInternal = false;

    @Column(name = "attachment_path", length = 500)
    private String attachmentPath;

    @Column(name = "attachment_name")
    private String attachmentName;
}

