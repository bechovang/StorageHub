package com.storagehub.service.handler;

import com.storagehub.dto.notification.NotificationEventResponse;
import com.storagehub.entity.Contract;
import com.storagehub.entity.Payment;
import com.storagehub.entity.Reservation;
import com.storagehub.service.ContractService;
import com.storagehub.service.LogService;
import com.storagehub.service.NotificationService;
import com.storagehub.service.ReservationService;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.stereotype.Component;

/**
 * FR-5/FR-10: Deposit thành công → Reservation RESERVED (qua ReservationService
 * — owner), contract draft (qua ContractService của US-11 — chưa merge thì bỏ
 * qua), notification + ActivityLog cùng transaction.
 */
@Component
public class DepositPaymentSuccessHandler implements PaymentSuccessHandler {

    private final ReservationService reservationService;
    private final NotificationService notificationService;
    private final LogService logService;
    private final ObjectProvider<ContractService> contractService;

    public DepositPaymentSuccessHandler(
            ReservationService reservationService,
            NotificationService notificationService,
            LogService logService,
            ObjectProvider<ContractService> contractService
    ) {
        this.reservationService = reservationService;
        this.notificationService = notificationService;
        this.logService = logService;
        this.contractService = contractService;
    }

    @Override
    public boolean supports(Payment.Purpose purpose) {
        return purpose == Payment.Purpose.DEPOSIT;
    }

    @Override
    public PaymentSuccessOutcome onSuccess(Payment payment) {
        Reservation reservation = payment.getReservation();
        reservationService.markDepositPaid(reservation);

        // Contract draft qua owner service — US-11 (Phúc) chưa merge thì bỏ qua.
        Contract contract = null;
        ContractService contractSvc = contractService.getIfAvailable();
        if (contractSvc != null) {
            contract = contractSvc.draftDepositContract(reservation, payment);
        }

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
