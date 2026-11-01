package com.storagehub.dto.report;

/**
 * Báo cáo tài chính tổng hợp và 4 chỉ số KPI cốt lõi — US-31 (FR-31).
 */
public record FinancialSummaryResponse(
        String periodLabel,
        Long grossRevenue,
        String grossRevenueGrowth,
        Long netRevenue,
        Long escrowDeposit,
        String escrowDepositNote,
        Long surchargeRevenue,
        String surchargeNote,
        Double occupancyRate,
        String occupancyBreakdown,
        String occupancyGrowth,
        Long grossRevenueDiff,
        Long previousGrossRevenue,
        Long escrowDepositDiff,
        String escrowDepositGrowth,
        Long surchargeDiff,
        String surchargeGrowth
) {
    /**
     * Constructor tương thích ngược cho các unit test hiện có.
     */
    public FinancialSummaryResponse(
            String periodLabel,
            Long grossRevenue,
            String grossRevenueGrowth,
            Long netRevenue,
            Long escrowDeposit,
            String escrowDepositNote,
            Long surchargeRevenue,
            String surchargeNote,
            Double occupancyRate,
            String occupancyBreakdown,
            String occupancyGrowth
    ) {
        this(periodLabel, grossRevenue, grossRevenueGrowth, netRevenue,
                escrowDeposit, escrowDepositNote, surchargeRevenue, surchargeNote,
                occupancyRate, occupancyBreakdown, occupancyGrowth,
                0L, 0L, 0L, "0%", 0L, "0%");
    }
}
