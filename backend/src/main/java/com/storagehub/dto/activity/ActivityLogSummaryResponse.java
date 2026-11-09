package com.storagehub.dto.activity;

/**
 * Số liệu tổng hợp cho màn hình nhật ký hoạt động — tính trên TOÀN BỘ log
 * trong phạm vi cơ sở của người xem, không phụ thuộc bộ lọc/trang hiện tại.
 */
public record ActivityLogSummaryResponse(
        long totalEntries,
        long statusChanges,
        long securityEvents
) {
}
