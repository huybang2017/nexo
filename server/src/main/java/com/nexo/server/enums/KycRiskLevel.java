package com.nexo.server.enums;

import lombok.Getter;

@Getter
public enum KycRiskLevel {
    LOW("Low Risk", "Auto Approve", 800, 1000),
    MEDIUM("Medium Risk", "Manual Review", 600, 799),
    HIGH("High Risk", "Reject", 300, 599),
    FRAUD("Fraud Detected", "Blacklist", 0, 299);

    private final String description;
    private final String recommendedAction;
    private final int minScore;
    private final int maxScore;

    KycRiskLevel(String description, String recommendedAction, int minScore, int maxScore) {
        this.description = description;
        this.recommendedAction = recommendedAction;
        this.minScore = minScore;
        this.maxScore = maxScore;
    }

    public static KycRiskLevel fromScore(int score) {
        for (KycRiskLevel level : values()) {
            if (score >= level.minScore && score <= level.maxScore) {
                return level;
            }
        }
        return FRAUD;
    }
}


