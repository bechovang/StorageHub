package com.storagehub.dto.unit;

import java.time.LocalDate;

public record UnitAvailabilityResponse(
        String status,
        LocalDate availableFromDate
) {
}
