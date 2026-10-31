package com.storagehub.dto.quote;

import com.fasterxml.jackson.annotation.JsonFormat;

import java.time.LocalDate;
import java.util.List;

/**
 * Bảng giá minh bạch tính từ PricingEngine (AD-11, schema Quote theo contracts/openapi.yaml).
 * Mô hình thuê theo ngày: durationDays = số ngày thuê (end inclusive).
 */
public record QuoteResponse(
        Long unitId,
        @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd")
        LocalDate startDate,
        @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd")
        LocalDate endDate,
        Integer durationDays,
        List<QuoteLineResponse> lines,
        Long totalRent,
        Long depositAmount,
        Long dueNow,
        String policyVersion
) {
}
