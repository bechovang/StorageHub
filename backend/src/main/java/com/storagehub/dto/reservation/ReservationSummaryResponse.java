package com.storagehub.dto.reservation;

import com.storagehub.entity.Reservation;

import java.time.LocalDate;

public record ReservationSummaryResponse(
        Long id,
        String code,
        Reservation.Status status,
        ReservationUnitSummaryResponse unit,
        LocalDate startDate,
        LocalDate endDate,
        Long depositAmount,
        String depositStatus
) {
}
