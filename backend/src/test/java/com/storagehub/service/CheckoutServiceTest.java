package com.storagehub.service;

import com.storagehub.dto.checkout.CancelCheckoutResponse;
import com.storagehub.dto.checkout.CheckoutRequestResponse;
import com.storagehub.dto.checkout.CreateCheckoutRequest;
import com.storagehub.dto.notification.NotificationEventResponse;
import com.storagehub.entity.CheckoutRequest;
import com.storagehub.entity.PolicyRule;
import com.storagehub.entity.RentalPolicy;
import com.storagehub.entity.Reservation;
import com.storagehub.entity.Role;
import com.storagehub.entity.Task;
import com.storagehub.entity.Unit;
import com.storagehub.entity.UnitType;
import com.storagehub.entity.User;
import com.storagehub.exception.InvalidCredentialsException;
import com.storagehub.exception.ReservationInvalidStateException;
import com.storagehub.exception.ReservationNotFoundException;
import com.storagehub.repository.CheckoutRequestRepository;
import com.storagehub.repository.PolicyRuleRepository;
import com.storagehub.repository.RentalPolicyRepository;
import com.storagehub.repository.ReservationRepository;
import com.storagehub.repository.UserRepository;
import com.storagehub.service.impl.CheckoutServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.access.AccessDeniedException;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class CheckoutServiceTest {

    @Mock
    private CheckoutRequestRepository checkoutRequestRepository;
    @Mock
    private ReservationRepository reservationRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private PolicyRuleRepository policyRuleRepository;
    @Mock
    private RentalPolicyRepository rentalPolicyRepository;
    @Mock
    private ReservationService reservationService;
    @Mock
    private TaskService taskService;
    @Mock
    private NotificationService notificationService;
    @Mock
    private LogService logService;

    @InjectMocks
    private CheckoutServiceImpl checkoutService;

    private User customer;
    private User otherCustomer;
    private Unit unit;
    private UnitType unitType;
    private Reservation reservation;
    private RentalPolicy policy;
    private PolicyRule bufferRule;

    private static final ZoneId ICT_ZONE = ZoneId.of("Asia/Ho_Chi_Minh");

    @BeforeEach
    void setUp() {
        Role customerRole = new Role();
        customerRole.setName(Role.Name.CUSTOMER);

        customer = new User();
        customer.setUserId(10L);
        customer.setEmail("lan@demo.vn");
        customer.setFullName("Lan Nguyen");
        customer.setRole(customerRole);

        otherCustomer = new User();
        otherCustomer.setUserId(20L);
        otherCustomer.setEmail("other@demo.vn");
        otherCustomer.setFullName("Other User");
        otherCustomer.setRole(customerRole);

        unitType = new UnitType();
        unitType.setTypeId(1);
        unitType.setName("Locker");

        unit = new Unit();
        unit.setUnitId(1L);
        unit.setCode("LOCK-1");
        unit.setType(unitType);

        LocalDate today = LocalDate.now(ICT_ZONE);
        reservation = new Reservation();
        reservation.setReservationId(100L);
        reservation.setCode("BK-2026-0001");
        reservation.setCustomer(customer);
        reservation.setUnit(unit);
        reservation.setStartDate(today.minusMonths(1));
        reservation.setEndDate(today.plusMonths(2));
        reservation.setStatus(Reservation.Status.CHECKED_IN);

        policy = new RentalPolicy();
        policy.setPolicyId(1);
        policy.setStatus(1);

        bufferRule = new PolicyRule();
        bufferRule.setPolicy(policy);
        bufferRule.setType(unitType);
        bufferRule.setRuleType(PolicyRule.RuleType.TURNOVER_BUFFER);
        bufferRule.setValue(new BigDecimal("1"));
    }

    @Test
    @DisplayName("Tạo checkout request thành công: trạng thái đổi CHECKOUT_REQUESTED, sinh task và notification")
    void testCreateCheckoutRequest_Success() {
        LocalDate today = LocalDate.now(ICT_ZONE);
        LocalDate requestedDate = today.plusDays(10);
        CreateCheckoutRequest request = new CreateCheckoutRequest(requestedDate, "MORNING", "EXPIRED_NEED");

        when(userRepository.findByEmailIgnoreCase("lan@demo.vn")).thenReturn(Optional.of(customer));
        when(reservationRepository.findWithDetailsById(100L)).thenReturn(Optional.of(reservation));
        when(reservationRepository.findActiveReservationsForUnit(eq(1L), any())).thenReturn(List.of(reservation));
        when(rentalPolicyRepository.findByStatus(1)).thenReturn(Optional.of(policy));
        when(policyRuleRepository.findByPolicy_PolicyId(1)).thenReturn(List.of(bufferRule));
        when(checkoutRequestRepository.findByReservation_ReservationIdAndStatus(100L, CheckoutRequest.Status.PENDING))
                .thenReturn(new ArrayList<>());

        when(checkoutRequestRepository.save(any(CheckoutRequest.class))).thenAnswer(invocation -> {
            CheckoutRequest cr = invocation.getArgument(0);
            cr.setRequestId(501L);
            return cr;
        });

        Reservation updatedRes = new Reservation();
        updatedRes.setReservationId(100L);
        updatedRes.setCode(reservation.getCode());
        updatedRes.setCustomer(customer);
        updatedRes.setUnit(unit);
        updatedRes.setStatus(Reservation.Status.CHECKOUT_REQUESTED);

        when(reservationService.transitionToCheckoutRequested(customer, 100L, "EXPIRED_NEED")).thenReturn(updatedRes);

        Task checkoutTask = new Task();
        checkoutTask.setTaskId(999L);
        when(taskService.createOrUpdateCheckoutTask(customer, updatedRes, requestedDate, "MORNING", "EXPIRED_NEED"))
                .thenReturn(checkoutTask);

        NotificationEventResponse notif = new NotificationEventResponse(
                "CHECKOUT_REQUESTED",
                "Yêu cầu trả kho — " + reservation.getCode(),
                "Đã gửi yêu cầu",
                "/rentals/100"
        );
        when(notificationService.notifyCheckoutRequested(updatedRes, requestedDate)).thenReturn(notif);

        CheckoutRequestResponse response = checkoutService.createCheckoutRequest("lan@demo.vn", 100L, request);

        assertNotNull(response);
        assertEquals(501L, response.requestId());
        assertEquals(100L, response.reservationId());
        assertEquals(requestedDate, response.requestedDate());
        assertEquals("PENDING", response.status());
        assertEquals("CHECKOUT_REQUESTED", response.reservationStatus());
        assertEquals(999L, response.taskId());
        assertEquals("CHECKOUT_REQUESTED", response.notification().type());

        verify(reservationService).transitionToCheckoutRequested(customer, 100L, "EXPIRED_NEED");
        verify(taskService).createOrUpdateCheckoutTask(customer, updatedRes, requestedDate, "MORNING", "EXPIRED_NEED");
        verify(notificationService).notifyCheckoutRequested(updatedRes, requestedDate);
        verify(logService).log(eq(customer), eq("CHECKOUT_REQUEST"), eq(501L), eq("CREATED"), any(), eq("PENDING"), any());
    }

    @Test
    @DisplayName("Request mới đè request cũ (request cũ tự hủy thành CANCELLED)")
    void testCreateCheckoutRequest_SupercedesOldRequest() {
        LocalDate today = LocalDate.now(ICT_ZONE);
        LocalDate requestedDate = today.plusDays(15);
        CreateCheckoutRequest request = new CreateCheckoutRequest(requestedDate, "AFTERNOON", "DOWNSIZE");

        CheckoutRequest oldReq = new CheckoutRequest();
        oldReq.setRequestId(400L);
        oldReq.setStatus(CheckoutRequest.Status.PENDING);
        oldReq.setRequestedDate(today.plusDays(5));

        reservation.setStatus(Reservation.Status.CHECKOUT_REQUESTED);

        when(userRepository.findByEmailIgnoreCase("lan@demo.vn")).thenReturn(Optional.of(customer));
        when(reservationRepository.findWithDetailsById(100L)).thenReturn(Optional.of(reservation));
        when(reservationRepository.findActiveReservationsForUnit(eq(1L), any())).thenReturn(List.of(reservation));
        when(rentalPolicyRepository.findByStatus(1)).thenReturn(Optional.of(policy));
        when(policyRuleRepository.findByPolicy_PolicyId(1)).thenReturn(List.of(bufferRule));
        when(checkoutRequestRepository.findByReservation_ReservationIdAndStatus(100L, CheckoutRequest.Status.PENDING))
                .thenReturn(List.of(oldReq));

        when(checkoutRequestRepository.save(any(CheckoutRequest.class))).thenAnswer(invocation -> {
            CheckoutRequest cr = invocation.getArgument(0);
            if (cr.getRequestId() == null) {
                cr.setRequestId(502L);
            }
            return cr;
        });

        Task checkoutTask = new Task();
        checkoutTask.setTaskId(999L);
        when(taskService.createOrUpdateCheckoutTask(customer, reservation, requestedDate, "AFTERNOON", "DOWNSIZE"))
                .thenReturn(checkoutTask);

        NotificationEventResponse notif = new NotificationEventResponse(
                "CHECKOUT_REQUESTED", "Title", "Body", "/rentals/100"
        );
        when(notificationService.notifyCheckoutRequested(reservation, requestedDate)).thenReturn(notif);

        CheckoutRequestResponse response = checkoutService.createCheckoutRequest("lan@demo.vn", 100L, request);

        assertEquals(502L, response.requestId());
        assertEquals(CheckoutRequest.Status.CANCELLED, oldReq.getStatus());
        verify(checkoutRequestRepository).save(oldReq);
        verify(logService).log(eq(customer), eq("CHECKOUT_REQUEST"), eq(400L), eq("CANCELLED"), eq("PENDING"), eq("CANCELLED"), any());
        verify(reservationService, never()).transitionToCheckoutRequested(any(), any(), any());
    }

    @Test
    @DisplayName("Ném AccessDeniedException khi người gửi không phải chủ đơn đặt chỗ")
    void testCreateCheckoutRequest_Forbidden() {
        LocalDate today = LocalDate.now(ICT_ZONE);
        CreateCheckoutRequest request = new CreateCheckoutRequest(today.plusDays(5), "MORNING", null);

        when(userRepository.findByEmailIgnoreCase("other@demo.vn")).thenReturn(Optional.of(otherCustomer));
        when(reservationRepository.findWithDetailsById(100L)).thenReturn(Optional.of(reservation));

        assertThrows(AccessDeniedException.class, () ->
                checkoutService.createCheckoutRequest("other@demo.vn", 100L, request));
    }

    @Test
    @DisplayName("Ném ReservationInvalidStateException khi đơn không ở trạng thái CHECKED_IN hoặc CHECKOUT_REQUESTED")
    void testCreateCheckoutRequest_InvalidState() {
        reservation.setStatus(Reservation.Status.RESERVED);
        LocalDate today = LocalDate.now(ICT_ZONE);
        CreateCheckoutRequest request = new CreateCheckoutRequest(today.plusDays(5), "MORNING", null);

        when(userRepository.findByEmailIgnoreCase("lan@demo.vn")).thenReturn(Optional.of(customer));
        when(reservationRepository.findWithDetailsById(100L)).thenReturn(Optional.of(reservation));

        ReservationInvalidStateException ex = assertThrows(ReservationInvalidStateException.class, () ->
                checkoutService.createCheckoutRequest("lan@demo.vn", 100L, request));
        assertTrue(ex.getMessage().contains("CHECKED_IN"));
    }

    @Test
    @DisplayName("Ném ReservationInvalidStateException khi ngày hẹn trả kho ở quá khứ")
    void testCreateCheckoutRequest_DateInPast() {
        LocalDate pastDate = LocalDate.now(ICT_ZONE).minusDays(2);
        CreateCheckoutRequest request = new CreateCheckoutRequest(pastDate, "MORNING", null);

        when(userRepository.findByEmailIgnoreCase("lan@demo.vn")).thenReturn(Optional.of(customer));
        when(reservationRepository.findWithDetailsById(100L)).thenReturn(Optional.of(reservation));

        ReservationInvalidStateException ex = assertThrows(ReservationInvalidStateException.class, () ->
                checkoutService.createCheckoutRequest("lan@demo.vn", 100L, request));
        assertTrue(ex.getMessage().contains("quá khứ"));
    }

    @Test
    @DisplayName("Ném ReservationInvalidStateException khi ngày hẹn trả kho trước ngày bắt đầu thuê")
    void testCreateCheckoutRequest_DateBeforeStartDate() {
        LocalDate today = LocalDate.now(ICT_ZONE);
        reservation.setStartDate(today.plusDays(5));
        CreateCheckoutRequest request = new CreateCheckoutRequest(today.plusDays(2), "MORNING", null);

        when(userRepository.findByEmailIgnoreCase("lan@demo.vn")).thenReturn(Optional.of(customer));
        when(reservationRepository.findWithDetailsById(100L)).thenReturn(Optional.of(reservation));

        ReservationInvalidStateException ex = assertThrows(ReservationInvalidStateException.class, () ->
                checkoutService.createCheckoutRequest("lan@demo.vn", 100L, request));
        assertTrue(ex.getMessage().contains("bắt đầu thuê"));
    }

    @Test
    @DisplayName("Ném ReservationInvalidStateException khi ngày hẹn trả đè lên đơn đặt chỗ kế tiếp trên cùng ô kho")
    void testCreateCheckoutRequest_ConflictWithNextReservation() {
        LocalDate today = LocalDate.now(ICT_ZONE);
        LocalDate requestedDate = today.plusDays(20);
        CreateCheckoutRequest request = new CreateCheckoutRequest(requestedDate, "MORNING", null);

        Reservation nextReservation = new Reservation();
        nextReservation.setReservationId(101L);
        nextReservation.setCode("BK-2026-0002");
        nextReservation.setStartDate(today.plusDays(20)); // Cùng ngày hoặc buffer đè lên
        nextReservation.setStatus(Reservation.Status.RESERVED);

        when(userRepository.findByEmailIgnoreCase("lan@demo.vn")).thenReturn(Optional.of(customer));
        when(reservationRepository.findWithDetailsById(100L)).thenReturn(Optional.of(reservation));
        when(reservationRepository.findActiveReservationsForUnit(eq(1L), any()))
                .thenReturn(List.of(reservation, nextReservation));
        when(rentalPolicyRepository.findByStatus(1)).thenReturn(Optional.of(policy));
        when(policyRuleRepository.findByPolicy_PolicyId(1)).thenReturn(List.of(bufferRule));

        ReservationInvalidStateException ex = assertThrows(ReservationInvalidStateException.class, () ->
                checkoutService.createCheckoutRequest("lan@demo.vn", 100L, request));
        assertTrue(ex.getMessage().contains("xung đột"));
    }

    @Test
    @DisplayName("Hủy checkout request thành công: trạng thái hoàn về CHECKED_IN, task bị hủy, request PENDING bị CANCELLED")
    void testCancelCheckoutRequest_Success() {
        reservation.setStatus(Reservation.Status.CHECKOUT_REQUESTED);

        CheckoutRequest pendingReq = new CheckoutRequest();
        pendingReq.setRequestId(600L);
        pendingReq.setStatus(CheckoutRequest.Status.PENDING);

        when(userRepository.findByEmailIgnoreCase("lan@demo.vn")).thenReturn(Optional.of(customer));
        when(reservationRepository.findWithDetailsById(100L)).thenReturn(Optional.of(reservation));
        when(checkoutRequestRepository.findByReservation_ReservationIdAndStatus(100L, CheckoutRequest.Status.PENDING))
                .thenReturn(List.of(pendingReq));

        Reservation revertedRes = new Reservation();
        revertedRes.setReservationId(100L);
        revertedRes.setStatus(Reservation.Status.CHECKED_IN);
        when(reservationService.revertFromCheckoutRequested(eq(customer), eq(100L), any()))
                .thenReturn(revertedRes);

        NotificationEventResponse notif = new NotificationEventResponse(
                "CHECKOUT_REQUEST_CANCELLED", "Title", "Body", "/rentals/100"
        );
        when(notificationService.notifyCheckoutRequestCancelled(revertedRes)).thenReturn(notif);

        CancelCheckoutResponse response = checkoutService.cancelCheckoutRequest("lan@demo.vn", 100L);

        assertNotNull(response);
        assertEquals(100L, response.reservationId());
        assertEquals("CHECKED_IN", response.reservationStatus());
        assertEquals("CHECKOUT_REQUEST_CANCELLED", response.notification().type());

        assertEquals(CheckoutRequest.Status.CANCELLED, pendingReq.getStatus());
        verify(checkoutRequestRepository).save(pendingReq);
        verify(reservationService).revertFromCheckoutRequested(eq(customer), eq(100L), any());
        verify(taskService).cancelCheckoutTask(customer, reservation.getCode());
        verify(notificationService).notifyCheckoutRequestCancelled(revertedRes);
    }

    @Test
    @DisplayName("Hủy checkout request thất bại khi trạng thái đơn không phải CHECKOUT_REQUESTED")
    void testCancelCheckoutRequest_FailsWhenNotCheckoutRequested() {
        reservation.setStatus(Reservation.Status.CHECKED_IN);

        when(userRepository.findByEmailIgnoreCase("lan@demo.vn")).thenReturn(Optional.of(customer));
        when(reservationRepository.findWithDetailsById(100L)).thenReturn(Optional.of(reservation));

        ReservationInvalidStateException ex = assertThrows(ReservationInvalidStateException.class, () ->
                checkoutService.cancelCheckoutRequest("lan@demo.vn", 100L));
        assertTrue(ex.getMessage().contains("yêu cầu trả kho"));
    }

    @Test
    @DisplayName("getLatestCheckoutRequest trả về request PENDING mới nhất")
    void testGetLatestCheckoutRequest_Success() {
        CheckoutRequest req = new CheckoutRequest();
        req.setRequestId(701L);
        req.setStatus(CheckoutRequest.Status.PENDING);
        req.setRequestedDate(LocalDate.of(2026, 11, 1));

        when(userRepository.findByEmailIgnoreCase("lan@demo.vn")).thenReturn(Optional.of(customer));
        when(reservationRepository.findWithDetailsById(100L)).thenReturn(Optional.of(reservation));
        when(checkoutRequestRepository.findFirstByReservation_ReservationIdAndStatusOrderByCreatedAtDesc(
                100L, CheckoutRequest.Status.PENDING)).thenReturn(Optional.of(req));

        CheckoutRequestResponse response = checkoutService.getLatestCheckoutRequest("lan@demo.vn", 100L);

        assertNotNull(response);
        assertEquals(701L, response.requestId());
        assertEquals(LocalDate.of(2026, 11, 1), response.requestedDate());
        assertEquals("PENDING", response.status());
    }
}
