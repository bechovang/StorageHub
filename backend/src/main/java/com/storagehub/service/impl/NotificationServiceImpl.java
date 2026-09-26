package com.storagehub.service.impl;

import com.storagehub.dto.notification.NotificationEventResponse;
import com.storagehub.entity.Notification;
import com.storagehub.entity.Payment;
import com.storagehub.entity.Reservation;
import com.storagehub.repository.NotificationRepository;
import com.storagehub.service.NotificationService;
import org.springframework.stereotype.Service;

import java.text.DecimalFormat;
import java.text.DecimalFormatSymbols;
import java.util.Locale;

/** TỐI THIỂU cho US-8 — US-17 (Toast/Bell/Feed) mở rộng list + unread. */
@Service
public class NotificationServiceImpl implements NotificationService {

    private static final String TYPE_RESERVATION_CONFIRMED = "RESERVATION_CONFIRMED";

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

    /** VND theo AD-7/FR-6: "103.500 ₫" — nhóm 3 bằng dấu chấm. */
    private static String vnd(java.math.BigDecimal amount) {
        DecimalFormatSymbols symbols = DecimalFormatSymbols.getInstance(Locale.US);
        symbols.setGroupingSeparator('.');
        return new DecimalFormat("#,##0", symbols).format(amount) + " ₫";
    }
}
