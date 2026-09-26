package com.storagehub.exception;

/** 409 PAYMENT_INVALID_STATE — sai phase thanh toán hoặc giao dịch đã terminal (openapi.yaml). */
public class PaymentInvalidStateException extends RuntimeException {

    public PaymentInvalidStateException() {
        super("Giao dịch này đã kết thúc.");
    }

    public PaymentInvalidStateException(String message) {
        super(message);
    }
}
