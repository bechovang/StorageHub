package com.storagehub.dto.report;

/**
 * Mục dữ liệu doanh thu hàng tháng cho biểu đồ — US-31 (FR-31).
 */
public record MonthlyRevenueItemResponse(
        String month,
        Long rentRevenue,
        Long surcharge,
        Long escrowHold,
        Long totalRevenue
) {
}
