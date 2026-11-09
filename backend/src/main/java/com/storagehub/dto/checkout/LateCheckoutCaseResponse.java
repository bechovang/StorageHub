package com.storagehub.dto.checkout;

import java.time.LocalDate;
import java.time.LocalDateTime;

/** Dòng trong tab quản lý trả kho & thanh lý. */
public record LateCheckoutCaseResponse(
        Long caseId,
        Long reservationId,
        String reservationCode,
        String customerName,
        String customerPhone,
        String unitCode,
        LocalDate endDate,
        int daysLate,
        long lateFee,
        String status,
        String decision,
        Integer extensionDays,
        LocalDate extendedUntil,
        String reason,
        String managerName,
        LocalDateTime decidedAt,
        Long settlementId
) {
}
