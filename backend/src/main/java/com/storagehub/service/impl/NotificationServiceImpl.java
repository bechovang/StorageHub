package com.storagehub.service.impl;

import com.storagehub.dto.notification.NotificationEventResponse;
import com.storagehub.dto.notification.NotificationPageResponse;
import com.storagehub.dto.notification.NotificationResponse;
import com.storagehub.dto.notification.UnreadCountResponse;
import com.storagehub.entity.ContractAddendum;
import com.storagehub.entity.Notification;
import com.storagehub.entity.Payment;
import org.springframework.security.access.AccessDeniedException;
import com.storagehub.entity.Reservation;
import com.storagehub.entity.Role;
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
import java.time.LocalDate;
import java.time.ZoneId;
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
    private static final String TYPE_CHECKOUT_REQUESTED = "CHECKOUT_REQUESTED";
    private static final String TYPE_CHECKOUT_REQUEST_CANCELLED = "CHECKOUT_REQUEST_CANCELLED";
    private static final String TYPE_EXTENSION_APPLIED = "EXTENSION_APPLIED";
    private static final String TYPE_ADDENDUM_AWAITING_SIGNATURE = "ADDENDUM_AWAITING_SIGNATURE";
    private static final String TYPE_RENT_PAID_READY_CHECKIN = "RENT_PAID_READY_CHECKIN";
    private static final String TYPE_TICKET_CREATED = "TICKET_CREATED";
    private static final String TYPE_TICKET_STATUS_CHANGED = "TICKET_STATUS_CHANGED";
    private static final String TYPE_FORCED_CHECKOUT = "FORCED_CHECKOUT";
    private static final String TYPE_SETTLEMENT_COMPLETED = "SETTLEMENT_COMPLETED";

    private static final ZoneId ICT_ZONE = ZoneId.of("Asia/Ho_Chi_Minh");

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

    @Override
    @Transactional
    public void markRead(String email, Long notificationId) {
        if (email == null || email.isBlank()) {
            throw new InvalidCredentialsException();
        }
        Notification row = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new com.storagehub.exception.BusinessRuleException(
                        "Thông báo không tồn tại."));
        // Owner-check: không cho đánh dấu hộ người khác
        if (!row.getUser().getEmail().equalsIgnoreCase(email)) {
            throw new AccessDeniedException("Thông báo không thuộc về bạn.");
        }
        if (Boolean.TRUE.equals(row.getIsRead())) {
            return; // idempotent
        }
        row.setIsRead(true);
        notificationRepository.save(row);
    }

    @Override
    @Transactional
    public NotificationEventResponse notifyExtensionApplied(
            Reservation reservation,
            com.storagehub.entity.Extension extension
    ) {
        // NFR-7 microcopy 3 phần. Ngày mới hiệu lực ngay khi phí được trả (FR-16)
        // — EndDate đã được ReservationService.markExtensionApplied cập nhật
        // trước khi gọi (cùng transaction), đọc từ extension cho chắc chắn.
        LocalDate newEnd = extension.getNewEndDate();
        String title = "Gia hạn thành công — checkout mới " + newEnd;
        String body = "Đơn " + reservation.getCode() + " kéo dài đến " + newEnd
                + ". Cọc đang giữ hiện là " + vnd(reservation.getDepositAmount())
                + ". Phụ lục hợp đồng sẽ hẹn ký tại quầy trong 7 ngày.";
        String deepLink = "/rentals/" + reservation.getReservationId();

        Notification row = new Notification();
        row.setUser(reservation.getCustomer());
        row.setType(TYPE_EXTENSION_APPLIED);
        row.setTitle(title);
        row.setDeepLink(deepLink);
        row.setIsRead(false);
        notificationRepository.save(row);

        return new NotificationEventResponse(
                TYPE_EXTENSION_APPLIED,
                title,
                body,
                deepLink
        );
    }

    @Override
    public void notifyAddendumAwaitingSignature(
            Reservation reservation,
            com.storagehub.entity.ContractAddendum addendum
    ) {
        // FR-12 "hai bên": staff nhận bell để chuẩn bị bản giấy tại quầy.
        userRepository.findFirstByRole_NameAndStatusOrderByUserIdAsc(Role.Name.STAFF, 1)
                .ifPresent(staff -> {
                    String title = "Addendum " + addendum.getCode() + " chờ ký tại quầy";
                    String body = "Khách " + reservation.getCustomer().getFullName()
                            + " vừa gia hạn kho " + reservation.getUnit().getCode()
                            + ". Hạn ký: " + addendum.getSignatureDueDate() + ".";
                    Notification row = new Notification();
                    row.setUser(staff);
                    row.setType(TYPE_ADDENDUM_AWAITING_SIGNATURE);
                    row.setTitle(title);
                    row.setDeepLink("/rentals/" + reservation.getReservationId());
                    row.setIsRead(false);
                    notificationRepository.save(row);
                });
    }

    @Override
    @Transactional
    public void notifyRentPaidReadyForCheckIn(Reservation reservation, com.storagehub.entity.Payment payment) {
        String deepLink = "/rentals/" + reservation.getReservationId();

        // Staff: khách đã trả đủ tiền thuê — sẵn sàng làm thủ tục check-in tại quầy.
        userRepository.findFirstByRole_NameAndStatusOrderByUserIdAsc(Role.Name.STAFF, 1)
                .ifPresent(staff -> {
                    Notification row = new Notification();
                    row.setUser(staff);
                    row.setType(TYPE_RENT_PAID_READY_CHECKIN);
                    row.setTitle("Khách " + reservation.getCode() + " đã trả đủ tiền thuê");
                    row.setIsRead(false);
                    notificationRepository.save(row);
                });

        // Khách: hướng dẫn mang giấy tờ ra quầy để ký hợp đồng và nhận mã truy cập.
        Notification forCustomer = new Notification();
        forCustomer.setUser(reservation.getCustomer());
        forCustomer.setType(TYPE_RENT_PAID_READY_CHECKIN);
        forCustomer.setTitle("Đã nhận đủ tiền thuê — " + reservation.getUnit().getCode());
        forCustomer.setIsRead(false);
        notificationRepository.save(forCustomer);
    }

    @Override
    @Transactional
    public void notifyTicketCreated(com.storagehub.entity.SupportTicket ticket) {
        userRepository.findFirstByRole_NameAndStatusOrderByUserIdAsc(Role.Name.STAFF, 1)
                .ifPresent(staff -> {
                    Notification row = new Notification();
                    row.setUser(staff);
                    row.setType(TYPE_TICKET_CREATED);
                    row.setTitle("Ticket " + ticket.getCode() + " — kho " + ticket.getUnit().getCode());
                    row.setIsRead(false);
                    notificationRepository.save(row);
                });
    }

    @Override
    @Transactional
    public void notifyTicketStatusChanged(com.storagehub.entity.SupportTicket ticket, String oldStatus) {
        Notification row = new Notification();
        row.setUser(ticket.getCustomer());
        row.setType(TYPE_TICKET_STATUS_CHANGED);
        row.setTitle("Ticket " + ticket.getCode() + ": " + oldStatus + " → " + ticket.getStatus());
        row.setIsRead(false);
        notificationRepository.save(row);
    }

    @Override
    @Transactional
    public void notifyForcedCheckout(com.storagehub.entity.Reservation reservation, String type, String note) {
        Notification row = new Notification();
        row.setUser(reservation.getCustomer());
        row.setType(TYPE_FORCED_CHECKOUT);
        row.setTitle(("VIOLATION".equals(type) ? "Buộc trả kho — " : "Đổi kho — ")
                + reservation.getUnit().getCode());
        row.setDeepLink("/rentals/" + reservation.getReservationId());
        row.setIsRead(false);
        notificationRepository.save(row);
    }

    @Override
    @Transactional
    public void notifySettlementCompleted(com.storagehub.entity.Reservation reservation, long refundAmount) {
        Notification row = new Notification();
        row.setUser(reservation.getCustomer());
        row.setType(TYPE_SETTLEMENT_COMPLETED);
        row.setTitle("Đã tất toán — " + reservation.getUnit().getCode());
        row.setDeepLink("/rentals/" + reservation.getReservationId());
        row.setIsRead(false);
        notificationRepository.save(row);
    }

    /** VND theo AD-7/FR-6: "103.500 ₫" — nhóm 3 bằng dấu chấm. */
    private static String vnd(java.math.BigDecimal amount) {
        DecimalFormatSymbols symbols = DecimalFormatSymbols.getInstance(Locale.US);
        symbols.setGroupingSeparator('.');
        return new DecimalFormat("#,##0", symbols).format(amount) + " ₫";
    }
}
