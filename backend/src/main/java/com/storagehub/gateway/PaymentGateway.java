package com.storagehub.gateway;

import com.storagehub.entity.Payment;

import java.util.Optional;

/**
 * Cổng thanh toán (AD-9) — trả KẾT QUẢ, KHÔNG đụng database (arch spine).
 * Sprint 1: MockPaymentGateway; US-33 thêm PayOsPaymentGateway (webhook).
 */
public interface PaymentGateway {

    /** Khởi tạo phiên theo method — trả trạng thái ban đầu + trường hiển thị (QR/OTP). */
    InitiationResult initiate(InitiationCommand command);

    /**
     * FE poll GET gọi lại — trả terminal decision nếu mock đã "xử lý xong"
     * (CARD/VNPAY auto-complete) hoặc phiên đã hết hạn; empty = giữ nguyên trạng thái.
     */
    Optional<Payment.Status> poll(Long paymentId);

    /** Bước 2 MoMo OTP — trả terminal SUCCEEDED/FAILED/EXPIRED. */
    Payment.Status confirmOtp(Long paymentId, String otp);

    /** Trường hiển thị cho PaymentSession đang mở (qrPayload/otpExpiresAt...) — mock in-memory. */
    Optional<SessionView> describe(Long paymentId);

    record InitiationCommand(
            Long paymentId,
            Payment.Method method,
            String cardNumber,
            long amount
    ) {
    }

    record InitiationResult(
            Payment.Status initialStatus
    ) {
    }

    record SessionView(
            boolean otpRequired,
            java.time.Instant otpExpiresAt,
            String qrPayload,
            java.time.Instant qrExpiresAt
    ) {
    }
}
