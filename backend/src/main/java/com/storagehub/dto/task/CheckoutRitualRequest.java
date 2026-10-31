package com.storagehub.dto.task;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

import java.util.List;

/** POST /api/v1/tasks/{taskId}/rituals/checkout — tất toán trả kho tại quầy (US-21). */
public record CheckoutRitualRequest(
        @NotEmpty(message = "Bảng nghiệm thu là bắt buộc")
        List<CheckItem> checklist,

        List<DamageCharge> damageCharges,

        @NotNull(message = "Số tiền hoàn lại cọc là bắt buộc (0 nếu không hoàn)")
        Long refundAmount,

        Long extraCharged,

        @NotBlank(message = "Phương thức tất toán là bắt buộc (CASH | QR | POS)")
        String settlementMethod,

        @NotBlank(message = "Bắt buộc đính kèm ảnh biên bản thanh lý")
        String settlementPhotoUrl
) {

    public record CheckItem(String item, String result) {
    }

    public record DamageCharge(String item, Long amount, String reason) {
    }
}
