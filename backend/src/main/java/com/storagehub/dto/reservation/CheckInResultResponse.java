package com.storagehub.dto.reservation;

/**
 * US-15 (FR-15): kết quả bàn giao — staff đọc accessCode từ đây để trao khách
 * (AD-5: ngoài response này, accessCode chỉ xuất hiện trong Rental Detail của chủ).
 */
public record CheckInResultResponse(
        Long reservationId,
        String code,
        String status,
        String accessCode,
        String unitCode,
        String unitStatus,
        String contractCode,
        String contractStatus,
        String signedPhotoUrl,
        String taskStatus
) {
}
