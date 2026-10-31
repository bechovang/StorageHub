package com.storagehub.dto.checkout;

import com.fasterxml.jackson.annotation.JsonFormat;

import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;

/** POST /api/v1/reservations/transfer — đổi kho trọn gói cho khách. */
public record TransferRequest(
        @NotNull(message = "reservationId là bắt buộc")
        Long reservationId,
        @NotNull(message = "newUnitId là bắt buộc")
        Long newUnitId,
        @NotNull(message = "newStartDate là bắt buộc")
        @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd")
        LocalDate newStartDate,
        @NotNull(message = "newEndDate là bắt buộc")
        @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd")
        LocalDate newEndDate
) {
}
