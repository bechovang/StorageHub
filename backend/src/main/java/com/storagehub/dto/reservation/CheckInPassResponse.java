package com.storagehub.dto.reservation;

import com.storagehub.dto.unit.UnitSummaryResponse;

import java.time.LocalDate;
import java.util.List;

public record CheckInPassResponse(
        String code,
        UnitSummaryResponse unit,
        LocalDate startDate,
        LocalDate checkInDeadline,
        List<String> instructions
) {
}
