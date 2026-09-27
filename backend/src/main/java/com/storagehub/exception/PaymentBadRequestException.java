package com.storagehub.exception;

/** 400 VALIDATION_FAILED — request thiếu dữ liệu theo method (card/momoPhone). */
public class PaymentBadRequestException extends RuntimeException {

    public PaymentBadRequestException(String message) {
        super(message);
    }
}
