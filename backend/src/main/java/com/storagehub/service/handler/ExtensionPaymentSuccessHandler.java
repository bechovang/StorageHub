package com.storagehub.service.handler;

import com.storagehub.dto.notification.NotificationEventResponse;
import com.storagehub.entity.Extension;
import com.storagehub.entity.Payment;
import com.storagehub.entity.Reservation;
import com.storagehub.service.ExtensionDepositService;
import com.storagehub.service.ExtensionService;
import com.storagehub.service.LogService;
import org.springframework.stereotype.Component;

/**
 * EXTENSION_DEPOSIT SUCCEEDED → giữ kỳ thuê, sinh Addendum + Task CONTRACT.
 * 100% rent của phần gia hạn được thu tại quầy khi staff ký phụ lục.
 */
@Component
public class ExtensionPaymentSuccessHandler implements PaymentSuccessHandler {

    private final ExtensionService extensionService;
    private final ExtensionDepositService extensionDepositService;
    private final LogService logService;

    public ExtensionPaymentSuccessHandler(
            ExtensionService extensionService,
            ExtensionDepositService extensionDepositService,
            LogService logService
    ) {
        this.extensionService = extensionService;
        this.extensionDepositService = extensionDepositService;
        this.logService = logService;
    }

    @Override
    public boolean supports(Payment.Purpose purpose) {
        return purpose == Payment.Purpose.EXTENSION_DEPOSIT;
    }

    @Override
    public PaymentSuccessOutcome onSuccess(Payment payment) {
        Reservation reservation = payment.getReservation();
        Extension extension = extensionService.pendingExtensionFor(reservation.getReservationId());
        NotificationEventResponse notification =
                extensionDepositService.applyDeposit(payment.getPayer(), reservation, extension);

        logService.log(
                payment.getPayer(),
                "PAYMENT",
                payment.getPaymentId(),
                "PAYMENT_SUCCEEDED",
                null,
                "SUCCEEDED",
                "Extension deposit " + payment.getReceiptCode()
                        + " via " + payment.getMethod()
        );

        return new PaymentSuccessOutcome(null, notification);
    }
}
