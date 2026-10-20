package com.storagehub.gateway;

import com.storagehub.entity.Payment;

import java.time.Instant;
import java.util.Optional;

/**
 * Cổng thanh toán (AD-9) — trả KẾT QUẢ, KHÔNG đụng database (arch spine).
 * CARD/MOMO/VNPAY đi MockPaymentGateway (demo); PAYOS đi PayOsPaymentGateway
 * (thật) qua PaymentGatewayRouter.
 */
public interface PaymentGateway {

    /** Khởi tạo phiên theo method — trả trạng thái ban đầu + trường hiển thị (QR/OTP). */
    InitiationResult initiate(InitiationCommand command);

    /**
     * FE poll GET gọi lại — trả terminal decision nếu gateway đã "xử lý xong"
     * hoặc phiên đã hết hạn; empty = giữ nguyên trạng thái.
     * method đi kèm để router chọn đúng gateway (không cần đọc DB ở tầng gateway).
     */
    Optional<Payment.Status> poll(Long paymentId, Payment.Method method);

    /** Bước 2 MoMo OTP — trả terminal SUCCEEDED/FAILED/EXPIRED (demo không dùng). */
    Payment.Status confirmOtp(Long paymentId, String otp);

    /** Trường hiển thị cho PaymentSession đang mở (qrPayload/otpExpiresAt/checkoutUrl). */
    Optional<SessionView> describe(Long paymentId, Payment.Method method);

    /**
     * Webhook của gateway (AD-9): verify chữ ký rồi trả event đã chuẩn hóa.
     * Gateway KHÔNG ghi DB — PaymentService là single writer (AD-4).
     * Empty khi gateway không có kênh webhook.
     */
    default Optional<WebhookEvent> verifyWebhook(String rawPayload) {
        return Optional.empty();
    }

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
            Instant otpExpiresAt,
            String qrPayload,
            Instant qrExpiresAt,
            String checkoutUrl
    ) {
    }

    /** Event webhook đã verify — paymentId suy ra từ orderCode của chính gateway. */
    record WebhookEvent(
            Long paymentId,
            boolean success,
            long amount
    ) {
    }
}
