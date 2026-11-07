package com.storagehub.dto.checkout;

import jakarta.validation.constraints.NotBlank;

/** POST /checkout-cases/{id}/decision — manager quyết định. */
public record LateCheckoutDecisionRequest(
        @NotBlank(message = "decision là bắt buộc (EXTEND hoặc LIQUIDATE)")
        String decision,
        Integer extensionDays,
        @NotBlank(message = "Lý do xử lý là bắt buộc")
        String reason
) {
}
