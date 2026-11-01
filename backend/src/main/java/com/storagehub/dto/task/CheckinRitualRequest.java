package com.storagehub.dto.task;

import jakarta.validation.constraints.NotBlank;

/** POST /api/v1/tasks/{taskId}/rituals/check-in — nhân viên hoàn tất nhận kho tại quầy. */
public record CheckinRitualRequest(
        @NotBlank(message = "Phương thức thu tiền là bắt buộc (CASH | QR | POS)")
        String paymentMethod,
        @NotBlank(message = "Bắt buộc đính kèm ảnh chứng từ thu tiền")
        String paymentProofPhoto,
        @NotBlank(message = "Bắt buộc đính kèm ảnh hợp đồng đã ký")
        String contractPhotoUrl,
        String accessPin
) {
}
