package com.storagehub.dto.reservation;

import com.fasterxml.jackson.annotation.JsonFormat;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;

/**
 * Request payload cho POST /api/v1/reservations (FR-5).
 */
public record CreateReservationRequest(
        @NotNull(message = "unitId không được để trống")
        Long unitId,

        @NotNull(message = "startDate không được để trống")
        @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd")
        LocalDate startDate,

        @NotNull(message = "durationMonths không được để trống")
        @Min(value = 1, message = "Thời hạn thuê tối thiểu 1 tháng")
        @Max(value = 36, message = "Thời hạn thuê tối đa 36 tháng")
        Integer durationMonths
) {
}
