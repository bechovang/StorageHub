package com.storagehub.dto.reservation;

import com.fasterxml.jackson.annotation.JsonFormat;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;

/**
 * Request payload cho POST /api/v1/reservations (FR-5).
 * Hỗ trợ chọn thời hạn thuê theo ngày (durationDays) hoặc theo tháng (durationMonths).
 */
public record CreateReservationRequest(
        @NotNull(message = "unitId không được để trống")
        Long unitId,

        @NotNull(message = "startDate không được để trống")
        @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd")
        LocalDate startDate,

        @Min(value = 1, message = "Thời hạn thuê tối thiểu 1 tháng")
        @Max(value = 36, message = "Thời hạn thuê tối đa 36 tháng")
        Integer durationMonths,

        @Min(value = 1, message = "Thời hạn thuê tối thiểu 1 ngày")
        @Max(value = 1095, message = "Thời hạn thuê tối đa 1095 ngày")
        Integer durationDays
) {
    public CreateReservationRequest(Long unitId, LocalDate startDate, Integer durationMonths) {
        this(unitId, startDate, durationMonths, null);
    }
}
