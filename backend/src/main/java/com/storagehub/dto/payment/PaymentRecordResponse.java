package com.storagehub.dto.payment;

import com.storagehub.entity.Payment;

import java.time.Instant;

/** Schema PaymentRecord (openapi.yaml) — dùng trong list + PaymentResult. */
public record PaymentRecordResponse(
        Long id,
        Long reservationId,
        String receiptCode,
        Payment.Purpose purpose,
        Payment.Method method,
        long amount,
        Payment.Status status,
        Instant paidAt
) {

    public static PaymentRecordResponse from(Payment payment) {
        return new PaymentRecordResponse(
                payment.getPaymentId(),
                payment.getReservation().getReservationId(),
                payment.getStatus() == Payment.Status.SUCCEEDED
                        ? payment.getReceiptCode()
                        : null,
                payment.getPurpose(),
                payment.getMethod(),
                payment.getAmount().longValueExact(),
                payment.getStatus(),
                null // TODO US sau: paidAt cần cột DB
        );
    }
}
