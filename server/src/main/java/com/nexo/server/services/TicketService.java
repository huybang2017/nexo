package com.nexo.server.services;

import com.nexo.server.entities.Loan;
import com.nexo.server.entities.Ticket;
import com.nexo.server.entities.TicketMessage;
import com.nexo.server.entities.User;
import com.nexo.server.enums.TicketPriority;
import com.nexo.server.enums.TicketStatus;
import com.nexo.server.exceptions.BadRequestException;
import com.nexo.server.exceptions.ResourceNotFoundException;
import com.nexo.server.repositories.LoanRepository;
import com.nexo.server.repositories.TicketRepository;
import com.nexo.server.repositories.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class TicketService {

    private final TicketRepository ticketRepository;
    private final UserRepository userRepository;
    private final LoanRepository loanRepository;
    private final NotificationService notificationService;

    /**
     * Create a new support ticket
     */
    @Transactional
    public Ticket createTicket(Long userId, String subject, String category, String description, Long relatedLoanId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        Loan relatedLoan = null;
        if (relatedLoanId != null) {
            relatedLoan = loanRepository.findById(relatedLoanId).orElse(null);
        }

        String ticketCode = "TKT-" + System.currentTimeMillis();

        Ticket ticket = Ticket.builder()
                .ticketCode(ticketCode)
                .user(user)
                .subject(subject)
                .category(category)
                .status(TicketStatus.OPEN)
                .priority(TicketPriority.MEDIUM)
                .relatedLoan(relatedLoan)
                .build();

        // Add initial message
        TicketMessage message = TicketMessage.builder()
                .ticket(ticket)
                .sender(user)
                .message(description)
                .isInternal(false)
                .build();

        ticket.getMessages().add(message);
        ticketRepository.save(ticket);

        log.info("Ticket {} created by user {}", ticketCode, userId);

        return ticket;
    }

    /**
     * Get ticket by ID
     */
    public Ticket getTicket(Long ticketId, Long userId, boolean isAdmin) {
        Ticket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new ResourceNotFoundException("Ticket not found"));

        // Non-admin users can only view their own tickets
        if (!isAdmin && !ticket.getUser().getId().equals(userId)) {
            throw new BadRequestException("Access denied");
        }

        return ticket;
    }

    /**
     * Get user's tickets
     */
    public Page<Ticket> getUserTickets(Long userId, TicketStatus status, Pageable pageable) {
        if (status != null) {
            return ticketRepository.findByUserIdAndStatus(userId, status, pageable);
        }
        return ticketRepository.findByUserId(userId, pageable);
    }

    /**
     * Get all tickets (Admin)
     */
    public Page<Ticket> getAllTickets(TicketStatus status, TicketPriority priority, Pageable pageable) {
        if (status != null && priority != null) {
            return ticketRepository.findByStatusAndPriority(status, priority, pageable);
        } else if (status != null) {
            return ticketRepository.findByStatus(status, pageable);
        } else if (priority != null) {
            return ticketRepository.findByPriority(priority, pageable);
        }
        return ticketRepository.findAll(pageable);
    }

    /**
     * Add message to ticket
     */
    @Transactional
    public Ticket addMessage(Long ticketId, Long senderId, String message, boolean isStaffReply) {
        Ticket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new ResourceNotFoundException("Ticket not found"));

        User sender = userRepository.findById(senderId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        // Non-staff can only add messages to their own tickets
        if (!isStaffReply && !ticket.getUser().getId().equals(senderId)) {
            throw new BadRequestException("Access denied");
        }

        // Check if ticket is closed
        if (ticket.getStatus() == TicketStatus.CLOSED) {
            throw new BadRequestException("Cannot add message to closed ticket");
        }

        TicketMessage ticketMessage = TicketMessage.builder()
                .ticket(ticket)
                .sender(sender)
                .message(message)
                .isInternal(isStaffReply)
                .build();

        ticket.getMessages().add(ticketMessage);

        // Update status based on who replied
        if (isStaffReply) {
            ticket.setStatus(TicketStatus.WAITING_CUSTOMER);
            // Notify customer
            notificationService.createNotification(ticket.getUser().getId(), "SYSTEM", "Ticket Reply",
                    "Staff has replied to your ticket: " + ticket.getSubject());
        } else {
            ticket.setStatus(TicketStatus.WAITING_SUPPORT);
        }

        ticketRepository.save(ticket);
        log.info("Message added to ticket {} by user {}", ticketId, senderId);

        return ticket;
    }

    /**
     * Update ticket status (Admin)
     */
    @Transactional
    public Ticket updateStatus(Long ticketId, TicketStatus status, Long adminId) {
        Ticket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new ResourceNotFoundException("Ticket not found"));

        ticket.setStatus(status);

        if (status == TicketStatus.RESOLVED || status == TicketStatus.CLOSED) {
            ticket.setResolvedAt(LocalDateTime.now());
        }

        ticketRepository.save(ticket);

        // Notify user
        notificationService.createNotification(ticket.getUser().getId(), "SYSTEM", "Ticket Updated",
                "Your ticket " + ticket.getTicketCode() + " status changed to " + status);

        log.info("Ticket {} status updated to {} by admin {}", ticketId, status, adminId);

        return ticket;
    }

    /**
     * Update ticket priority (Admin)
     */
    @Transactional
    public Ticket updatePriority(Long ticketId, TicketPriority priority) {
        Ticket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new ResourceNotFoundException("Ticket not found"));

        ticket.setPriority(priority);
        ticketRepository.save(ticket);

        log.info("Ticket {} priority updated to {}", ticketId, priority);

        return ticket;
    }

    /**
     * Assign ticket to staff (Admin)
     */
    @Transactional
    public Ticket assignTicket(Long ticketId, Long staffId) {
        Ticket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new ResourceNotFoundException("Ticket not found"));

        User staff = userRepository.findById(staffId)
                .orElseThrow(() -> new ResourceNotFoundException("Staff not found"));

        ticket.setAssignedTo(staff);
        ticket.setStatus(TicketStatus.IN_PROGRESS);
        ticketRepository.save(ticket);

        log.info("Ticket {} assigned to staff {}", ticketId, staffId);

        return ticket;
    }

    /**
     * Get ticket statistics (Admin)
     */
    public TicketStats getTicketStats() {
        long total = ticketRepository.count();
        long open = ticketRepository.countByStatus(TicketStatus.OPEN);
        long inProgress = ticketRepository.countByStatus(TicketStatus.IN_PROGRESS);
        long waitingSupport = ticketRepository.countByStatus(TicketStatus.WAITING_SUPPORT);
        long waitingCustomer = ticketRepository.countByStatus(TicketStatus.WAITING_CUSTOMER);
        long resolved = ticketRepository.countByStatus(TicketStatus.RESOLVED);
        long closed = ticketRepository.countByStatus(TicketStatus.CLOSED);

        return new TicketStats(total, open, inProgress, waitingSupport, waitingCustomer, resolved, closed);
    }

    public record TicketStats(
            long total,
            long open,
            long inProgress,
            long waitingSupport,
            long waitingCustomer,
            long resolved,
            long closed
    ) {}
}

