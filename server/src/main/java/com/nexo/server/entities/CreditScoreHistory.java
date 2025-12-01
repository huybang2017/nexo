package com.nexo.server.entities;

import com.nexo.server.enums.CreditScoreEventType;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "credit_score_history", indexes = {
    @Index(name = "idx_credit_history_user", columnList = "user_id"),
    @Index(name = "idx_credit_history_event", columnList = "event_type"),
    @Index(name = "idx_credit_history_created", columnList = "created_at")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreditScoreHistory extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Enumerated(EnumType.STRING)
    @Column(name = "event_type", nullable = false)
    private CreditScoreEventType eventType;

    @Column(name = "score_before", nullable = false)
    private Integer scoreBefore;

    @Column(name = "score_after", nullable = false)
    private Integer scoreAfter;

    @Column(name = "score_change", nullable = false)
    private Integer scoreChange;

    @Column(columnDefinition = "TEXT")
    private String description;

    // Related entities (optional)
    @Column(name = "related_loan_id")
    private Long relatedLoanId;

    @Column(name = "related_repayment_id")
    private Long relatedRepaymentId;

    // Additional metadata
    @Column(name = "metadata", columnDefinition = "TEXT")
    private String metadata;

    @Column(name = "processed_by")
    private String processedBy;
}

