package com.storagehub.dto.checkout;

import com.storagehub.dto.notification.NotificationEventResponse;
import java.time.LocalDate;
import java.time.LocalDateTime;

public record CheckoutRequestResponse(
        Long requestId,
        Long reservationId,
        LocalDate requestedDate,
        String timeSlot,
        String reason,
        String status,
        LocalDateTime createdAt,
        String reservationStatus,
        Long taskId,
        NotificationEventResponse notification
) {
}
