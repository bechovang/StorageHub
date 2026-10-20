package com.storagehub.exception;

/**
 * Cổng thanh toán ngoài (PayOS) lỗi mạng/HTTP — trả 502, không phải lỗi
 * nghiệp vụ của khách (AD-9).
 */
public class PaymentGatewayException extends RuntimeException {

    public PaymentGatewayException(String message, Throwable cause) {
        super(message, cause);
    }
}
