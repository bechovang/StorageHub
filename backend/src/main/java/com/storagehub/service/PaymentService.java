package com.storagehub.service;

import com.storagehub.dto.payment.ConfirmPaymentRequest;
import com.storagehub.dto.payment.CreatePaymentRequest;
import com.storagehub.dto.payment.PaymentPageResponse;
import com.storagehub.dto.payment.PaymentResultResponse;
import com.storagehub.dto.payment.PaymentSessionResponse;

/**
 * US-8 (FR-8/9, AD-9) — endpoint thanh toán dùng chung 4 purpose.
 * Amount do server tính (AD-11), outcome do gateway quyết, receipt sinh khi
 * SUCCEEDED, duplicate → 409 PAYMENT_DUPLICATE.
 */
public interface PaymentService {

    PaymentSessionResponse createPayment(String email, CreatePaymentRequest request);

    /** FE poll khi PROCESSING/PENDING — mock resolve terminal ngay tại đây. */
    PaymentSessionResponse getPayment(String email, Long paymentId);

    /** FR-9 — lịch sử payment/receipt, phân trang AD-8. */
    PaymentPageResponse listPayments(
            String email,
            Long reservationId,
            int page,
            int pageSize
    );

    /** Bước 2 MoMo OTP — terminal SUCCEEDED/FAILED; hết hạn → PAYMENT_EXPIRED. */
    PaymentResultResponse confirmPayment(
            String email,
            Long paymentId,
            ConfirmPaymentRequest request
    );

    /** POST /payments/webhooks/payos — verify ở gateway, state machine ở đây. */
    void handlePayOsWebhook(String rawPayload);

    /**
     * DEMO ONLY (payment.demo.skip-enabled=true, chỉ profile dev): bỏ qua
     * PayOS — đánh dấu payment SUCCEEDED và chạy handler như webhook thật.
     */
    PaymentSessionResponse demoCompletePayment(String email, Long paymentId);
}
