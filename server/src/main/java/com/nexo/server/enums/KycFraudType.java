package com.nexo.server.enums;

import lombok.Getter;

@Getter
public enum KycFraudType {
    // Document Fraud
    DOCUMENT_DUPLICATE("Document already exists in system", -500, true),
    DOCUMENT_TAMPERING("Document appears to be tampered/edited", -300, true),
    DOCUMENT_EXPIRED("Document has expired", -100, false),
    DOCUMENT_LOW_QUALITY("Document image quality too low", -50, false),
    DOCUMENT_BLURRY("Document image is blurry", -30, false),
    DOCUMENT_OCR_MISMATCH("OCR data doesn't match profile", -150, true),
    
    // ID Card Specific
    ID_CARD_DUPLICATE("ID card number already registered", -500, true),
    ID_CARD_INVALID_FORMAT("ID card number format invalid", -100, false),
    ID_CARD_EXPIRED("ID card has expired", -100, false),
    
    // Face Match
    FACE_MISMATCH("Selfie doesn't match ID photo", -200, true),
    FACE_LOW_CONFIDENCE("Low confidence in face match", -50, false),
    FACE_MULTIPLE_DETECTED("Multiple faces detected in selfie", -100, true),
    
    // Profile Fraud
    PROFILE_UNDERAGE("User appears to be underage", -300, true),
    PROFILE_SUSPICIOUS_EMAIL("Email domain flagged as suspicious", -50, false),
    PROFILE_SUSPICIOUS_PHONE("Phone number flagged as suspicious", -50, false),
    PROFILE_KNOWN_FRAUD_DB("Found in known fraud database", -500, true),
    PROFILE_IP_BLACKLISTED("IP address is blacklisted", -200, true),
    PROFILE_VPN_DETECTED("VPN/Proxy detected during submission", -100, false),
    PROFILE_DEVICE_FRAUD("Device fingerprint associated with fraud", -300, true),
    
    // Behavior Fraud
    BEHAVIOR_RAPID_SUBMISSION("Unusually fast submission time", -30, false),
    BEHAVIOR_COPY_PASTE_DETECTED("Copy-paste behavior detected", -20, false),
    BEHAVIOR_MULTIPLE_ATTEMPTS("Multiple failed verification attempts", -50, false),
    
    // Cross-check Fraud
    CROSS_CHECK_BANK_MISMATCH("Bank account name doesn't match ID", -100, false),
    CROSS_CHECK_ADDRESS_MISMATCH("Address inconsistency detected", -30, false);

    private final String description;
    private final int scorePenalty;
    private final boolean isCritical;

    KycFraudType(String description, int scorePenalty, boolean isCritical) {
        this.description = description;
        this.scorePenalty = scorePenalty;
        this.isCritical = isCritical;
    }
}


