package com.storagehub.dto.payment;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/** POST /payments/{id}/confirm — chỉ MoMo (openapi.yaml). */
public record ConfirmPaymentRequest(
        @NotBlank
        @Size(min = 6, max = 6)
        String otp
) {
}
