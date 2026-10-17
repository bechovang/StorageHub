package com.storagehub.dto.checkout;

import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;

public record CreateCheckoutRequest(
        @NotNull(message = "Ngày dự kiến trả kho không được để trống")
        LocalDate requestedDate,
        String timeSlot,
        String reason
) {
}
