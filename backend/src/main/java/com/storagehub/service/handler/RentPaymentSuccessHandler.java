package com.storagehub.service.handler;

import com.storagehub.entity.Payment;
import com.storagehub.entity.Reservation;
import org.springframework.stereotype.Component;

/**
 * US-15 (FR-11/14/15): tiền thuê RENT trả đủ qua PayOS → KHÔNG tự cấp access
 * code (FR-11 bắt buộc ký hợp đồng tại quầy trước khi cấp). Handler chỉ:
 * 1) bell cho staff "khách đã trả đủ — sẵn sàng ritual check-in",
 * 2) thông báo cho khách mang CCCD ra quầy,
 * 3) ActivityLog PAYMENT_SUCCEEDED để truy vết.
 * Access code sinh tại ReservationService.applyCheckIn sau khi contract SIGNED.
 */
@Component
public class RentPaymentSuccessHandler implements PaymentSuccessHandler {

    private final com.storagehub.service.LogService logService;
    private final com.storagehub.service.NotificationService notificationService;

    public RentPaymentSuccessHandler(
            com.storagehub.service.LogService logService,
            com.storagehub.service.NotificationService notificationService
    ) {
        this.logService = logService;
        this.notificationService = notificationService;
    }

    @Override
    public boolean supports(Payment.Purpose purpose) {
        return purpose == Payment.Purpose.RENT;
    }

    @Override
    public PaymentSuccessOutcome onSuccess(Payment payment) {
        Reservation reservation = payment.getReservation();

        logService.log(
                payment.getPayer(),
                "PAYMENT",
                payment.getPaymentId(),
                "PAYMENT_SUCCEEDED",
                null,
                "SUCCEEDED",
                "Rent " + payment.getReceiptCode() + " via " + payment.getMethod()
                        + " — sẵn sàng ritual check-in tại quầy"
        );

        notificationService.notifyRentPaidReadyForCheckIn(reservation, payment);

        return new PaymentSuccessOutcome(null, null);
    }
}
