package com.storagehub.dto.checkout;

import jakarta.validation.constraints.NotBlank;

import java.time.LocalDate;

/** POST /api/v1/reservations/{id}/checkout-request/forced — manager buộc trả kho sớm. */
public record ForcedCheckoutRequest(
        @NotBlank(message = "checkoutType là bắt buộc (VIOLATION hoặc TRANSFER)")
        String checkoutType,
        @NotBlank(message = "Lý do buộc trả kho là bắt buộc")
        String reason,
        LocalDate deadline
) {
    public ForcedCheckoutRequest(String checkoutType, String reason) {
        this(checkoutType, reason, null);
    }
}
