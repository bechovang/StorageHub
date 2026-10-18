package com.storagehub.service.impl;

import com.storagehub.dto.checkout.CancelCheckoutResponse;
import com.storagehub.dto.checkout.CheckoutRequestResponse;
import com.storagehub.dto.checkout.CreateCheckoutRequest;
import com.storagehub.dto.notification.NotificationEventResponse;
import com.storagehub.entity.CheckoutRequest;
import com.storagehub.entity.PolicyRule;
import com.storagehub.entity.RentalPolicy;
import com.storagehub.entity.Reservation;
import com.storagehub.entity.Task;
import com.storagehub.entity.User;
import com.storagehub.exception.InvalidCredentialsException;
import com.storagehub.exception.ReservationInvalidStateException;
import com.storagehub.exception.ReservationNotFoundException;
import com.storagehub.repository.CheckoutRequestRepository;
import com.storagehub.repository.PolicyRuleRepository;
import com.storagehub.repository.RentalPolicyRepository;
import com.storagehub.repository.ReservationRepository;
import com.storagehub.repository.UserRepository;
import com.storagehub.service.CheckoutService;
import com.storagehub.service.LogService;
import com.storagehub.service.NotificationService;
import com.storagehub.service.ReservationService;
import com.storagehub.service.TaskService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.ZoneId;
import java.util.List;

@Service
@RequiredArgsConstructor
public class CheckoutServiceImpl implements CheckoutService {

    private final CheckoutRequestRepository checkoutRequestRepository;
    private final ReservationRepository reservationRepository;
    private final UserRepository userRepository;
    private final PolicyRuleRepository policyRuleRepository;
    private final RentalPolicyRepository rentalPolicyRepository;
    private final ReservationService reservationService;
    private final TaskService taskService;
    private final NotificationService notificationService;
    private final LogService logService;

    private static final ZoneId ICT_ZONE = ZoneId.of("Asia/Ho_Chi_Minh");

    @Override
    @Transactional
    public CheckoutRequestResponse createCheckoutRequest(
            String currentUserEmail,
            Long reservationId,
            CreateCheckoutRequest request
    ) {
        User user = userRepository.findByEmailIgnoreCase(currentUserEmail)
                .orElseThrow(InvalidCredentialsException::new);

        Reservation reservation = reservationRepository.findWithDetailsById(reservationId)
                .orElseThrow(ReservationNotFoundException::new);

        // 1. Kiểm tra quyền sở hữu (AD-5, US-20)
        if (!reservation.getCustomer().getUserId().equals(user.getUserId())) {
            throw new AccessDeniedException("Bạn không có quyền gửi yêu cầu trả kho cho đơn này.");
        }

        // 2. Kiểm tra trạng thái đơn thuê (phải là CHECKED_IN hoặc CHECKOUT_REQUESTED nếu update)
        Reservation.Status currentStatus = reservation.getStatus();
        if (currentStatus != Reservation.Status.CHECKED_IN && currentStatus != Reservation.Status.CHECKOUT_REQUESTED) {
            throw new ReservationInvalidStateException(
                    "Chỉ có thể gửi yêu cầu trả kho khi đơn đang ở trạng thái Đang thuê (CHECKED_IN)."
            );
        }

        LocalDate requestedDate = request.requestedDate();
        LocalDate today = LocalDate.now(ICT_ZONE);

        // 3. Kiểm tra ngày trả hợp lệ
        if (requestedDate.isBefore(today)) {
            throw new ReservationInvalidStateException("Ngày hẹn trả kho không thể ở trong quá khứ.");
        }

        if (requestedDate.isBefore(reservation.getStartDate())) {
            throw new ReservationInvalidStateException(
                    "Ngày hẹn trả kho không thể trước ngày bắt đầu thuê (" + reservation.getStartDate() + ")."
            );
        }

        // 4. Boundary check: không đè lên đơn đặt chỗ kế tiếp trên cùng ô kho (FR-17)
        List<Reservation> activeReservations = reservationRepository.findActiveReservationsForUnit(
                reservation.getUnit().getUnitId(),
                List.of(Reservation.Status.RESERVED, Reservation.Status.CHECKED_IN, Reservation.Status.CHECKOUT_REQUESTED)
        );

        Integer unitTypeId = (reservation.getUnit() != null && reservation.getUnit().getType() != null)
                ? reservation.getUnit().getType().getTypeId()
                : null;
        int bufferDays = getTurnoverBufferDays(unitTypeId);

        for (Reservation other : activeReservations) {
            if (!other.getReservationId().equals(reservation.getReservationId())
                    && other.getStartDate().isAfter(reservation.getStartDate())) {
                if (requestedDate.plusDays(bufferDays).isAfter(other.getStartDate())) {
                    throw new ReservationInvalidStateException(
                            String.format("Ngày hẹn trả kho bị xung đột với đơn đặt chỗ kế tiếp bắt đầu từ ngày %s (cần %d ngày đệm dọn dẹp kho).",
                                    other.getStartDate(), bufferDays)
                    );
                }
            }
        }

        // 5. "Request mới thay request cũ — request cũ tự hủy"
        List<CheckoutRequest> pendingRequests = checkoutRequestRepository
                .findByReservation_ReservationIdAndStatus(reservationId, CheckoutRequest.Status.PENDING);
        for (CheckoutRequest oldReq : pendingRequests) {
            oldReq.setStatus(CheckoutRequest.Status.CANCELLED);
            checkoutRequestRepository.save(oldReq);
            logService.log(
                    user,
                    "CHECKOUT_REQUEST",
                    oldReq.getRequestId(),
                    "CANCELLED",
                    "PENDING",
                    "CANCELLED",
                    "Tự hủy do có yêu cầu trả kho mới"
            );
        }

        // 6. Ghi bản ghi CheckoutRequest mới (CheckoutService là owner duy nhất của CHECKOUT_REQUESTS)
        CheckoutRequest newReq = new CheckoutRequest();
        newReq.setReservation(reservation);
        newReq.setRequestedDate(requestedDate);
        newReq.setStatus(CheckoutRequest.Status.PENDING);
        CheckoutRequest savedReq = checkoutRequestRepository.save(newReq);

        // 7. Chuyển trạng thái Reservation -> CHECKOUT_REQUESTED qua ReservationService (AD-6)
        Reservation updatedReservation = reservation;
        if (reservation.getStatus() != Reservation.Status.CHECKOUT_REQUESTED) {
            updatedReservation = reservationService.transitionToCheckoutRequested(
                    user,
                    reservationId,
                    request.reason()
            );
        }

        // 8. Tự động sinh/cập nhật thẻ Checkout Task cho staff qua TaskService (AD-6)
        Task task = taskService.createOrUpdateCheckoutTask(
                user,
                updatedReservation,
                requestedDate,
                request.timeSlot(),
                request.reason()
        );

        // 9. Sinh thông báo qua NotificationService (AD-6)
        NotificationEventResponse notification = notificationService.notifyCheckoutRequested(
                updatedReservation,
                requestedDate
        );

        // 10. Ghi ActivityLog cho request mới
        logService.log(
                user,
                "CHECKOUT_REQUEST",
                savedReq.getRequestId(),
                "CREATED",
                null,
                "PENDING",
                request.reason() != null && !request.reason().isBlank() ? request.reason() : "Khách gửi yêu cầu trả kho"
        );

        return new CheckoutRequestResponse(
                savedReq.getRequestId(),
                reservationId,
                savedReq.getRequestedDate(),
                request.timeSlot(),
                request.reason(),
                savedReq.getStatus().name(),
                savedReq.getCreatedAt(),
                updatedReservation.getStatus().name(),
                task != null ? task.getTaskId() : null,
                notification
        );
    }

    @Override
    @Transactional
    public CancelCheckoutResponse cancelCheckoutRequest(
            String currentUserEmail,
            Long reservationId
    ) {
        User user = userRepository.findByEmailIgnoreCase(currentUserEmail)
                .orElseThrow(InvalidCredentialsException::new);

        Reservation reservation = reservationRepository.findWithDetailsById(reservationId)
                .orElseThrow(ReservationNotFoundException::new);

        // 1. Kiểm tra quyền sở hữu (AD-5, US-20)
        if (!reservation.getCustomer().getUserId().equals(user.getUserId())) {
            throw new AccessDeniedException("Bạn không có quyền hủy yêu cầu trả kho cho đơn này.");
        }

        // 2. Kiểm tra trạng thái đơn thuê (phải là CHECKOUT_REQUESTED)
        if (reservation.getStatus() != Reservation.Status.CHECKOUT_REQUESTED) {
            throw new ReservationInvalidStateException("Đơn thuê không ở trạng thái yêu cầu trả kho.");
        }

        // 3. Chuyển các request PENDING thành CANCELLED
        List<CheckoutRequest> pendingRequests = checkoutRequestRepository
                .findByReservation_ReservationIdAndStatus(reservationId, CheckoutRequest.Status.PENDING);
        for (CheckoutRequest req : pendingRequests) {
            req.setStatus(CheckoutRequest.Status.CANCELLED);
            checkoutRequestRepository.save(req);
            logService.log(
                    user,
                    "CHECKOUT_REQUEST",
                    req.getRequestId(),
                    "CANCELLED",
                    "PENDING",
                    "CANCELLED",
                    "Khách hủy yêu cầu trả kho"
            );
        }

        // 4. Hoàn tác Reservation -> CHECKED_IN qua ReservationService (AD-6)
        Reservation updatedReservation = reservationService.revertFromCheckoutRequested(
                user,
                reservationId,
                "Khách hủy yêu cầu trả kho"
        );

        // 5. Hủy Checkout Task khỏi Task Board qua TaskService (AD-6)
        taskService.cancelCheckoutTask(user, reservation.getCode());

        // 6. Sinh thông báo qua NotificationService (AD-6)
        NotificationEventResponse notification = notificationService.notifyCheckoutRequestCancelled(updatedReservation);

        return new CancelCheckoutResponse(
                reservationId,
                updatedReservation.getStatus().name(),
                notification
        );
    }

    @Override
    @Transactional(readOnly = true)
    public CheckoutRequestResponse getLatestCheckoutRequest(
            String currentUserEmail,
            Long reservationId
    ) {
        User user = userRepository.findByEmailIgnoreCase(currentUserEmail)
                .orElseThrow(InvalidCredentialsException::new);

        Reservation reservation = reservationRepository.findWithDetailsById(reservationId)
                .orElseThrow(ReservationNotFoundException::new);

        if (!reservation.getCustomer().getUserId().equals(user.getUserId())) {
            throw new AccessDeniedException("Bạn không có quyền xem yêu cầu trả kho của đơn này.");
        }

        CheckoutRequest req = checkoutRequestRepository
                .findFirstByReservation_ReservationIdAndStatusOrderByCreatedAtDesc(
                        reservationId,
                        CheckoutRequest.Status.PENDING
                )
                .orElse(null);

        if (req == null) {
            return null;
        }

        return new CheckoutRequestResponse(
                req.getRequestId(),
                reservationId,
                req.getRequestedDate(),
                null,
                null,
                req.getStatus().name(),
                req.getCreatedAt(),
                reservation.getStatus().name(),
                null,
                null
        );
    }

    private int getTurnoverBufferDays(Integer unitTypeId) {
        if (unitTypeId == null) {
            return 1;
        }
        try {
            RentalPolicy activePolicy = rentalPolicyRepository.findByStatus(1).orElse(null);
            if (activePolicy != null) {
                List<PolicyRule> rules = policyRuleRepository.findByPolicy_PolicyId(activePolicy.getPolicyId());
                for (PolicyRule r : rules) {
                    if (r.getType() != null && unitTypeId.equals(r.getType().getTypeId())
                            && r.getRuleType() == PolicyRule.RuleType.TURNOVER_BUFFER) {
                        return r.getValue().intValue();
                    }
                }
            }
        } catch (Exception ignored) {
        }
        return 1;
    }
}
