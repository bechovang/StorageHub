package com.storagehub.service;

import com.storagehub.dto.checkout.LateCheckoutInfo;
import com.storagehub.entity.Contract;
import com.storagehub.entity.Reservation;
import com.storagehub.entity.Role;
import com.storagehub.entity.Settlement;
import com.storagehub.entity.User;
import com.storagehub.exception.BusinessRuleException;
import com.storagehub.exception.ReservationNotFoundException;
import com.storagehub.repository.ReservationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.Locale;

/**
 * V42: thanh lý hợp đồng do quá hạn hoặc vi phạm.
 * Đóng reservation/contract, tạo settlement LIQUIDATION (refund=0), hủy checkout task,
 * tạo CLEANING task và khóa kho đến khi dọn xong. Không thu tiền bán hàng.
 */
@Service
@RequiredArgsConstructor
public class CheckoutLiquidationService {

    private static final ZoneId ICT_ZONE = ZoneId.of("Asia/Ho_Chi_Minh");

    private final ReservationRepository reservationRepository;
    private final ReservationService reservationService;
    private final ContractService contractService;
    private final UnitService unitService;
    private final TaskService taskService;
    private final CheckoutService checkoutService;
    private final LateCheckoutService lateCheckoutService;
    private final NotificationService notificationService;
    private final LogService logService;

    @Transactional
    public Reservation liquidate(User manager, Long reservationId, String reasonType, String reason) {
        requireManager(manager);
        if (reason == null || reason.isBlank()) {
            throw new BusinessRuleException("Lý do thanh lý là bắt buộc.");
        }
        Reservation reservation = reservationRepository.findWithDetailsById(reservationId)
                .orElseThrow(ReservationNotFoundException::new);
        assertFacility(manager, reservation);

        if (reservation.getStatus() == Reservation.Status.CLOSED) {
            throw new BusinessRuleException("Đơn đã đóng — không thể thanh lý lại.");
        }
        if (reservation.getStatus() != Reservation.Status.CHECKED_IN
                && reservation.getStatus() != Reservation.Status.CHECKOUT_REQUESTED) {
            throw new BusinessRuleException("Chỉ đơn đang thuê mới được thanh lý.");
        }

        lateCheckoutService.evaluate(reservation);
        LateCheckoutInfo info = lateCheckoutService.info(reservation);
        String type = normalizeReasonType(reasonType);

        String note = "THANH LÝ " + reservation.getCode()
                + " · Lý do: " + reason
                + " · Trễ " + info.daysLate() + " ngày, phí trễ " + info.lateFee() + " ₫"
                + " · Cọc không hoàn"
                + (info.lateFee() > (reservation.getDepositAmount() != null
                        ? reservation.getDepositAmount().longValue() : 0L)
                        ? " · vượt cọc" : "")
                + " · Hàng còn lại: kiểm kê, xử lý theo quy trình";

        Contract contract = contractService.closeForLiquidation(manager, reservation, reason);
        if (contract == null) {
            throw new BusinessRuleException("Đơn chưa có hợp đồng — không thể lập biên bản thanh lý.");
        }

        Settlement settlement = checkoutService.createLiquidationSettlement(
                reservation,
                contract,
                manager,
                info.daysLate(),
                BigDecimal.valueOf(info.lateFee()),
                type,
                note
        );

        reservationService.closeForLiquidation(manager, reservationId, reason);
        unitService.markPreparingForCleaning(manager, reservation.getUnit(), note);
        taskService.cancelCheckoutTask(manager, reservation.getCode());
        taskService.createCleaningTask(manager, reservation, note, LocalDate.now(ICT_ZONE));
        lateCheckoutService.markLiquidated(reservation, manager, settlement.getSettlementId(), reason);
        notificationService.notifyLiquidation(reservation, type, BigDecimal.valueOf(info.lateFee()));
        logService.log(manager, "RESERVATION", reservationId,
                "LIQUIDATED", null, "CLOSED",
                note + " · Settlement " + settlement.getReceiptCode());
        return reservation;
    }

    private void requireManager(User user) {
        if (user == null || (user.getRole().getName() != Role.Name.FACILITY_MANAGER
                && user.getRole().getName() != Role.Name.SYSTEM_ADMIN)) {
            throw new AccessDeniedException("Chỉ quản lý cơ sở mới được thanh lý hợp đồng.");
        }
    }

    private void assertFacility(User manager, Reservation reservation) {
        if (manager.getRole().getName() == Role.Name.SYSTEM_ADMIN
                || manager.getFacility() == null
                || reservation.getUnit().getZone() == null
                || reservation.getUnit().getZone().getFacility() == null) {
            return;
        }
        if (!manager.getFacility().getFacilityId().equals(
                reservation.getUnit().getZone().getFacility().getFacilityId())) {
            throw new AccessDeniedException("Đơn thuộc cơ sở khác.");
        }
    }

    private String normalizeReasonType(String reasonType) {
        String type = reasonType == null ? "OTHER" : reasonType.trim().toUpperCase(Locale.ROOT);
        if (!type.equals("OVERDUE") && !type.equals("VIOLATION") && !type.equals("OTHER")) {
            throw new BusinessRuleException("reasonType phải là OVERDUE / VIOLATION / OTHER.");
        }
        return type;
    }
}
