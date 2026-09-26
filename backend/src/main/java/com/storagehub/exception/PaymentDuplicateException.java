package com.storagehub.exception;

/** 409 PAYMENT_DUPLICATE — khoản này đã có payment active/thành công (openapi.yaml). */
public class PaymentDuplicateException extends RuntimeException {

    public PaymentDuplicateException() {
        super("Khoản này đã được thanh toán.");
    }

    public PaymentDuplicateException(String message) {
        super(message);
    }
}
