package com.storagehub.service;

import com.storagehub.dto.notification.NotificationEventResponse;
import com.storagehub.dto.notification.NotificationPageResponse;
import com.storagehub.dto.notification.UnreadCountResponse;
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

    /** US-15 (FR-15): check-in hoàn tất → rental ACTIVE, access code sẵn sàng. */
    NotificationEventResponse notifyCheckInCompleted(Reservation reservation);

    /** FR-34: Lấy danh sách feed thông báo của user (unread trước). */
    NotificationPageResponse listNotifications(String email, boolean unreadOnly, int page, int pageSize);

    /** FR-33: Đếm số thông báo chưa đọc cho bell badge. */
    UnreadCountResponse getUnreadCount(String email);

    /** FR-34: Đánh dấu tất cả thông báo của user là đã đọc. */
    void markAllRead(String email);
}
