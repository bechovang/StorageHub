package com.storagehub.dto.checkout;

import com.fasterxml.jackson.annotation.JsonFormat;

import java.time.LocalDate;

/** Kết quả đổi kho trọn gói: đơn cũ đóng + đơn mới RESERVED mang cọc cũ. */
public record TransferResponse(
        Long oldReservationId,
        String oldReservationCode,
        String oldUnitCode,
        Long newReservationId,
        String newReservationCode,
        String newUnitCode,
        @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd")
        LocalDate newStartDate,
        @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd")
        LocalDate newEndDate,
        Long carriedDeposit,
        Long carriedRent
) {
}
