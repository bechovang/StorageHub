package com.storagehub.dto.reservation;

import com.fasterxml.jackson.annotation.JsonFormat;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;

/**
 * Request payload cho POST /api/v1/reservations (FR-5).
 * Mô hình thuê theo ngày: endDate là ngày trả kho (inclusive), tối thiểu 1 ngày.
 */
public record CreateReservationRequest(
        @NotNull(message = "unitId không được để trống")
        Long unitId,

        @NotNull(message = "startDate không được để trống")
        @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd")
        LocalDate startDate,

        @NotNull(message = "endDate không được để trống")
        @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd")
        LocalDate endDate
) {
}
