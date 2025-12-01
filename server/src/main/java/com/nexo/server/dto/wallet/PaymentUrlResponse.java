package com.nexo.server.dto.wallet;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PaymentUrlResponse {

    private String paymentCode;
    private String paymentUrl;
    private BigDecimal amount;
    private LocalDateTime expiresAt;
}

