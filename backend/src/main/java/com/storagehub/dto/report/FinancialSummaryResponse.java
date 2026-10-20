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
        String occupancyGrowth
) {
}
