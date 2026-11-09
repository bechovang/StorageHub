package com.storagehub.dto.checkout;

import jakarta.validation.constraints.NotBlank;

/** POST /reservations/{id}/liquidation — manager ép thanh lý. */
public record LiquidationRequest(
        @NotBlank(message = "Lý do thanh lý là bắt buộc")
        String reason,
        String reasonType
) {
}
