package com.storagehub.service.impl;

import com.storagehub.dto.notification.NotificationEventResponse;
import com.storagehub.entity.Notification;
import com.storagehub.entity.Payment;
import com.storagehub.entity.Reservation;
import com.storagehub.repository.NotificationRepository;
import com.storagehub.service.NotificationService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.text.DecimalFormat;
import java.text.DecimalFormatSymbols;
import java.time.LocalDate;
import java.util.Locale;

/** TỐI THIỂU cho US-8 — US-17 (Toast/Bell/Feed) mở rộng list + unread. */
@Service
public class NotificationServiceImpl implements NotificationService {

    private static final String TYPE_RESERVATION_CONFIRMED = "RESERVATION_CONFIRMED";
    private static final String TYPE_RESERVATION_EXPIRED = "RESERVATION_EXPIRED";
    private static final String TYPE_CHECK_IN_COMPLETED = "CHECK_IN_COMPLETED";
    private static final String TYPE_CHECKOUT_REQUESTED = "CHECKOUT_REQUESTED";
    private static final String TYPE_CHECKOUT_REQUEST_CANCELLED = "CHECKOUT_REQUEST_CANCELLED";

    private final NotificationRepository notificationRepository;

    public NotificationServiceImpl(NotificationRepository notificationRepository) {
        this.notificationRepository = notificationRepository;
    }

    @Override
    public NotificationEventResponse notifyReservationConfirmed(
            Reservation reservation,
            Payment payment
    ) {
        // Entity không có cột body (chỉ title) — body chỉ nằm trong event cho FE toast.
        String title = "Booking confirmed — "
                + reservation.getUnit().getCode() + " reserved";
        String body = "Deposit " + vnd(payment.getAmount())
                + " đã nhận. Check-in pass sẵn sàng khi đến hạn.";
        String deepLink = "/rentals/" + reservation.getReservationId();

        Notification row = new Notification();
        row.setUser(reservation.getCustomer());
        row.setType(TYPE_RESERVATION_CONFIRMED);
        row.setTitle(title);
        row.setDeepLink(deepLink);
        row.setIsRead(false);
        notificationRepository.save(row);

        return new NotificationEventResponse(
                TYPE_RESERVATION_CONFIRMED,
                title,
                body,
                deepLink
        );
    }

    @Override
    public NotificationEventResponse notifyReservationExpired(Reservation reservation) {
        // NFR-7 microcopy 3 phần: chuyện gì xảy ra + hệ quả tiền + bước kế tiếp.
        String title = "Booking expired — "
                + reservation.getUnit().getCode() + " no-show";
        String body = "Quá hạn nhận kho nên đặt chỗ " + reservation.getCode()
                + " đã kết thúc và cọc " + vnd(reservation.getDepositAmount())
                + " không hoàn lại. Đặt kho mới bất cứ khi nào bạn sẵn sàng.";
        String deepLink = "/rentals/" + reservation.getReservationId();

        Notification row = new Notification();
        row.setUser(reservation.getCustomer());
        row.setType(TYPE_RESERVATION_EXPIRED);
        row.setTitle(title);
        row.setDeepLink(deepLink);
        row.setIsRead(false);
        notificationRepository.save(row);

        return new NotificationEventResponse(
                TYPE_RESERVATION_EXPIRED,
                title,
                body,
                deepLink
        );
    }

    @Override
    public NotificationEventResponse notifyCheckInCompleted(Reservation reservation) {
        // NFR-7 microcopy 3 phần. AD-5: KHÔNG đưa access code vào notification —
        // code chỉ nằm trong Rental Detail của chủ reservation.
        String title = "Rental active — "
                + reservation.getUnit().getCode() + " checked in";
        String body = "Check-in " + reservation.getCode()
                + " hoàn tất, hợp đồng đã ký và tiền thuê đã nhận đủ. "
                + "Mã truy cập của bạn sẵn sàng trong Chi tiết thuê kho.";
        String deepLink = "/rentals/" + reservation.getReservationId();

        Notification row = new Notification();
        row.setUser(reservation.getCustomer());
        row.setType(TYPE_CHECK_IN_COMPLETED);
        row.setTitle(title);
        row.setDeepLink(deepLink);
        row.setIsRead(false);
        notificationRepository.save(row);

        return new NotificationEventResponse(
                TYPE_CHECK_IN_COMPLETED,
                title,
                body,
                deepLink
        );
    }

    @Override
    @Transactional
    public NotificationEventResponse notifyCheckoutRequested(Reservation reservation, LocalDate requestedDate) {
        String title = "Yêu cầu trả kho — " + reservation.getCode();
        String body = "Đã gửi yêu cầu trả kho cho ngày " + requestedDate
                + ". Nhân viên ca trực sẽ tiến hành kiểm tra và tất toán cọc tại quầy.";
        String deepLink = "/rentals/" + reservation.getReservationId();

        Notification row = new Notification();
        row.setUser(reservation.getCustomer());
        row.setType(TYPE_CHECKOUT_REQUESTED);
        row.setTitle(title);
        row.setDeepLink(deepLink);
        row.setIsRead(false);
        notificationRepository.save(row);

        return new NotificationEventResponse(
                TYPE_CHECKOUT_REQUESTED,
                title,
                body,
                deepLink
        );
    }

    @Override
    @Transactional
    public NotificationEventResponse notifyCheckoutRequestCancelled(Reservation reservation) {
        String title = "Hủy yêu cầu trả kho — " + reservation.getCode();
        String body = "Đã hủy yêu cầu trả kho cho đơn " + reservation.getCode()
                + ". Trạng thái đơn tiếp tục duy trì Đang thuê kho.";
        String deepLink = "/rentals/" + reservation.getReservationId();

        Notification row = new Notification();
        row.setUser(reservation.getCustomer());
        row.setType(TYPE_CHECKOUT_REQUEST_CANCELLED);
        row.setTitle(title);
        row.setDeepLink(deepLink);
        row.setIsRead(false);
        notificationRepository.save(row);

        return new NotificationEventResponse(
                TYPE_CHECKOUT_REQUEST_CANCELLED,
                title,
                body,
                deepLink
        );
    }

    /** VND theo AD-7/FR-6: "103.500 ₫" — nhóm 3 bằng dấu chấm. */
    private static String vnd(java.math.BigDecimal amount) {
        DecimalFormatSymbols symbols = DecimalFormatSymbols.getInstance(Locale.US);
        symbols.setGroupingSeparator('.');
        return new DecimalFormat("#,##0", symbols).format(amount) + " ₫";
    }
}
