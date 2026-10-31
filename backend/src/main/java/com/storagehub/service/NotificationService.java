package com.storagehub.service;

import com.storagehub.dto.notification.NotificationEventResponse;
import com.storagehub.dto.notification.NotificationPageResponse;
import com.storagehub.dto.notification.UnreadCountResponse;
import com.storagehub.entity.Payment;
import com.storagehub.entity.Reservation;

import java.time.LocalDate;

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

    /** US-20 (FR-17): Khách gửi yêu cầu trả kho. */
    NotificationEventResponse notifyCheckoutRequested(Reservation reservation, LocalDate requestedDate);

    /** US-20 (FR-17): Khách hủy yêu cầu trả kho. */
    NotificationEventResponse notifyCheckoutRequestCancelled(Reservation reservation);

    /** FR-34: Lấy danh sách feed thông báo của user (unread trước). */
    NotificationPageResponse listNotifications(String email, boolean unreadOnly, int page, int pageSize);

    /** FR-33: Đếm số thông báo chưa đọc cho bell badge. */
    UnreadCountResponse getUnreadCount(String email);

    /** FR-34: Đánh dấu tất cả thông báo của user là đã đọc. */
    void markAllRead(String email);

    /** FR-33: Đánh dấu MỘT thông báo đã đọc khi user bấm vào nó (owner-check). */
    void markRead(String email, Long notificationId);

    /** US-18 (FR-16): phí gia hạn đã trả → EndDate + cọc giữ dịch ngay. */
    NotificationEventResponse notifyExtensionApplied(Reservation reservation, com.storagehub.entity.Extension extension);

    /** US-18 (FR-12): addendum chờ ký tại quầy — bell cho staff. */
    void notifyAddendumAwaitingSignature(Reservation reservation, com.storagehub.entity.ContractAddendum addendum);

    /** US-15: tiền thuê RENT đã trả đủ → bell staff chuẩn bị ritual check-in + hướng dẫn khách. */
    void notifyRentPaidReadyForCheckIn(Reservation reservation, com.storagehub.entity.Payment payment);

    /** Ticket API: khách tạo yêu cầu hỗ trợ → bell staff tiếp nhận. */
    void notifyTicketCreated(com.storagehub.entity.SupportTicket ticket);

    /** Ticket API: trạng thái xử lý đổi → báo khách. */
    void notifyTicketStatusChanged(com.storagehub.entity.SupportTicket ticket, String oldStatus);

    /** Early checkout: manager buộc trả kho sớm (VIOLATION/TRANSFER) → báo khách. */
    void notifyForcedCheckout(com.storagehub.entity.Reservation reservation, String type, String note);
}
