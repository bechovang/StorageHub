package com.storagehub.dto.payment;

import com.storagehub.entity.Payment;

import java.time.Instant;

/**
 * Record thanh toán theo schema PaymentRecord trong contracts/openapi.yaml.
 * receiptCode chỉ hiển thị khi SUCCEEDED (AD-9) — mapper tự ẩn.
 */
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
                resolveReservationId(payment),
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

    /**
     * Payment có thể gắn reservation / extension / settlement (CHECK: đúng 1 nguồn).
     * Extension và Settlement đều thuộc một reservation, nên trả về reservation gốc
     * thay vì NPE khi payment là phí gia hạn (reservation = null).
     */
    private static Long resolveReservationId(Payment payment) {
        if (payment.getReservation() != null) {
            return payment.getReservation().getReservationId();
        }
        if (payment.getExtension() != null && payment.getExtension().getReservation() != null) {
            return payment.getExtension().getReservation().getReservationId();
        }
        if (payment.getSettlement() != null && payment.getSettlement().getReservation() != null) {
            return payment.getSettlement().getReservation().getReservationId();
        }
        return null;
    }
}
