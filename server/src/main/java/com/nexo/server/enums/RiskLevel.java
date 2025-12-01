package com.nexo.server.enums;

import lombok.Getter;

@Getter
public enum RiskLevel {
    LOW("Low Risk", "A", 800, 1000),
    MEDIUM("Medium Risk", "B", 600, 799),
    HIGH("High Risk", "C", 400, 599),
    VERY_HIGH("Very High Risk", "D", 200, 399),
    CRITICAL("Critical Risk", "E", 0, 199);

    private final String description;
    private final String grade;
    private final int minScore;
    private final int maxScore;

    RiskLevel(String description, String grade, int minScore, int maxScore) {
        this.description = description;
        this.grade = grade;
        this.minScore = minScore;
        this.maxScore = maxScore;
    }

    public static RiskLevel fromScore(int score) {
        for (RiskLevel level : values()) {
            if (score >= level.minScore && score <= level.maxScore) {
                return level;
            }
        }
        return CRITICAL;
    }

    public static String gradeFromScore(int score) {
        return fromScore(score).getGrade();
    }
}

