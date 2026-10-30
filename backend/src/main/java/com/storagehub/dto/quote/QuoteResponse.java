package com.storagehub.dto.quote;

import com.fasterxml.jackson.annotation.JsonFormat;

import java.time.LocalDate;
import java.util.List;

/**
 * Bảng giá minh bạch tính từ PricingEngine (AD-11, schema Quote theo contracts/openapi.yaml).
 * Hỗ trợ thuê linh hoạt theo ngày (durationDays) hoặc theo tháng (durationMonths).
 */
public record QuoteResponse(
        Long unitId,
        @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd")
        LocalDate startDate,
        @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd")
        LocalDate endDate,
        Integer durationMonths,
        Integer durationDays,
        Long dailyRent,
        List<QuoteLineResponse> lines,
        Long totalRent,
        Long depositAmount,
        Long dueNow,
        String policyVersion
) {
    /**
     * Backward-compatible constructor cho các test và service hiện tại.
     */
    public QuoteResponse(
            Long unitId,
            LocalDate startDate,
            LocalDate endDate,
            Integer durationMonths,
            List<QuoteLineResponse> lines,
            Long totalRent,
            Long depositAmount,
            Long dueNow,
            String policyVersion
    ) {
        this(
                unitId,
                startDate,
                endDate,
                durationMonths,
                durationMonths != null ? durationMonths * 30 : null,
                totalRent != null && durationMonths != null && durationMonths > 0
                        ? Math.max(1L, Math.round((double) totalRent / (durationMonths * 30.0)))
                        : null,
                lines,
                totalRent,
                depositAmount,
                dueNow,
                policyVersion
        );
    }
}
