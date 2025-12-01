package com.nexo.server.enums;

import lombok.Getter;

@Getter
public enum CreditScoreEventType {
    // Positive events
    INITIAL_SCORE("Initial credit score calculated", 0),
    KYC_VERIFIED("KYC verification completed", 50),
    REPAYMENT_ON_TIME("Loan repayment made on time", 15),
    REPAYMENT_EARLY("Loan repayment made early", 25),
    LOAN_COMPLETED("Loan fully repaid", 50),
    INCOME_VERIFIED("Income verification completed", 30),
    EMPLOYMENT_VERIFIED("Employment verification completed", 20),
    BANK_ACCOUNT_LINKED("Bank account linked", 15),
    PROFILE_COMPLETED("Profile information completed", 10),
    LONG_TERM_MEMBER("Long-term platform member bonus", 20),
    
    // Negative events
    REPAYMENT_LATE_1_7_DAYS("Payment late by 1-7 days", -20),
    REPAYMENT_LATE_8_14_DAYS("Payment late by 8-14 days", -40),
    REPAYMENT_LATE_15_30_DAYS("Payment late by 15-30 days", -70),
    REPAYMENT_LATE_OVER_30_DAYS("Payment late over 30 days", -100),
    LOAN_DEFAULTED("Loan defaulted", -200),
    FRAUD_DETECTED("Fraudulent activity detected", -500),
    KYC_REJECTED("KYC verification rejected", -30),
    LOAN_REJECTED("Loan application rejected", -10),
    ACCOUNT_WARNING("Account warning issued", -25),
    
    // Neutral events
    SCORE_RECALCULATED("Periodic score recalculation", 0),
    MANUAL_ADJUSTMENT("Manual admin adjustment", 0);

    private final String description;
    private final int defaultImpact;

    CreditScoreEventType(String description, int defaultImpact) {
        this.description = description;
        this.defaultImpact = defaultImpact;
    }
}

