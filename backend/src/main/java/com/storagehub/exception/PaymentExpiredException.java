package com.storagehub.exception;

/** 409 PAYMENT_EXPIRED — phiên QR/OTP hết hạn, phải tạo payment mới (openapi.yaml). */
public class PaymentExpiredException extends RuntimeException {

    public PaymentExpiredException() {
        super("Phiên thanh toán đã hết hạn (QR/OTP). Chọn lại phương thức để tiếp tục.");
    }

    public PaymentExpiredException(String message) {
        super(message);
    }
}
