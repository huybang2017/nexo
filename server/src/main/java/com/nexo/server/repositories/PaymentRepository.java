package com.nexo.server.repositories;

import com.nexo.server.entities.Payment;
import com.nexo.server.enums.PaymentProvider;
import com.nexo.server.enums.PaymentStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PaymentRepository extends JpaRepository<Payment, Long> {

    Optional<Payment> findByPaymentCode(String paymentCode);

    boolean existsByPaymentCode(String paymentCode);

    Optional<Payment> findByProviderTransactionId(String providerTransactionId);

    Page<Payment> findByUserId(Long userId, Pageable pageable);

    Page<Payment> findByUserIdAndStatus(Long userId, PaymentStatus status, Pageable pageable);

    List<Payment> findByStatusAndProvider(PaymentStatus status, PaymentProvider provider);

    Page<Payment> findByStatus(PaymentStatus status, Pageable pageable);
}

