package com.nexo.server.entities;

import com.nexo.server.enums.PaymentProvider;
import com.nexo.server.enums.PaymentStatus;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "payments", indexes = {
    @Index(name = "idx_payment_code", columnList = "payment_code"),
    @Index(name = "idx_payment_user", columnList = "user_id"),
    @Index(name = "idx_payment_provider", columnList = "provider"),
    @Index(name = "idx_payment_status", columnList = "status")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Payment extends BaseEntity {

    @Column(name = "payment_code", nullable = false, unique = true, length = 50)
    private String paymentCode;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "transaction_id")
    private Transaction transaction;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private PaymentProvider provider;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private PaymentStatus status = PaymentStatus.PENDING;

    @Column(nullable = false, precision = 18, scale = 2)
    private BigDecimal amount;

    @Column(length = 3)
    @Builder.Default
    private String currency = "VND";

    // Provider specific
    @Column(name = "provider_transaction_id")
    private String providerTransactionId;

    @Column(name = "provider_response_code", length = 50)
    private String providerResponseCode;

    @Column(name = "provider_message", columnDefinition = "TEXT")
    private String providerMessage;

    // URLs
    @Column(name = "return_url", length = 500)
    private String returnUrl;

    @Column(name = "callback_url", length = 500)
    private String callbackUrl;

    // Metadata
    @Column(name = "bank_code", length = 50)
    private String bankCode;

    @Column(name = "card_type", length = 50)
    private String cardType;

    @Column(name = "ip_address", length = 50)
    private String ipAddress;

    @Column(name = "expired_at")
    private LocalDateTime expiredAt;

    @Column(name = "paid_at")
    private LocalDateTime paidAt;
}

