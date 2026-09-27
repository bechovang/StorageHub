package com.storagehub.dto.unit;

import com.fasterxml.jackson.annotation.JsonFormat;

import java.time.LocalDate;

public record UnitAvailabilityResponse(
        String status,
        @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd")
        LocalDate availableFromDate
) {
}
