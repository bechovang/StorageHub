package com.storagehub.dto.task;

import java.time.LocalDate;

/**
 * US-15 (FR-11/14/15): card Task Board cho staff. Ritual flags là derive-on-read
 * (AD-4) — tính từ reservation/payments/contract ngay lúc GET, không lưu cột UI.
 */
public record TaskResponse(
        Long taskId,
        String type,
        String refCode,
        String unitCode,
        String customerName,
        String customerPhone,
        LocalDate workDate,
        String status,
        CheckInRitualResponse ritual
) {

    /** Chỉ có với type CHECK_IN — 4 bước ritual để FE bật/tắt nút (FR-11/15). */
    public record CheckInRitualResponse(
            boolean depositVerified,
            boolean rentCollected,
            Long rentAmountDue,
            Long depositPaid,
            boolean contractSigned,
            String contractPhotoUrl,
            boolean accessCodeHanded
    ) {
    }
}
