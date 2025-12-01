package com.nexo.server.services;

import com.nexo.server.dto.wallet.DepositRequest;
import com.nexo.server.dto.wallet.PaymentUrlResponse;
import com.nexo.server.entities.Payment;
import com.nexo.server.entities.Transaction;
import com.nexo.server.entities.User;
import com.nexo.server.enums.PaymentProvider;
import com.nexo.server.enums.PaymentStatus;
import com.nexo.server.exceptions.BadRequestException;
import com.nexo.server.exceptions.ResourceNotFoundException;
import com.nexo.server.repositories.PaymentRepository;
import com.nexo.server.repositories.UserRepository;
import com.nexo.server.utils.CodeGenerator;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.codec.digest.HmacUtils;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import java.math.BigDecimal;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.text.SimpleDateFormat;
import java.time.LocalDateTime;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class PaymentService {

    private final PaymentRepository paymentRepository;
    private final UserRepository userRepository;
    private final RestTemplate restTemplate = new RestTemplate();

    @Value("${vnpay.tmn-code}")
    private String vnpTmnCode;

    @Value("${vnpay.hash-secret}")
    private String vnpHashSecret;

    @Value("${vnpay.url}")
    private String vnpUrl;

    @Value("${vnpay.return-url}")
    private String vnpReturnUrl;

    // MoMo Configuration
    @Value("${momo.partner-code}")
    private String momoPartnerCode;

    @Value("${momo.access-key}")
    private String momoAccessKey;

    @Value("${momo.secret-key}")
    private String momoSecretKey;

    @Value("${momo.api-url}")
    private String momoApiUrl;

    @Value("${momo.return-url}")
    private String momoReturnUrl;

    @Value("${momo.notify-url}")
    private String momoNotifyUrl;

    @Value("${momo.mock-mode:true}")
    private boolean momoMockMode;

    // Stripe Configuration
    @Value("${stripe.mock-mode:true}")
    private boolean stripeMockMode;

    @Value("${stripe.secret-key:}")
    private String stripeSecretKey;

    @Value("${stripe.publishable-key:}")
    private String stripePublishableKey;

    @Value("${stripe.webhook-secret:}")
    private String stripeWebhookSecret;

    @Value("${stripe.return-url:http://localhost:3000/wallet/deposit/callback}")
    private String stripeReturnUrl;

    @Transactional
    public PaymentUrlResponse createPayment(Long userId, DepositRequest request, Transaction transaction) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", userId));

        String paymentCode = CodeGenerator.generatePaymentCode();
        
        Payment payment = Payment.builder()
                .paymentCode(paymentCode)
                .user(user)
                .transaction(transaction)
                .provider(request.getProvider())
                .status(PaymentStatus.PENDING)
                .amount(request.getAmount())
                .returnUrl(request.getReturnUrl() != null ? request.getReturnUrl() : vnpReturnUrl)
                .expiredAt(LocalDateTime.now().plusMinutes(15))
                .build();

        payment = paymentRepository.save(payment);

        String paymentUrl;
        if (request.getProvider() == PaymentProvider.VNPAY) {
            paymentUrl = createVnPayUrl(payment, request.getBankCode());
        } else if (request.getProvider() == PaymentProvider.MOMO) {
            paymentUrl = createMoMoUrl(payment);
        } else if (request.getProvider() == PaymentProvider.STRIPE) {
            paymentUrl = createStripeCheckoutUrl(payment);
        } else {
            throw new BadRequestException("Payment provider not supported yet: " + request.getProvider());
        }

        return PaymentUrlResponse.builder()
                .paymentCode(paymentCode)
                .paymentUrl(paymentUrl)
                .amount(request.getAmount())
                .expiresAt(payment.getExpiredAt())
                .build();
    }

    private String createVnPayUrl(Payment payment, String bankCode) {
        Map<String, String> params = new TreeMap<>();
        
        params.put("vnp_Version", "2.1.0");
        params.put("vnp_Command", "pay");
        params.put("vnp_TmnCode", vnpTmnCode);
        params.put("vnp_Amount", String.valueOf(payment.getAmount().multiply(new BigDecimal("100")).longValue()));
        params.put("vnp_CurrCode", "VND");
        
        if (bankCode != null && !bankCode.isEmpty()) {
            params.put("vnp_BankCode", bankCode);
        }
        
        params.put("vnp_TxnRef", payment.getPaymentCode());
        params.put("vnp_OrderInfo", "Deposit to Nexo wallet: " + payment.getPaymentCode());
        params.put("vnp_OrderType", "other");
        params.put("vnp_Locale", "vn");
        params.put("vnp_ReturnUrl", payment.getReturnUrl());
        params.put("vnp_IpAddr", "127.0.0.1");
        
        SimpleDateFormat sdf = new SimpleDateFormat("yyyyMMddHHmmss");
        sdf.setTimeZone(TimeZone.getTimeZone("Asia/Ho_Chi_Minh"));
        String createDate = sdf.format(new Date());
        params.put("vnp_CreateDate", createDate);
        
        Calendar calendar = Calendar.getInstance(TimeZone.getTimeZone("Asia/Ho_Chi_Minh"));
        calendar.add(Calendar.MINUTE, 15);
        String expireDate = sdf.format(calendar.getTime());
        params.put("vnp_ExpireDate", expireDate);

        StringBuilder hashData = new StringBuilder();
        StringBuilder query = new StringBuilder();

        for (Map.Entry<String, String> entry : params.entrySet()) {
            if (hashData.length() > 0) {
                hashData.append("&");
                query.append("&");
            }
            hashData.append(entry.getKey()).append("=").append(URLEncoder.encode(entry.getValue(), StandardCharsets.US_ASCII));
            query.append(entry.getKey()).append("=").append(URLEncoder.encode(entry.getValue(), StandardCharsets.US_ASCII));
        }

        String secureHash = HmacUtils.hmacSha512Hex(vnpHashSecret, hashData.toString());
        query.append("&vnp_SecureHash=").append(secureHash);

        return vnpUrl + "?" + query;
    }

    public boolean verifyVnPayCallback(Map<String, String> params) {
        String vnpSecureHash = params.get("vnp_SecureHash");
        
        if (vnpSecureHash == null) {
            return false;
        }

        Map<String, String> sortedParams = new TreeMap<>(params);
        sortedParams.remove("vnp_SecureHash");
        sortedParams.remove("vnp_SecureHashType");

        StringBuilder hashData = new StringBuilder();
        for (Map.Entry<String, String> entry : sortedParams.entrySet()) {
            if (entry.getValue() != null && !entry.getValue().isEmpty()) {
                if (hashData.length() > 0) {
                    hashData.append("&");
                }
                hashData.append(entry.getKey()).append("=").append(URLEncoder.encode(entry.getValue(), StandardCharsets.US_ASCII));
            }
        }

        String generatedHash = HmacUtils.hmacSha512Hex(vnpHashSecret, hashData.toString());
        return vnpSecureHash.equalsIgnoreCase(generatedHash);
    }

    @Transactional
    public void processVnPayCallback(Map<String, String> params) {
        String paymentCode = params.get("vnp_TxnRef");
        String responseCode = params.get("vnp_ResponseCode");
        String transactionNo = params.get("vnp_TransactionNo");

        Payment payment = paymentRepository.findByPaymentCode(paymentCode)
                .orElseThrow(() -> new ResourceNotFoundException("Payment not found: " + paymentCode));

        if (payment.getStatus() != PaymentStatus.PENDING) {
            log.warn("Payment {} already processed", paymentCode);
            return;
        }

        payment.setProviderTransactionId(transactionNo);
        payment.setProviderResponseCode(responseCode);

        if ("00".equals(responseCode)) {
            payment.setStatus(PaymentStatus.SUCCESS);
            payment.setPaidAt(LocalDateTime.now());
            log.info("VNPay payment successful: {}", paymentCode);
        } else {
            payment.setStatus(PaymentStatus.FAILED);
            payment.setProviderMessage("VNPay response code: " + responseCode);
            log.info("VNPay payment failed: {} - Code: {}", paymentCode, responseCode);
        }

        paymentRepository.save(payment);
    }

    public Payment getPaymentByCode(String paymentCode) {
        return paymentRepository.findByPaymentCode(paymentCode)
                .orElseThrow(() -> new ResourceNotFoundException("Payment not found: " + paymentCode));
    }

    // ==================== MoMo Payment ====================

    private String createMoMoUrl(Payment payment) {
        // Development Mode: Mock MoMo payment for testing without real credentials
        if (momoMockMode) {
            log.warn("⚠️ MoMo MOCK MODE enabled - Using mock payment URL for development");
            // Return a mock payment page URL that will simulate MoMo payment
            String mockPaymentUrl = "http://localhost:8080/api/payment/mock/momo?paymentCode=" + payment.getPaymentCode();
            log.info("MoMo mock payment URL created: {}", mockPaymentUrl);
            return mockPaymentUrl;
        }

        try {
            // Real MoMo Payment Request - Build request body
            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("partnerCode", momoPartnerCode);
            requestBody.put("accessKey", momoAccessKey);
            requestBody.put("requestId", payment.getPaymentCode());
            requestBody.put("amount", String.valueOf(payment.getAmount().longValue()));
            requestBody.put("orderId", payment.getPaymentCode());
            requestBody.put("orderInfo", "Deposit to Nexo wallet: " + payment.getPaymentCode());
            requestBody.put("returnUrl", momoReturnUrl);
            requestBody.put("notifyUrl", momoNotifyUrl);
            requestBody.put("requestType", "captureWallet");
            requestBody.put("extraData", "");

            // Create signature for MoMo API
            // Signature format: partnerCode=xxx&accessKey=xxx&requestId=xxx&amount=xxx&orderId=xxx&orderInfo=xxx&returnUrl=xxx&notifyUrl=xxx&extraData=
            String rawHash = "partnerCode=" + momoPartnerCode +
                    "&accessKey=" + momoAccessKey +
                    "&requestId=" + payment.getPaymentCode() +
                    "&amount=" + payment.getAmount().longValue() +
                    "&orderId=" + payment.getPaymentCode() +
                    "&orderInfo=" + requestBody.get("orderInfo") +
                    "&returnUrl=" + momoReturnUrl +
                    "&notifyUrl=" + momoNotifyUrl +
                    "&extraData=";
            String signature = HmacUtils.hmacSha256Hex(momoSecretKey, rawHash);
            requestBody.put("signature", signature);

            // Make HTTP POST request to MoMo API
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<Map<String, Object>> request = new HttpEntity<>(requestBody, headers);

            log.info("Calling MoMo API: {} with payment code: {}", momoApiUrl, payment.getPaymentCode());
            ResponseEntity<Map> response = restTemplate.postForEntity(momoApiUrl, request, Map.class);

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                Map<String, Object> responseBody = response.getBody();
                String payUrl = (String) responseBody.get("payUrl");
                String errorCode = (String) responseBody.get("errorCode");

                if ("0".equals(errorCode) && payUrl != null) {
                    log.info("MoMo payment URL created successfully: {}", payment.getPaymentCode());
                    return payUrl;
                } else {
                    String message = (String) responseBody.get("message");
                    log.error("MoMo API error: {} - {}", errorCode, message);
                    throw new BadRequestException("MoMo payment failed: " + message);
                }
            } else {
                log.error("MoMo API call failed with status: {}", response.getStatusCode());
                throw new BadRequestException("Failed to create MoMo payment: Invalid response");
            }
        } catch (Exception e) {
            log.error("Error creating MoMo payment URL", e);
            if (e instanceof BadRequestException) {
                throw e;
            }
            throw new BadRequestException("Failed to create MoMo payment: " + e.getMessage());
        }
    }

    public boolean verifyMoMoCallback(Map<String, String> params) {
        String signature = params.get("signature");
        if (signature == null) {
            return false;
        }

        String rawHash = "partnerCode=" + params.get("partnerCode") +
                "&accessKey=" + params.get("accessKey") +
                "&requestId=" + params.get("requestId") +
                "&amount=" + params.get("amount") +
                "&orderId=" + params.get("orderId") +
                "&orderInfo=" + params.get("orderInfo") +
                "&orderType=" + params.get("orderType") +
                "&transId=" + params.get("transId") +
                "&message=" + params.get("message") +
                "&localMessage=" + params.get("localMessage") +
                "&responseTime=" + params.get("responseTime") +
                "&errorCode=" + params.get("errorCode") +
                "&payType=" + params.get("payType") +
                "&extraData=" + (params.get("extraData") != null ? params.get("extraData") : "");

        String generatedHash = HmacUtils.hmacSha256Hex(momoSecretKey, rawHash);
        return signature.equalsIgnoreCase(generatedHash);
    }

    @Transactional
    public void processMoMoCallback(Map<String, String> params) {
        String orderId = params.get("orderId");
        String errorCode = params.get("errorCode");
        String transId = params.get("transId");

        Payment payment = paymentRepository.findByPaymentCode(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Payment not found: " + orderId));

        if (payment.getStatus() != PaymentStatus.PENDING) {
            log.warn("Payment {} already processed", orderId);
            return;
        }

        payment.setProviderTransactionId(transId);
        payment.setProviderResponseCode(errorCode);

        if ("0".equals(errorCode)) {
            payment.setStatus(PaymentStatus.SUCCESS);
            payment.setPaidAt(LocalDateTime.now());
            log.info("MoMo payment successful: {}", orderId);
        } else {
            payment.setStatus(PaymentStatus.FAILED);
            payment.setProviderMessage("MoMo error code: " + errorCode);
            log.info("MoMo payment failed: {} - Code: {}", orderId, errorCode);
        }

        paymentRepository.save(payment);
    }

    // ==================== Stripe Payment ====================

    private String createStripeCheckoutUrl(Payment payment) {
        // Development Mode: Mock Stripe payment for testing without real credentials
        if (stripeMockMode) {
            log.warn("⚠️ Stripe MOCK MODE enabled - Using mock payment URL for development");
            String mockPaymentUrl = "http://localhost:8080/api/payment/mock/stripe?paymentCode=" + payment.getPaymentCode();
            log.info("Stripe mock payment URL created: {}", mockPaymentUrl);
            return mockPaymentUrl;
        }

        try {
            // Initialize Stripe
            com.stripe.Stripe.apiKey = stripeSecretKey;

            // Stripe Checkout callback goes to backend first for processing, then redirects to frontend
            String backendCallbackUrl = "http://localhost:8080/api/payment/webhook/stripe/callback";

            // Create Stripe Checkout Session
            com.stripe.param.checkout.SessionCreateParams params =
                    com.stripe.param.checkout.SessionCreateParams.builder()
                            .setMode(com.stripe.param.checkout.SessionCreateParams.Mode.PAYMENT)
                            .setSuccessUrl(backendCallbackUrl + "?paymentCode=" + payment.getPaymentCode() + "&session_id={CHECKOUT_SESSION_ID}")
                            .setCancelUrl(stripeReturnUrl + "?code=" + payment.getPaymentCode() + "&status=cancelled")
                            .addLineItem(
                                    com.stripe.param.checkout.SessionCreateParams.LineItem.builder()
                                            .setQuantity(1L)
                                            .setPriceData(
                                                    com.stripe.param.checkout.SessionCreateParams.LineItem.PriceData.builder()
                                                            .setCurrency("vnd")
                                                            .setUnitAmount(payment.getAmount().longValue())
                                                            .setProductData(
                                                                    com.stripe.param.checkout.SessionCreateParams.LineItem.PriceData.ProductData.builder()
                                                                            .setName("Deposit to Nexo Wallet")
                                                                            .setDescription("Payment Code: " + payment.getPaymentCode())
                                                                            .build()
                                                            )
                                                            .build()
                                            )
                                            .build()
                            )
                            .putMetadata("paymentCode", payment.getPaymentCode())
                            .putMetadata("userId", payment.getUser().getId().toString())
                            .build();

            com.stripe.model.checkout.Session session = com.stripe.model.checkout.Session.create(params);
            payment.setProviderTransactionId(session.getId());
            paymentRepository.save(payment);

            log.info("Stripe checkout session created: {} - URL: {}", payment.getPaymentCode(), session.getUrl());
            return session.getUrl();
        } catch (Exception e) {
            log.error("Error creating Stripe checkout session", e);
            throw new BadRequestException("Failed to create Stripe payment: " + e.getMessage());
        }
    }

    /**
     * Verify Stripe Checkout Session status and process payment
     */
    @Transactional
    public boolean processStripeCheckoutCallback(String paymentCode, String sessionId) {
        try {
            com.stripe.Stripe.apiKey = stripeSecretKey;
            
            // Retrieve the Checkout Session from Stripe
            com.stripe.model.checkout.Session session = 
                com.stripe.model.checkout.Session.retrieve(sessionId);
            
            Payment payment = paymentRepository.findByPaymentCode(paymentCode)
                    .orElseThrow(() -> new ResourceNotFoundException("Payment not found: " + paymentCode));

            if (payment.getStatus() != PaymentStatus.PENDING) {
                log.warn("Payment {} already processed", paymentCode);
                return payment.getStatus() == PaymentStatus.SUCCESS;
            }

            // Check session payment status
            String paymentStatus = session.getPaymentStatus();
            log.info("Stripe session {} payment status: {}", sessionId, paymentStatus);

            if ("paid".equals(paymentStatus)) {
                payment.setStatus(PaymentStatus.SUCCESS);
                payment.setPaidAt(LocalDateTime.now());
                payment.setProviderResponseCode("paid");
                paymentRepository.save(payment);
                log.info("Stripe payment successful: {}", paymentCode);
                return true;
            } else {
                payment.setStatus(PaymentStatus.FAILED);
                payment.setProviderMessage("Payment status: " + paymentStatus);
                paymentRepository.save(payment);
                log.info("Stripe payment failed: {} - Status: {}", paymentCode, paymentStatus);
                return false;
            }
        } catch (Exception e) {
            log.error("Error processing Stripe checkout callback", e);
            return false;
        }
    }

    public boolean verifyStripeWebhook(String payload, String signature) {
        try {
            com.stripe.Stripe.apiKey = stripeSecretKey;
            com.stripe.model.Event event = com.stripe.net.Webhook.constructEvent(
                    payload, signature, stripeWebhookSecret);
            return event != null;
        } catch (Exception e) {
            log.error("Stripe webhook verification failed", e);
            return false;
        }
    }

    @Transactional
    public void processStripeWebhook(String payload, String signature) {
        try {
            com.stripe.Stripe.apiKey = stripeSecretKey;
            com.stripe.model.Event event = com.stripe.net.Webhook.constructEvent(
                    payload, signature, stripeWebhookSecret);

            if ("checkout.session.completed".equals(event.getType())) {
                com.stripe.model.checkout.Session session = (com.stripe.model.checkout.Session) event.getDataObjectDeserializer()
                        .getObject().orElse(null);

                if (session != null && session.getMetadata() != null) {
                    String paymentCode = session.getMetadata().get("paymentCode");
                    if (paymentCode != null) {
                        Payment payment = paymentRepository.findByPaymentCode(paymentCode)
                                .orElseThrow(() -> new ResourceNotFoundException("Payment not found: " + paymentCode));

                        if (payment.getStatus() == PaymentStatus.PENDING) {
                            payment.setStatus(PaymentStatus.SUCCESS);
                            payment.setPaidAt(LocalDateTime.now());
                            payment.setProviderTransactionId(session.getPaymentIntent());
                            paymentRepository.save(payment);
                            log.info("Stripe payment successful: {}", paymentCode);
                        }
                    }
                }
            }
        } catch (Exception e) {
            log.error("Error processing Stripe webhook", e);
            throw new BadRequestException("Failed to process Stripe webhook: " + e.getMessage());
        }
    }
}

