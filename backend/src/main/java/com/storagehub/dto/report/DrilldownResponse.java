package com.storagehub.dto.report;

import java.util.List;
import java.util.Map;

/**
 * Phản hồi tra cứu chi tiết chứng từ theo KPI — US-31 (FR-31).
 */
public record DrilldownResponse(
        String key,
        String title,
        List<DrilldownColumn> columns,
        List<Map<String, Object>> rows
) {
}
