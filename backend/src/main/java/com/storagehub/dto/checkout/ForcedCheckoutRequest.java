package com.storagehub.dto.checkout;

import jakarta.validation.constraints.NotBlank;

/** POST /api/v1/reservations/{id}/checkout-request/forced — manager buộc trả kho sớm. */
public record ForcedCheckoutRequest(
        @NotBlank(message = "checkoutType là bắt buộc (VIOLATION hoặc TRANSFER)")
        String checkoutType,
        String reason
) {
}
