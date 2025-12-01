package com.nexo.server.repositories;

import com.nexo.server.entities.Ticket;
import com.nexo.server.enums.TicketPriority;
import com.nexo.server.enums.TicketStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface TicketRepository extends JpaRepository<Ticket, Long> {

    Page<Ticket> findByUserId(Long userId, Pageable pageable);

    Page<Ticket> findByUserIdAndStatus(Long userId, TicketStatus status, Pageable pageable);

    Page<Ticket> findByStatus(TicketStatus status, Pageable pageable);

    Page<Ticket> findByPriority(TicketPriority priority, Pageable pageable);

    Page<Ticket> findByStatusAndPriority(TicketStatus status, TicketPriority priority, Pageable pageable);

    Page<Ticket> findByAssignedToId(Long staffId, Pageable pageable);

    long countByStatus(TicketStatus status);

    long countByPriority(TicketPriority priority);
}
