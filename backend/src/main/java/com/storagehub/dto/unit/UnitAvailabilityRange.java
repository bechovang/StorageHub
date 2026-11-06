package com.storagehub.dto.unit;

import com.fasterxml.jackson.annotation.JsonFormat;

import java.time.LocalDate;

/** Khoảng ngày kho bị giữ chỗ / đang thuê (public availability projection). */
public record UnitAvailabilityRange(
        @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd")
        LocalDate startDate,
        @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd")
        LocalDate endDate
) {
}
