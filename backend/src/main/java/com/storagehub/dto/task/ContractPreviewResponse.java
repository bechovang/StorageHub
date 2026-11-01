package com.storagehub.dto.task;

import java.math.BigDecimal;
import java.time.LocalDate;

/** Dữ liệu điền mẫu hợp đồng tại quầy (check-in/check-out). */
public record ContractPreviewResponse(
        String reservationCode,
        LocalDate startDate,
        LocalDate endDate,
        Integer durationDays,
        Long dailyRent,
        Long totalRent,
        Long depositPaid,
        String unitCode,
        String unitTypeName,
        BigDecimal sizeM2,
        String accessType,
        String customerName,
        String customerPhone,
        String customerEmail
) {}
