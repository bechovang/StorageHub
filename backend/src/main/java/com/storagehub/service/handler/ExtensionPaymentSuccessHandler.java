package com.storagehub.service.handler;

import com.storagehub.dto.notification.NotificationEventResponse;
import com.storagehub.entity.ContractAddendum;
import com.storagehub.entity.Extension;
import com.storagehub.entity.Payment;
import com.storagehub.entity.Reservation;
import com.storagehub.service.ContractService;
import com.storagehub.service.ExtensionService;
import com.storagehub.service.LogService;
import com.storagehub.service.NotificationService;
import com.storagehub.service.ReservationService;
import org.springframework.stereotype.Component;

/**
 * US-18 (FR-16/FR-12): EXTENSION_FEE thành công → extension APPLIED, EndDate +
 * cọc giữ dịch ngay (ngày mới hiệu lực ngay khi thanh toán — đóng modal chưa
 * trả thì không ghi nhận gì), sinh addendum giấy CT-...-A{n} hẹn ký quầy 7 ngày,
 * notify hai bên (customer + staff) cùng ActivityLog — tất cả trong transaction
 * resolve() đang giữ lock payment nên handler chạy đúng 1 lần.
 */
@Component
public class ExtensionPaymentSuccessHandler implements PaymentSuccessHandler {

    private final ExtensionService extensionService;
    private final ReservationService reservationService;
    private final ContractService contractService;
    private final NotificationService notificationService;
    private final LogService logService;

    public ExtensionPaymentSuccessHandler(
            ExtensionService extensionService,
            ReservationService reservationService,
            ContractService contractService,
            NotificationService notificationService,
            LogService logService
    ) {
        this.extensionService = extensionService;
        this.reservationService = reservationService;
        this.contractService = contractService;
        this.notificationService = notificationService;
        this.logService = logService;
    }

    @Override
    public boolean supports(Payment.Purpose purpose) {
        return purpose == Payment.Purpose.EXTENSION_FEE;
    }

    @Override
    public PaymentSuccessOutcome onSuccess(Payment payment) {
        Reservation reservation = payment.getReservation();

        Extension extension = extensionService
                .pendingExtensionFor(reservation.getReservationId());
        extensionService.markApplied(payment.getPayer(), extension);

        ExtensionService.Breakdown breakdown =
                extensionService.breakdownFor(reservation, extension.getNewEndDate());

        // Owner tables qua service tương ứng (AD-6) — cùng transaction resolve().
        reservationService.markExtensionApplied(
                reservation, extension.getNewEndDate(), breakdown.newDepositHeld());

        ContractAddendum addendum = contractService.createAddendumForExtension(
                payment.getPayer(), reservation, extension,
                breakdown.depositTopUp(), breakdown.newDepositHeld());

        NotificationEventResponse notification =
                notificationService.notifyExtensionApplied(reservation, extension);
        notificationService.notifyAddendumAwaitingSignature(reservation, addendum);

        logService.log(
                payment.getPayer(),
                "PAYMENT",
                payment.getPaymentId(),
                "PAYMENT_SUCCEEDED",
                null,
                "SUCCEEDED",
                "Extension fee " + payment.getReceiptCode()
                        + " via " + payment.getMethod()
        );

        return new PaymentSuccessOutcome(null, notification);
    }
}
