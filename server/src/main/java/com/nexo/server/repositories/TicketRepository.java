package com.nexo.server.repositories;

import com.nexo.server.entities.Ticket;
import com.nexo.server.enums.TicketPriority;
import com.nexo.server.enums.TicketStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface TicketRepository extends JpaRepository<Ticket, Long> {

    @EntityGraph(attributePaths = {"user", "assignedTo"})
    Page<Ticket> findByUserId(Long userId, Pageable pageable);

    @EntityGraph(attributePaths = {"user", "assignedTo"})
    Page<Ticket> findByUserIdAndStatus(Long userId, TicketStatus status, Pageable pageable);

    @EntityGraph(attributePaths = {"user", "assignedTo"})
    Page<Ticket> findByStatus(TicketStatus status, Pageable pageable);

    @EntityGraph(attributePaths = {"user", "assignedTo"})
    Page<Ticket> findByPriority(TicketPriority priority, Pageable pageable);

    @EntityGraph(attributePaths = {"user", "assignedTo"})
    Page<Ticket> findByStatusAndPriority(TicketStatus status, TicketPriority priority, Pageable pageable);

    @EntityGraph(attributePaths = {"user", "assignedTo"})
    Page<Ticket> findAll(Pageable pageable);

    @EntityGraph(attributePaths = {"user", "assignedTo"})
    Page<Ticket> findByAssignedToId(Long staffId, Pageable pageable);

    @Query("SELECT DISTINCT t FROM Ticket t " +
           "JOIN FETCH t.user u " +
           "LEFT JOIN FETCH t.assignedTo a " +
           "LEFT JOIN FETCH t.messages m " +
           "LEFT JOIN FETCH m.sender s " +
           "WHERE t.id = :id")
    Ticket findByIdWithUserAndAssignedTo(@Param("id") Long id);

    @Query("SELECT DISTINCT t FROM Ticket t " +
           "LEFT JOIN FETCH t.user " +
           "LEFT JOIN FETCH t.assignedTo " +
           "WHERE " +
           "(:search IS NULL OR :search = '' OR " +
           "LOWER(t.ticketCode) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(t.subject) LIKE LOWER(CONCAT('%', :search, '%'))) AND " +
           "(:status IS NULL OR t.status = :status) AND " +
           "(:priority IS NULL OR t.priority = :priority)")
    Page<Ticket> searchTickets(
            @Param("search") String search,
            @Param("status") TicketStatus status,
            @Param("priority") TicketPriority priority,
            Pageable pageable);

    long countByStatus(TicketStatus status);

    long countByPriority(TicketPriority priority);
}
