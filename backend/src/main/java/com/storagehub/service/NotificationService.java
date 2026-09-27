package com.storagehub.service;

import com.storagehub.dto.notification.NotificationEventResponse;
import com.storagehub.entity.Payment;
import com.storagehub.entity.Reservation;

/**
 * Điểm ghi duy nhất cho NOTIFICATIONS (arch spine) — cấm module tự INSERT.
 * Sinh cùng transaction nghiệp vụ + trả event cho FE bắn toast (Conventions).
 * Deep-link theo registry trong routes.yaml (RESERVATION_CONFIRMED → /rentals/{id}).
 */
public interface NotificationService {

    /** Deposit thành công → reservation RESERVED (FR-1/FR-35). */
    NotificationEventResponse notifyReservationConfirmed(
            Reservation reservation,
            Payment payment
    );

    /** US-10 (FR-36): no-show hết hạn → reservation EXPIRED, cọc không hoàn lại. */
    NotificationEventResponse notifyReservationExpired(Reservation reservation);
}
