package com.storagehub.dto.extension;

import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;

/**
 * US-18 (FR-16): body của POST /reservations/{reservationId}/extensions.
 * FE chỉ gửi ngày trả mới — mọi số tiền do BE tính theo AD-11 (PricingEngine).
 */
public record ExtensionRequest(
        @NotNull(message = "newEndDate is required")
        LocalDate newEndDate
) {
}
