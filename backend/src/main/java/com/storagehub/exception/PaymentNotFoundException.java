package com.storagehub.exception;

/** 404 PAYMENT_NOT_FOUND — payment không tồn tại hoặc không thuộc user. */
public class PaymentNotFoundException extends RuntimeException {

    public PaymentNotFoundException() {
        super("Không tìm thấy giao dịch này.");
    }

    public PaymentNotFoundException(String message) {
        super(message);
    }
}
