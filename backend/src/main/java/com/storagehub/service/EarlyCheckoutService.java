package com.storagehub.service;

import com.storagehub.dto.checkout.ForcedCheckoutRequest;
import com.storagehub.dto.checkout.TransferRequest;
import com.storagehub.dto.checkout.TransferResponse;
import com.storagehub.entity.CheckoutRequest;
import com.storagehub.entity.Contract;
import com.storagehub.entity.Payment;
import com.storagehub.entity.Reservation;
import com.storagehub.entity.Role;
import com.storagehub.entity.Unit;
import com.storagehub.entity.User;
import com.storagehub.exception.BusinessRuleException;
import com.storagehub.exception.ReservationNotFoundException;
import com.storagehub.repository.CheckoutRequestRepository;
import com.storagehub.repository.ContractRepository;
import com.storagehub.repository.PaymentRepository;
import com.storagehub.repository.ReservationRepository;
import com.storagehub.repository.UnitRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.List;
import java.util.Locale;

/**
 * Early Checkout + Đổi kho (quyền FACILITY_MANAGER / SYSTEM_ADMIN):
 * - forcedCheckout: manager buộc checkout sớm. VIOLATION = đuổi vi phạm
 *   (cọc mất, không hoàn tiền ngày chưa dùng); TRANSFER = đổi kho (cọc +
 *   giá trị ngày chưa dùng chuyển sang đơn mới).
 * - transfer: checkout cũ (đóng reservation + unit về PREPARING) rồi tạo
 *   reservation mới RESERVED trên kho đích cho cùng khách, cọc chuyển thẳng,
 *   tiền thuê phần ngày chưa dùng ghi nhận một payment RENT chuyển đổi để
 *   check-in kho mới không phải thu lại.
 * Anti-overlap vẫn được kiểm tra trên kho đích như booking thường; kho cũ
 * về PREPARING — TURNOVER_BUFFER của kho đích áp qua check availability.
 */
@Service
@RequiredArgsConstructor
public class EarlyCheckoutService {

    private static final ZoneId ICT_ZONE = ZoneId.of("Asia/Ho_Chi_Minh");

    private final ReservationRepository reservationRepository;
    private final UnitRepository unitRepository;
    private final CheckoutRequestRepository checkoutRequestRepository;
    private final ContractRepository contractRepository;
    private final PaymentRepository paymentRepository;
    private final PricingEngine pricingEngine;
    private final ContractService contractService;
    private final TaskService taskService;
    private final NotificationService notificationService;
    private final LogService logService;

    @Transactional
    public Reservation forcedCheckout(User actor, Long reservationId, ForcedCheckoutRequest request) {
        Reservation reservation = reservationRepository.findWithDetailsById(reservationId)
                .orElseThrow(() -> new ReservationNotFoundException("Reservation not found."));

        if (reservation.getStatus() != Reservation.Status.CHECKED_IN) {
            throw new BusinessRuleException(
                    "Chỉ đơn đang CHECKED_IN mới buộc checkout sớm được (đơn hiện tại: "
                            + reservation.getStatus() + ").");
        }

        String type = request.checkoutType().trim().toUpperCase(Locale.ROOT);
        if (!type.equals("VIOLATION") && !type.equals("TRANSFER")) {
            throw new BusinessRuleException("checkoutType phải là VIOLATION hoặc TRANSFER.");
        }

        // CheckoutRequest đánh dấu lý do cho Settlement sau này
        CheckoutRequest cr = new CheckoutRequest();
        cr.setReservation(reservation);
        cr.setRequestedDate(LocalDate.now(ICT_ZONE));
        cr.setStatus(CheckoutRequest.Status.PENDING);
        cr.setCheckoutType(type);
        checkoutRequestRepository.save(cr);

        reservation.setStatus(Reservation.Status.CHECKOUT_REQUESTED);
        reservationRepository.save(reservation);

        String note = request.reason() != null && !request.reason().isBlank()
                ? request.reason()
                : (type.equals("VIOLATION") ? "Buộc trả kho do vi phạm chính sách" : "Đổi kho theo chỉ đạo quản lý");

        logService.log(actor, "RESERVATION", reservation.getReservationId(),
                "FORCED_CHECKOUT", "CHECKED_IN", "CHECKOUT_REQUESTED",
                "[" + type + "] " + note);
        if (type.equals("VIOLATION")) {
            logService.log(actor, "RESERVATION", reservation.getReservationId(),
                    "DEPOSIT_FORFEIT_MARKED", null, null,
                    "Cọc sẽ bị mất khi tất toán do vi phạm chính sách.");
        }
        notificationService.notifyForcedCheckout(reservation, type, note);
        return reservation;
    }

    @Transactional
    public TransferResponse transfer(User actor, TransferRequest request) {
        if (!isManager(actor)) {
            throw new AccessDeniedException("Chỉ quản lý cơ sở mới được đổi kho cho khách.");
        }

        Reservation oldReservation = reservationRepository.findWithDetailsById(request.reservationId())
                .orElseThrow(() -> new ReservationNotFoundException("Reservation not found."));
        if (oldReservation.getStatus() != Reservation.Status.CHECKED_IN
                && oldReservation.getStatus() != Reservation.Status.CHECKOUT_REQUESTED) {
            throw new BusinessRuleException(
                    "Chỉ đơn CHECKED_IN / CHECKOUT_REQUESTED mới đổi kho được.");
        }

        LocalDate newStart = request.newStartDate();
        LocalDate newEnd = request.newEndDate();
        if (newEnd == null || newStart == null || newEnd.isBefore(newStart)) {
            throw new BusinessRuleException("Khoảng ngày thuê kho mới không hợp lệ.");
        }

        Unit newUnit = unitRepository.findWithDetailsById(request.newUnitId())
                .orElseThrow(() -> new BusinessRuleException("Kho mới không tồn tại."));
        if (newUnit.getStatus() != Unit.Status.AVAILABLE && newUnit.getStatus() != Unit.Status.PREPARING) {
            throw new BusinessRuleException(
                    "Kho " + newUnit.getCode() + " hiện không trống (" + newUnit.getStatus() + ").");
        }
        if (newUnit.getUnitId().equals(oldReservation.getUnit().getUnitId())) {
            throw new BusinessRuleException("Kho mới trùng kho hiện tại.");
        }

        // Anti-overlap trên kho đích (cùng luật với booking thường)
        List<Reservation> actives = reservationRepository.findActiveReservationsForUnit(
                newUnit.getUnitId(),
                List.of(Reservation.Status.RESERVED, Reservation.Status.CHECKED_IN,
                        Reservation.Status.CHECKOUT_REQUESTED));
        for (Reservation res : actives) {
            if (!newStart.isAfter(res.getEndDate().plusDays(1))
                    && !res.getStartDate().isAfter(newEnd.plusDays(1))) {
                throw new BusinessRuleException(
                        "Kho " + newUnit.getCode() + " đã có lịch trùng khoảng ngày chọn"
                                + " (đơn " + res.getCode() + ").");
            }
        }

        // 1. Buộc checkout cũ (TRANSFER) nếu chưa
        if (oldReservation.getStatus() == Reservation.Status.CHECKED_IN) {
            forcedCheckout(actor, oldReservation.getReservationId(),
                    new ForcedCheckoutRequest("TRANSFER", "Đổi kho sang " + newUnit.getCode()));
        }

        // 2. Đóng đơn cũ + kho cũ về PREPARING (dọn dẹp)
        oldReservation.setStatus(Reservation.Status.CLOSED);
        reservationRepository.save(oldReservation);
        Unit oldUnit = oldReservation.getUnit();
        oldUnit.setStatus(Unit.Status.PREPARING);
        unitRepository.save(oldUnit);
        checkoutRequestRepository.findByReservation_ReservationIdOrderByCreatedAtDesc(
                        oldReservation.getReservationId()).stream()
                .filter(cr -> cr.getStatus() == CheckoutRequest.Status.PENDING)
                .forEach(cr -> {
                    cr.setStatus(CheckoutRequest.Status.DONE);
                    checkoutRequestRepository.save(cr);
                });
        contractRepository.findByReservation_ReservationId(oldReservation.getReservationId())
                .forEach(c -> {
                    if (c.getStatus() != Contract.Status.CLOSED
                            && c.getStatus() != Contract.Status.SUPERSEDED) {
                        c.setStatus(Contract.Status.CLOSED);
                        contractRepository.save(c);
                    }
                });

        // 3. Tạo đơn mới RESERVED, cọc chuyển thẳng từ đơn cũ
        var quote = pricingEngine.calculateQuote(newUnit, newStart, newEnd);
        Reservation newReservation = new Reservation();
        newReservation.setCode(generateReservationCode());
        newReservation.setCustomer(oldReservation.getCustomer());
        newReservation.setUnit(newUnit);
        newReservation.setStartDate(newStart);
        newReservation.setEndDate(newEnd);
        newReservation.setDepositAmount(oldReservation.getDepositAmount());
        newReservation.setStatus(Reservation.Status.RESERVED);
        Reservation savedNew = reservationRepository.save(newReservation);

        // 4. Ghi nhận tiền thuê phần ngày chưa dùng dưới dạng payment RENT đã
        //    trả (chuyển giá trị, không thu lại tiền) — check-in kho mới không
        //    phải thu lại. Receipt mã RT-TR-... rõ ràng là chuyển đổi nội bộ.
        Payment carried = new Payment();
        carried.setPayer(oldReservation.getCustomer());
        carried.setReservation(savedNew);
        carried.setPurpose(Payment.Purpose.RENT);
        carried.setMethod(Payment.Method.PAYOS);
        carried.setAmount(BigDecimal.valueOf(quote.totalRent()));
        carried.setStatus(Payment.Status.SUCCEEDED);
        carried.setReceiptCode("RT-TR-" + System.currentTimeMillis());
        paymentRepository.save(carried);

        // 5. Hợp đồng mới + task check-in cho kho mới
        contractService.autoDraftContract(savedNew);
        taskService.createCheckInTask(savedNew.getCustomer(), savedNew);

        logService.log(actor, "RESERVATION", savedNew.getReservationId(), "TRANSFER_CREATED",
                oldReservation.getCode(), savedNew.getCode(),
                "Đổi kho " + oldUnit.getCode() + " → " + newUnit.getCode()
                        + " (" + newStart + " → " + newEnd + "), cọc chuyển "
                        + oldReservation.getDepositAmount() + " ₫");

        return new TransferResponse(
                oldReservation.getReservationId(),
                oldReservation.getCode(),
                oldUnit.getCode(),
                savedNew.getReservationId(),
                savedNew.getCode(),
                newUnit.getCode(),
                savedNew.getStartDate(),
                savedNew.getEndDate(),
                oldReservation.getDepositAmount() != null
                        ? oldReservation.getDepositAmount().longValue() : 0L,
                quote.totalRent()
        );
    }

    private boolean isManager(User actor) {
        return actor.getRole() != null
                && (actor.getRole().getName() == Role.Name.FACILITY_MANAGER
                || actor.getRole().getName() == Role.Name.SYSTEM_ADMIN
                || actor.getRole().getName() == Role.Name.BUSINESS_OPS);
    }

    private synchronized String generateReservationCode() {
        int year = LocalDate.now(ICT_ZONE).getYear();
        long count = reservationRepository.count() + 1;
        String code = String.format("BK-%d-%04d", year, count);
        while (reservationRepository.existsByCode(code)) {
            count++;
            code = String.format("BK-%d-%04d", year, count);
        }
        return code;
    }
}
