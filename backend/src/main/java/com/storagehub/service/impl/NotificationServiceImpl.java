package com.storagehub.service.impl;

import com.storagehub.dto.notification.NotificationEventResponse;
import com.storagehub.dto.notification.NotificationPageResponse;
import com.storagehub.dto.notification.NotificationResponse;
import com.storagehub.dto.notification.UnreadCountResponse;
import com.storagehub.entity.Notification;
import com.storagehub.entity.Payment;
import com.storagehub.entity.Reservation;
import com.storagehub.entity.User;
import com.storagehub.exception.InvalidCredentialsException;
import com.storagehub.repository.NotificationRepository;
import com.storagehub.repository.UserRepository;
import com.storagehub.service.NotificationService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.text.DecimalFormat;
import java.text.DecimalFormatSymbols;
import java.util.List;
import java.util.Locale;

/**
 * Triển khai NotificationService theo FR-33/34 (Toast + Bell + Notification feed).
 */
@Service
public class NotificationServiceImpl implements NotificationService {

    private static final String TYPE_RESERVATION_CONFIRMED = "RESERVATION_CONFIRMED";
    private static final String TYPE_RESERVATION_EXPIRED = "RESERVATION_EXPIRED";
    private static final String TYPE_CHECK_IN_COMPLETED = "CHECK_IN_COMPLETED";

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;

    public NotificationServiceImpl(
            NotificationRepository notificationRepository,
            UserRepository userRepository
    ) {
        this.notificationRepository = notificationRepository;
        this.userRepository = userRepository;
    }

    @Override
    @Transactional
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
    @Transactional
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
    @Transactional
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
                "CHECK_IN_COMPLETED",
                title,
                body,
                deepLink
        );
    }

    @Override
    @Transactional(readOnly = true)
    public NotificationPageResponse listNotifications(
            String email,
            boolean unreadOnly,
            int page,
            int pageSize
    ) {
        if (email == null || email.isBlank()) {
            throw new InvalidCredentialsException();
        }
        User user = userRepository.findByEmailIgnoreCase(email)
                .orElseThrow(InvalidCredentialsException::new);

        int currentPage = Math.max(1, page);
        int pageIndex = currentPage - 1;
        int size = Math.max(1, Math.min(pageSize, 100));

        Page<Notification> notificationPage;
        if (unreadOnly) {
            Pageable pageable = PageRequest.of(pageIndex, size, Sort.by(Sort.Direction.DESC, "createdAt"));
            notificationPage = notificationRepository.findByUserAndIsReadFalse(user, pageable);
        } else {
            // Bell feed — unread trước (FR-34): isRead ASC (false first), createdAt DESC
            Pageable pageable = PageRequest.of(pageIndex, size, Sort.by(
                    Sort.Order.asc("isRead"),
                    Sort.Order.desc("createdAt")
            ));
            notificationPage = notificationRepository.findByUser(user, pageable);
        }

        List<NotificationResponse> items = notificationPage.getContent().stream()
                .map(NotificationResponse::from)
                .toList();

        return new NotificationPageResponse(
                items,
                currentPage,
                size,
                (int) notificationPage.getTotalElements()
        );
    }

    @Override
    @Transactional(readOnly = true)
    public UnreadCountResponse getUnreadCount(String email) {
        if (email == null || email.isBlank()) {
            throw new InvalidCredentialsException();
        }
        User user = userRepository.findByEmailIgnoreCase(email)
                .orElseThrow(InvalidCredentialsException::new);

        long count = notificationRepository.countByUserAndIsReadFalse(user);
        return new UnreadCountResponse(count);
    }

    @Override
    @Transactional
    public void markAllRead(String email) {
        if (email == null || email.isBlank()) {
            throw new InvalidCredentialsException();
        }
        User user = userRepository.findByEmailIgnoreCase(email)
                .orElseThrow(InvalidCredentialsException::new);

        notificationRepository.markAllAsReadByUser(user);
    }

    /** VND theo AD-7/FR-6: "103.500 ₫" — nhóm 3 bằng dấu chấm. */
    private static String vnd(java.math.BigDecimal amount) {
        DecimalFormatSymbols symbols = DecimalFormatSymbols.getInstance(Locale.US);
        symbols.setGroupingSeparator('.');
        return new DecimalFormat("#,##0", symbols).format(amount) + " ₫";
    }
}
