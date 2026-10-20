package com.storagehub.dto.report;

/**
 * Cấu hình cột hiển thị trong drawer/bảng drill-down — US-31 (FR-31).
 */
public record DrilldownColumn(
        String key,
        String label,
        Boolean isMoney
) {
    public DrilldownColumn(String key, String label) {
        this(key, label, false);
    }
}
