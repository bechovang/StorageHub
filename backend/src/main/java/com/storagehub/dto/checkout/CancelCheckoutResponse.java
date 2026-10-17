package com.storagehub.dto.checkout;

import com.storagehub.dto.notification.NotificationEventResponse;

public record CancelCheckoutResponse(
        Long reservationId,
        String reservationStatus,
        NotificationEventResponse notification
) {
}
