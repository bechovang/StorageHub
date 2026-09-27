package com.storagehub.service.handler;

import com.storagehub.entity.Payment;
import org.springframework.stereotype.Component;

/**
 * Skeleton cho US-15 (Sprint 2) — Sprint 1 purpose RENT bị chặn ở state-check
 * nên handler không bao giờ chạy; khi check-in task merge sẽ thêm: sinh access
 * code, CHECKED_IN, Unit RENTED, contract in.
 */
@Component
public class RentPaymentSuccessHandler implements PaymentSuccessHandler {

    private final com.storagehub.service.LogService logService;

    public RentPaymentSuccessHandler(com.storagehub.service.LogService logService) {
        this.logService = logService;
    }

    @Override
    public boolean supports(Payment.Purpose purpose) {
        return purpose == Payment.Purpose.RENT;
    }

    @Override
    public PaymentSuccessOutcome onSuccess(Payment payment) {
        // TODO US-15: ritual check-in (access code, CHECKED_IN, Unit RENTED...)
        logService.log(
                payment.getPayer(),
                "PAYMENT",
                payment.getPaymentId(),
                "PAYMENT_SUCCEEDED",
                null,
                "SUCCEEDED",
                "Rent " + payment.getReceiptCode() + " via " + payment.getMethod()
        );

        return new PaymentSuccessOutcome(null, null);
    }
}
