package com.storagehub.dto.payment;

import com.storagehub.entity.Payment;

import java.time.Instant;

/**
 * Response createPayment + getPayment (FE poll) — schema PaymentSession (openapi.yaml).
 * otpExpiresAt/qrExpiresAt/qrPayload/otpRequired do mock gateway trả (state in-memory).
 */
public record PaymentSessionResponse(
        Long id,
        Long reservationId,
        Payment.Purpose purpose,
        Payment.Method method,
        long amount,
        Payment.Status status,
        boolean otpRequired,
        Instant otpExpiresAt,
        String qrPayload,
        Instant qrExpiresAt,
        String receiptCode,
        Instant paidAt,
        Instant createdAt
) {

    /**
     * reservationId truyền tường minh (caller đã có sẵn) — tránh lazy load
     * Payment.reservation ngoài transaction.
     */
    public static PaymentSessionResponse from(
            Payment payment,
            Long reservationId,
            GatewaySessionView gatewayView
    ) {
        return new PaymentSessionResponse(
                payment.getPaymentId(),
                reservationId,
                payment.getPurpose(),
                payment.getMethod(),
                payment.getAmount().longValueExact(),
                payment.getStatus(),
                gatewayView != null && gatewayView.otpRequired(),
                gatewayView == null ? null : gatewayView.otpExpiresAt(),
                gatewayView == null ? null : gatewayView.qrPayload(),
                gatewayView == null ? null : gatewayView.qrExpiresAt(),
                // Receipt chỉ hiển thị khi SUCCEEDED (schema: "Sinh khi SUCCEEDED")
                payment.getStatus() == Payment.Status.SUCCEEDED
                        ? payment.getReceiptCode()
                        : null,
                // TODO US sau: paidAt cần cột DB (derive-on-read tạm null)
                null,
                payment.getCreatedAt().toInstant(java.time.ZoneOffset.UTC)
        );
    }

    /** Trường hiển thị gateway cấp cho session đang mở (mock in-memory). */
    public record GatewaySessionView(
            boolean otpRequired,
            Instant otpExpiresAt,
            String qrPayload,
            Instant qrExpiresAt
    ) {
    }
}
