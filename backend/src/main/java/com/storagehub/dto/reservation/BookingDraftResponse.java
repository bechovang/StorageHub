package com.storagehub.dto.reservation;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.storagehub.dto.quote.QuoteResponse;

import java.time.Instant;
import java.time.LocalDate;

/**
 * Trả về khi tạo draft đặt chỗ. Draft KHÔNG phải đơn thuê — chỉ dùng để
 * thanh toán cọc và giữ chỗ tạm 30 phút.
 */
public record BookingDraftResponse(
        Long id,
        ReservationUnitSummaryResponse unit,
        @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd")
        LocalDate startDate,
        @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd")
        LocalDate endDate,
        Long depositAmount,
        Integer durationDays,
        QuoteResponse quote,
        Instant expiresAt
) {
}
