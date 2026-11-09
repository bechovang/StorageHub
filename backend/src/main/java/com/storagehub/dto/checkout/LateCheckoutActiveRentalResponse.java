package com.storagehub.dto.checkout;

import java.time.LocalDate;

/** Đơn đang thuê để manager ép checkout / thanh lý. */
public record LateCheckoutActiveRentalResponse(
        Long reservationId,
        String reservationCode,
        String customerName,
        String customerPhone,
        String unitCode,
        LocalDate endDate,
        String reservationStatus,
        int daysLate,
        long lateFee,
        String caseStatus,
        LocalDate extendedUntil,
        boolean canSettle
) {
}
