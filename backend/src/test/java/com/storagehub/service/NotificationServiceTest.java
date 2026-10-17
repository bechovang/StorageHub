package com.storagehub.service;

import com.storagehub.dto.notification.NotificationEventResponse;
import com.storagehub.dto.notification.NotificationPageResponse;
import com.storagehub.dto.notification.UnreadCountResponse;
import com.storagehub.entity.Notification;
import com.storagehub.entity.Payment;
import com.storagehub.entity.Reservation;
import com.storagehub.entity.Unit;
import com.storagehub.entity.User;
import com.storagehub.exception.InvalidCredentialsException;
import com.storagehub.repository.NotificationRepository;
import com.storagehub.repository.UserRepository;
import com.storagehub.service.impl.NotificationServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class NotificationServiceTest {

    @Mock
    private NotificationRepository notificationRepository;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private NotificationServiceImpl notificationService;

    private User customer;
    private Unit unit;
    private Reservation reservation;
    private Payment payment;

    @BeforeEach
    void setUp() {
        customer = new User();
        customer.setUserId(1L);
        customer.setEmail("lan@demo.storagehub.vn");
        customer.setFullName("Nguyễn Thị Lan");

        unit = new Unit();
        unit.setUnitId(10L);
        unit.setCode("S-3");

        reservation = new Reservation();
        reservation.setReservationId(1042L);
        reservation.setCode("BK-1042");
        reservation.setCustomer(customer);
        reservation.setUnit(unit);
        reservation.setDepositAmount(new BigDecimal("103500"));

        payment = new Payment();
        payment.setPaymentId(501L);
        payment.setAmount(new BigDecimal("103500"));
    }

    @Test
    @DisplayName("notifyReservationConfirmed lưu notification và trả event cho FE bắn toast")
    void testNotifyReservationConfirmed() {
        NotificationEventResponse event = notificationService.notifyReservationConfirmed(reservation, payment);

        assertThat(event).isNotNull();
        assertThat(event.type()).isEqualTo("RESERVATION_CONFIRMED");
        assertThat(event.title()).contains("S-3 reserved");
        assertThat(event.body()).contains("103.500 ₫");
        assertThat(event.deepLink()).isEqualTo("/rentals/1042");

        ArgumentCaptor<Notification> captor = ArgumentCaptor.forClass(Notification.class);
        verify(notificationRepository).save(captor.capture());
        Notification saved = captor.getValue();
        assertThat(saved.getUser()).isEqualTo(customer);
        assertThat(saved.getType()).isEqualTo("RESERVATION_CONFIRMED");
        assertThat(saved.getTitle()).isEqualTo(event.title());
        assertThat(saved.getDeepLink()).isEqualTo("/rentals/1042");
        assertThat(saved.getIsRead()).isFalse();
    }

    @Test
    @DisplayName("notifyReservationExpired lưu notification và trả event khi no-show")
    void testNotifyReservationExpired() {
        NotificationEventResponse event = notificationService.notifyReservationExpired(reservation);

        assertThat(event).isNotNull();
        assertThat(event.type()).isEqualTo("RESERVATION_EXPIRED");
        assertThat(event.title()).contains("S-3 no-show");
        assertThat(event.body()).contains("BK-1042");
        assertThat(event.deepLink()).isEqualTo("/rentals/1042");

        verify(notificationRepository).save(any(Notification.class));
    }

    @Test
    @DisplayName("notifyCheckInCompleted lưu notification khi check-in thành công")
    void testNotifyCheckInCompleted() {
        NotificationEventResponse event = notificationService.notifyCheckInCompleted(reservation);

        assertThat(event).isNotNull();
        assertThat(event.type()).isEqualTo("CHECK_IN_COMPLETED");
        assertThat(event.title()).contains("S-3 checked in");
        assertThat(event.deepLink()).isEqualTo("/rentals/1042");

        verify(notificationRepository).save(any(Notification.class));
    }

    @Test
    @DisplayName("listNotifications (unread-only=false) trả về feed phân trang với unread trước")
    void testListNotifications_All() {
        when(userRepository.findByEmailIgnoreCase("lan@demo.storagehub.vn"))
                .thenReturn(Optional.of(customer));

        Notification notif1 = new Notification();
        notif1.setNotificationId(1L);
        notif1.setType("BOOKING_CONFIRMED");
        notif1.setTitle("Unit S-3 reserved.");
        notif1.setDeepLink("/rentals/1042");
        notif1.setIsRead(false);
        notif1.setCreatedAt(LocalDateTime.now());

        Notification notif2 = new Notification();
        notif2.setNotificationId(2L);
        notif2.setType("PAYMENT_SUCCEEDED");
        notif2.setTitle("Payment received.");
        notif2.setDeepLink("/rentals/1042");
        notif2.setIsRead(true);
        notif2.setCreatedAt(LocalDateTime.now().minusHours(1));

        Page<Notification> page = new PageImpl<>(List.of(notif1, notif2));
        when(notificationRepository.findByUser(eq(customer), any(Pageable.class)))
                .thenReturn(page);

        NotificationPageResponse response = notificationService.listNotifications(
                "lan@demo.storagehub.vn", false, 1, 25
        );

        assertThat(response.items()).hasSize(2);
        assertThat(response.items().get(0).id()).isEqualTo(1L);
        assertThat(response.items().get(0).isRead()).isFalse();
        assertThat(response.items().get(1).id()).isEqualTo(2L);
        assertThat(response.items().get(1).isRead()).isTrue();
        assertThat(response.page()).isEqualTo(1);
        assertThat(response.pageSize()).isEqualTo(25);
        assertThat(response.total()).isEqualTo(2);
    }

    @Test
    @DisplayName("listNotifications (unread-only=true) chỉ lấy thông báo chưa đọc")
    void testListNotifications_UnreadOnly() {
        when(userRepository.findByEmailIgnoreCase("lan@demo.storagehub.vn"))
                .thenReturn(Optional.of(customer));

        Notification notif1 = new Notification();
        notif1.setNotificationId(1L);
        notif1.setType("BOOKING_CONFIRMED");
        notif1.setTitle("Unit S-3 reserved.");
        notif1.setIsRead(false);
        notif1.setCreatedAt(LocalDateTime.now());

        Page<Notification> page = new PageImpl<>(List.of(notif1));
        when(notificationRepository.findByUserAndIsReadFalse(eq(customer), any(Pageable.class)))
                .thenReturn(page);

        NotificationPageResponse response = notificationService.listNotifications(
                "lan@demo.storagehub.vn", true, 1, 25
        );

        assertThat(response.items()).hasSize(1);
        assertThat(response.items().get(0).isRead()).isFalse();
        assertThat(response.total()).isEqualTo(1);
    }

    @Test
    @DisplayName("listNotifications xử lý page <= 0 và pageSize > 100 bằng cách clamp an toàn")
    void testListNotifications_PageClamping() {
        when(userRepository.findByEmailIgnoreCase("lan@demo.storagehub.vn"))
                .thenReturn(Optional.of(customer));

        when(notificationRepository.findByUser(eq(customer), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of()));

        NotificationPageResponse response = notificationService.listNotifications(
                "lan@demo.storagehub.vn", false, -1, 500
        );

        assertThat(response.page()).isEqualTo(1);
        assertThat(response.pageSize()).isEqualTo(100);
        assertThat(response.total()).isEqualTo(0);
    }

    @Test
    @DisplayName("listNotifications ném InvalidCredentialsException khi email trống")
    void testListNotifications_BlankEmail() {
        assertThatThrownBy(() -> notificationService.listNotifications("", false, 1, 25))
                .isInstanceOf(InvalidCredentialsException.class);

        assertThatThrownBy(() -> notificationService.listNotifications(null, false, 1, 25))
                .isInstanceOf(InvalidCredentialsException.class);
    }

    @Test
    @DisplayName("listNotifications ném InvalidCredentialsException khi email không tồn tại")
    void testListNotifications_UserNotFound() {
        when(userRepository.findByEmailIgnoreCase("unknown@example.com"))
                .thenReturn(Optional.empty());

        assertThatThrownBy(() -> notificationService.listNotifications("unknown@example.com", false, 1, 25))
                .isInstanceOf(InvalidCredentialsException.class);
    }

    @Test
    @DisplayName("getUnreadCount trả về số lượng thông báo chưa đọc")
    void testGetUnreadCount() {
        when(userRepository.findByEmailIgnoreCase("lan@demo.storagehub.vn"))
                .thenReturn(Optional.of(customer));
        when(notificationRepository.countByUserAndIsReadFalse(customer))
                .thenReturn(3L);

        UnreadCountResponse response = notificationService.getUnreadCount("lan@demo.storagehub.vn");

        assertThat(response.count()).isEqualTo(3L);
    }

    @Test
    @DisplayName("getUnreadCount ném InvalidCredentialsException khi email trống")
    void testGetUnreadCount_BlankEmail() {
        assertThatThrownBy(() -> notificationService.getUnreadCount(""))
                .isInstanceOf(InvalidCredentialsException.class);
    }

    @Test
    @DisplayName("markAllRead gọi repository để đánh dấu tất cả thông báo là đã đọc")
    void testMarkAllRead() {
        when(userRepository.findByEmailIgnoreCase("lan@demo.storagehub.vn"))
                .thenReturn(Optional.of(customer));

        notificationService.markAllRead("lan@demo.storagehub.vn");

        verify(notificationRepository).markAllAsReadByUser(customer);
    }

    @Test
    @DisplayName("markAllRead ném InvalidCredentialsException khi email trống")
    void testMarkAllRead_BlankEmail() {
        assertThatThrownBy(() -> notificationService.markAllRead("   "))
                .isInstanceOf(InvalidCredentialsException.class);
    }
}
