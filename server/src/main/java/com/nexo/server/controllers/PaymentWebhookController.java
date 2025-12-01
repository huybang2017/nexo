package com.nexo.server.controllers;

import com.nexo.server.entities.Payment;
import com.nexo.server.enums.PaymentStatus;
import com.nexo.server.services.PaymentService;
import com.nexo.server.services.WalletService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/payment/webhook")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Payment Webhook", description = "Payment gateway webhook endpoints")
public class PaymentWebhookController {

    private final PaymentService paymentService;
    private final WalletService walletService;

    @GetMapping("/vnpay")
    @Operation(summary = "VNPay payment callback")
    public ResponseEntity<Map<String, String>> vnPayCallback(@RequestParam Map<String, String> params) {
        log.info("VNPay callback received: {}", params);

        Map<String, String> response = new HashMap<>();

        try {
            // Verify signature
            if (!paymentService.verifyVnPayCallback(params)) {
                log.warn("VNPay callback signature verification failed");
                response.put("RspCode", "97");
                response.put("Message", "Invalid Signature");
                return ResponseEntity.ok(response);
            }

            String paymentCode = params.get("vnp_TxnRef");
            String responseCode = params.get("vnp_ResponseCode");
            String transactionNo = params.get("vnp_TransactionNo");

            // Process payment
            paymentService.processVnPayCallback(params);

            // Update wallet if successful
            Payment payment = paymentService.getPaymentByCode(paymentCode);
            if (payment.getStatus() == PaymentStatus.SUCCESS) {
                walletService.processDepositCallback(
                        payment.getTransaction().getReferenceCode(),
                        true,
                        transactionNo
                );
            } else {
                walletService.processDepositCallback(
                        payment.getTransaction().getReferenceCode(),
                        false,
                        null
                );
            }

            response.put("RspCode", "00");
            response.put("Message", "Confirm Success");

        } catch (Exception e) {
            log.error("Error processing VNPay callback", e);
            response.put("RspCode", "99");
            response.put("Message", "Unknown error");
        }

        return ResponseEntity.ok(response);
    }

    @GetMapping("/vnpay/return")
    @Operation(summary = "VNPay return URL - redirects to frontend")
    public ResponseEntity<String> vnPayReturn(@RequestParam Map<String, String> params) {
        String paymentCode = params.get("vnp_TxnRef");
        String responseCode = params.get("vnp_ResponseCode");
        
        // Build redirect URL to frontend
        String redirectUrl = "http://localhost:3000/wallet/deposit/result?code=" + paymentCode + "&status=" + responseCode;
        
        return ResponseEntity.status(302)
                .header("Location", redirectUrl)
                .body("Redirecting...");
    }

    @PostMapping("/momo")
    @Operation(summary = "MoMo payment callback")
    public ResponseEntity<Map<String, String>> momoCallback(@RequestBody Map<String, String> params) {
        log.info("MoMo callback received: {}", params);

        Map<String, String> response = new HashMap<>();

        try {
            // Verify signature
            if (!paymentService.verifyMoMoCallback(params)) {
                log.warn("MoMo callback signature verification failed");
                response.put("errorCode", "97");
                response.put("message", "Invalid Signature");
                return ResponseEntity.ok(response);
            }

            String orderId = params.get("orderId");
            String errorCode = params.get("errorCode");
            String transId = params.get("transId");

            // Process payment
            paymentService.processMoMoCallback(params);

            // Update wallet if successful
            Payment payment = paymentService.getPaymentByCode(orderId);
            if (payment.getStatus() == PaymentStatus.SUCCESS) {
                walletService.processDepositCallback(
                        payment.getTransaction().getReferenceCode(),
                        true,
                        transId
                );
            } else {
                walletService.processDepositCallback(
                        payment.getTransaction().getReferenceCode(),
                        false,
                        null
                );
            }

            response.put("errorCode", "0");
            response.put("message", "Success");

        } catch (Exception e) {
            log.error("Error processing MoMo callback", e);
            response.put("errorCode", "99");
            response.put("message", "Unknown error");
        }

        return ResponseEntity.ok(response);
    }

    @GetMapping("/momo/return")
    @Operation(summary = "MoMo return URL - redirects to frontend")
    public ResponseEntity<String> momoReturn(@RequestParam Map<String, String> params) {
        String orderId = params.get("orderId");
        String errorCode = params.get("errorCode");
        
        // Build redirect URL to frontend
        String status = "0".equals(errorCode) ? "success" : "failed";
        String redirectUrl = "http://localhost:3000/wallet/deposit/result?code=" + orderId + "&status=" + status;
        
        return ResponseEntity.status(302)
                .header("Location", redirectUrl)
                .body("Redirecting...");
    }

    @PostMapping("/stripe")
    @Operation(summary = "Stripe webhook")
    public ResponseEntity<String> stripeWebhook(
            @RequestBody String payload,
            @RequestHeader("Stripe-Signature") String signature) {
        log.info("Stripe webhook received");

        try {
            // Verify and process webhook
            if (!paymentService.verifyStripeWebhook(payload, signature)) {
                log.warn("Stripe webhook signature verification failed");
                return ResponseEntity.status(400).body("Invalid signature");
            }

            paymentService.processStripeWebhook(payload, signature);

            // Update wallet if payment successful
            // The payment status is updated in processStripeWebhook
            // We need to get the payment from the webhook event
            // For now, the webhook handler updates the payment directly

            return ResponseEntity.ok("OK");

        } catch (Exception e) {
            log.error("Error processing Stripe webhook", e);
            return ResponseEntity.status(400).body("Error processing webhook");
        }
    }

    @GetMapping("/stripe/return")
    @Operation(summary = "Stripe return URL - redirects to frontend")
    public ResponseEntity<String> stripeReturn(@RequestParam Map<String, String> params) {
        String paymentCode = params.get("paymentCode");
        String status = params.get("status");
        
        // Build redirect URL to frontend
        String redirectUrl = "http://localhost:3000/wallet/deposit/result?code=" + paymentCode + "&status=" + status;
        
        return ResponseEntity.status(302)
                .header("Location", redirectUrl)
                .body("Redirecting...");
    }

    @GetMapping("/stripe/callback")
    @Operation(summary = "Stripe Checkout callback - verifies payment and redirects to frontend")
    public ResponseEntity<String> stripeCallback(
            @RequestParam String paymentCode,
            @RequestParam(name = "session_id", required = false) String sessionId) {
        log.info("Stripe checkout callback received: paymentCode={}, sessionId={}", paymentCode, sessionId);

        String redirectUrl;
        try {
            // Process the Stripe checkout session and verify payment
            boolean success = paymentService.processStripeCheckoutCallback(paymentCode, sessionId);
            
            if (success) {
                // Update wallet
                Payment payment = paymentService.getPaymentByCode(paymentCode);
                walletService.processDepositCallback(
                        payment.getTransaction().getReferenceCode(),
                        true,
                        sessionId
                );
                redirectUrl = "http://localhost:3000/wallet/deposit/result?code=" + paymentCode + "&status=success";
            } else {
                // Update wallet as failed
                Payment payment = paymentService.getPaymentByCode(paymentCode);
                walletService.processDepositCallback(
                        payment.getTransaction().getReferenceCode(),
                        false,
                        null
                );
                redirectUrl = "http://localhost:3000/wallet/deposit/result?code=" + paymentCode + "&status=failed";
            }
        } catch (Exception e) {
            log.error("Error processing Stripe callback", e);
            redirectUrl = "http://localhost:3000/wallet/deposit/result?code=" + paymentCode + "&status=error";
        }

        return ResponseEntity.status(302)
                .header("Location", redirectUrl)
                .body("Redirecting...");
    }
}

