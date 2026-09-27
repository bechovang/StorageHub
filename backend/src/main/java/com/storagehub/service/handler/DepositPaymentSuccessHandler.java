package com.storagehub.service.handler;

import com.storagehub.dto.notification.NotificationEventResponse;
import com.storagehub.entity.Contract;
import com.storagehub.entity.Payment;
import com.storagehub.entity.Reservation;
import com.storagehub.service.ContractService;
import com.storagehub.service.LogService;
import com.storagehub.service.NotificationService;
import com.storagehub.service.ReservationService;
import org.springframework.stereotype.Component;

/**
 * FR-5/FR-10: Deposit thành công → Reservation RESERVED (qua ReservationService
 * — owner), contract auto-draft (FR-13 qua ContractService US-11 của Phúc),
 * notification + ActivityLog cùng transaction. Handler chỉ chạy khi payment
 * transition → SUCCEEDED trong lock (PESSIMISTIC_WRITE) nên đúng 1 lần.
 */
@Component
public class DepositPaymentSuccessHandler implements PaymentSuccessHandler {

    private final ReservationService reservationService;
    private final ContractService contractService;
    private final NotificationService notificationService;
    private final LogService logService;

    public DepositPaymentSuccessHandler(
            ReservationService reservationService,
            ContractService contractService,
            NotificationService notificationService,
            LogService logService
    ) {
        this.reservationService = reservationService;
        this.contractService = contractService;
        this.notificationService = notificationService;
        this.logService = logService;
    }

    @Override
    public boolean supports(Payment.Purpose purpose) {
        return purpose == Payment.Purpose.DEPOSIT;
    }

    @Override
    public PaymentSuccessOutcome onSuccess(Payment payment) {
        Reservation reservation = payment.getReservation();
        reservationService.markDepositPaid(reservation);

        Contract contract = contractService.autoDraftContract(reservation);

        NotificationEventResponse notification =
                notificationService.notifyReservationConfirmed(reservation, payment);

        logService.log(
                payment.getPayer(),
                "PAYMENT",
                payment.getPaymentId(),
                "PAYMENT_SUCCEEDED",
                null,
                "SUCCEEDED",
                "Deposit " + payment.getReceiptCode()
                        + " via " + payment.getMethod()
        );
        logService.log(
                payment.getPayer(),
                "RESERVATION",
                reservation.getReservationId(),
                "STATUS_CHANGED",
                "PENDING_PAYMENT",
                "RESERVED",
                "Deposit paid — " + payment.getReceiptCode()
        );

        return new PaymentSuccessOutcome(contract, notification);
    }
}
