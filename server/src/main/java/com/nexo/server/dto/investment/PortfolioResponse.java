package com.nexo.server.dto.investment;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PortfolioResponse {

    private BigDecimal totalInvested;
    private Integer totalActiveInvestments;
    private Integer totalCompletedInvestments;
    private BigDecimal totalExpectedReturn;
    private BigDecimal totalActualReturn;
    private BigDecimal averageInterestRate;
    private String portfolioHealth;
    private Map<String, BigDecimal> riskDistribution;
    private Map<String, Integer> statusDistribution;
}

