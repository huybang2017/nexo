package com.nexo.server.controllers;

import com.nexo.server.entities.Payment;
import com.nexo.server.enums.PaymentStatus;
import com.nexo.server.repositories.PaymentRepository;
import com.nexo.server.services.PaymentService;
import com.nexo.server.services.WalletService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

/**
 * Mock Payment Controller for Development
 * Simulates MoMo payment page when mock-mode is enabled
 */
@Controller
@RequestMapping("/api/payment/mock")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Mock Payment", description = "Mock payment endpoints for development")
public class MockPaymentController {

    private final PaymentService paymentService;
    private final WalletService walletService;
    private final PaymentRepository paymentRepository;

    @GetMapping("/momo")
    @Operation(summary = "Mock MoMo payment page")
    public String mockMoMoPayment(@RequestParam String paymentCode, Model model) {
        try {
            Payment payment = paymentService.getPaymentByCode(paymentCode);
            model.addAttribute("paymentCode", paymentCode);
            model.addAttribute("amount", payment.getAmount());
            model.addAttribute("orderInfo", "Deposit to Nexo wallet: " + paymentCode);
            return "mock-momo-payment";
        } catch (Exception e) {
            log.error("Error loading mock payment page", e);
            model.addAttribute("error", "Payment not found");
            return "error";
        }
    }

    @PostMapping("/momo/success")
    @Operation(summary = "Simulate successful MoMo payment")
    public ResponseEntity<Map<String, String>> simulateSuccess(@RequestParam String paymentCode) {
        log.info("Simulating successful MoMo payment for: {}", paymentCode);

        try {
            Payment payment = paymentService.getPaymentByCode(paymentCode);

            // Simulate MoMo callback
            Map<String, String> callbackParams = new HashMap<>();
            callbackParams.put("partnerCode", "MOMOTEST");
            callbackParams.put("accessKey", "TEST");
            callbackParams.put("requestId", paymentCode);
            callbackParams.put("amount", String.valueOf(payment.getAmount().longValue()));
            callbackParams.put("orderId", paymentCode);
            callbackParams.put("orderInfo", "Deposit to Nexo wallet: " + paymentCode);
            callbackParams.put("orderType", "captureWallet");
            callbackParams.put("transId", "MOCK" + System.currentTimeMillis());
            callbackParams.put("message", "Success");
            callbackParams.put("localMessage", "Thành công");
            callbackParams.put("responseTime", String.valueOf(System.currentTimeMillis()));
            callbackParams.put("errorCode", "0");
            callbackParams.put("payType", "webApp");
            callbackParams.put("extraData", "");

            // Process payment
            paymentService.processMoMoCallback(callbackParams);

            // Update wallet if successful
            if (payment.getStatus() == PaymentStatus.SUCCESS) {
                walletService.processDepositCallback(
                        payment.getTransaction().getReferenceCode(),
                        true,
                        callbackParams.get("transId")
                );
            }

            Map<String, String> response = new HashMap<>();
            response.put("status", "success");
            response.put("redirectUrl", "http://localhost:3000/wallet/deposit/result?code=" + paymentCode + "&status=success");
            return ResponseEntity.ok(response);

        } catch (Exception e) {
            log.error("Error simulating payment", e);
            Map<String, String> response = new HashMap<>();
            response.put("status", "error");
            response.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }

    @PostMapping("/momo/fail")
    @Operation(summary = "Simulate failed MoMo payment")
    public ResponseEntity<Map<String, String>> simulateFail(@RequestParam String paymentCode) {
        log.info("Simulating failed MoMo payment for: {}", paymentCode);

        try {
            Payment payment = paymentService.getPaymentByCode(paymentCode);

            // Simulate failed MoMo callback
            Map<String, String> callbackParams = new HashMap<>();
            callbackParams.put("partnerCode", "MOMOTEST");
            callbackParams.put("accessKey", "TEST");
            callbackParams.put("requestId", paymentCode);
            callbackParams.put("amount", String.valueOf(payment.getAmount().longValue()));
            callbackParams.put("orderId", paymentCode);
            callbackParams.put("orderInfo", "Deposit to Nexo wallet: " + paymentCode);
            callbackParams.put("orderType", "captureWallet");
            callbackParams.put("transId", "");
            callbackParams.put("message", "Failed");
            callbackParams.put("localMessage", "Thất bại");
            callbackParams.put("responseTime", String.valueOf(System.currentTimeMillis()));
            callbackParams.put("errorCode", "1001");
            callbackParams.put("payType", "webApp");
            callbackParams.put("extraData", "");

            // Process payment
            paymentService.processMoMoCallback(callbackParams);

            // Update wallet
            walletService.processDepositCallback(
                    payment.getTransaction().getReferenceCode(),
                    false,
                    null
            );

            Map<String, String> response = new HashMap<>();
            response.put("status", "failed");
            response.put("redirectUrl", "http://localhost:3000/wallet/deposit/result?code=" + paymentCode + "&status=failed");
            return ResponseEntity.ok(response);

        } catch (Exception e) {
            log.error("Error simulating payment failure", e);
            Map<String, String> response = new HashMap<>();
            response.put("status", "error");
            response.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }

    // ==================== Stripe Mock Payment ====================

    @GetMapping("/stripe")
    @Operation(summary = "Mock Stripe payment page")
    public String mockStripePayment(@RequestParam String paymentCode, Model model) {
        try {
            Payment payment = paymentService.getPaymentByCode(paymentCode);
            model.addAttribute("paymentCode", paymentCode);
            model.addAttribute("amount", payment.getAmount());
            model.addAttribute("orderInfo", "Deposit to Nexo wallet: " + paymentCode);
            return "mock-stripe-payment";
        } catch (Exception e) {
            log.error("Error loading mock Stripe payment page", e);
            model.addAttribute("error", "Payment not found");
            return "error";
        }
    }

    @PostMapping("/stripe/success")
    @Operation(summary = "Simulate successful Stripe payment")
    public ResponseEntity<Map<String, String>> simulateStripeSuccess(@RequestParam String paymentCode) {
        log.info("Simulating successful Stripe payment for: {}", paymentCode);

        try {
            Payment payment = paymentService.getPaymentByCode(paymentCode);

            // Simulate Stripe webhook event
            // In real scenario, Stripe sends webhook, but for mock we'll directly update payment
            payment.setStatus(PaymentStatus.SUCCESS);
            payment.setPaidAt(LocalDateTime.now());
            payment.setProviderTransactionId("mock_stripe_" + System.currentTimeMillis());
            paymentRepository.save(payment);

            // Update wallet
            walletService.processDepositCallback(
                    payment.getTransaction().getReferenceCode(),
                    true,
                    payment.getProviderTransactionId()
            );

            Map<String, String> response = new HashMap<>();
            response.put("status", "success");
            response.put("redirectUrl", "http://localhost:3000/wallet/deposit/result?code=" + paymentCode + "&status=success");
            return ResponseEntity.ok(response);

        } catch (Exception e) {
            log.error("Error simulating Stripe payment", e);
            Map<String, String> response = new HashMap<>();
            response.put("status", "error");
            response.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }

    @PostMapping("/stripe/fail")
    @Operation(summary = "Simulate failed Stripe payment")
    public ResponseEntity<Map<String, String>> simulateStripeFail(@RequestParam String paymentCode) {
        log.info("Simulating failed Stripe payment for: {}", paymentCode);

        try {
            Payment payment = paymentService.getPaymentByCode(paymentCode);

            payment.setStatus(PaymentStatus.FAILED);
            payment.setProviderMessage("Mock payment failed");
            paymentRepository.save(payment);

            // Update wallet
            walletService.processDepositCallback(
                    payment.getTransaction().getReferenceCode(),
                    false,
                    null
            );

            Map<String, String> response = new HashMap<>();
            response.put("status", "failed");
            response.put("redirectUrl", "http://localhost:3000/wallet/deposit/result?code=" + paymentCode + "&status=failed");
            return ResponseEntity.ok(response);

        } catch (Exception e) {
            log.error("Error simulating Stripe payment failure", e);
            Map<String, String> response = new HashMap<>();
            response.put("status", "error");
            response.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }
}

