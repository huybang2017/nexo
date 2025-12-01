package com.nexo.server.utils;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.concurrent.atomic.AtomicInteger;

public class CodeGenerator {

    private static final SecureRandom RANDOM = new SecureRandom();
    private static final AtomicInteger COUNTER = new AtomicInteger(0);
    private static final DateTimeFormatter DATE_FORMAT = DateTimeFormatter.ofPattern("yyyyMMdd");

    public static String generateLoanCode() {
        return "LOAN" + generateCode();
    }

    public static String generateInvestmentCode() {
        return "INV" + generateCode();
    }

    public static String generateTransactionCode() {
        return "TXN" + generateCode();
    }

    public static String generatePaymentCode() {
        return "PAY" + generateCode();
    }

    public static String generateRepaymentCode() {
        return "REP" + generateCode();
    }

    public static String generateTicketCode() {
        return "TKT" + generateCode();
    }

    private static String generateCode() {
        String date = LocalDateTime.now().format(DATE_FORMAT);
        int counter = COUNTER.incrementAndGet() % 10000;
        int random = RANDOM.nextInt(1000);
        return date + String.format("%04d%03d", counter, random);
    }

    public static String generateRandomString(int length) {
        String chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
        StringBuilder sb = new StringBuilder(length);
        for (int i = 0; i < length; i++) {
            sb.append(chars.charAt(RANDOM.nextInt(chars.length())));
        }
        return sb.toString();
    }

    public static String generateVerificationCode() {
        return String.format("%06d", RANDOM.nextInt(1000000));
    }
}

