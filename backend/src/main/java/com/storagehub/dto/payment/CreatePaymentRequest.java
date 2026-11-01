package com.storagehub.dto.payment;

import com.storagehub.entity.Payment;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;

/**
 * POST /payments — amount/status/userId do server quyết (AD-9), không có trong request.
 * card bắt buộc khi method=CARD, momoPhone khi method=MOMO — service check (openapi.yaml).
 */
public record CreatePaymentRequest(
        @NotNull Payment.Purpose purpose,
        Long reservationId,
        Long unitId,
        LocalDate startDate,
        LocalDate endDate,
        @NotNull Payment.Method method,
        @Valid CardDetails card,
        String momoPhone
) {

    /** Không persist số thẻ/CVC — mock gateway chỉ dùng để quyết outcome. */
    public record CardDetails(
            @NotNull String number,
            @NotNull String expiry,
            @NotNull String cvc
    ) {
    }
}
