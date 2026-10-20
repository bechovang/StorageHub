package com.storagehub.exception;

/**
 * Webhook thanh toán hỏng/không verify được (AD-9) — controller trả 400
 * PAYMENT_WEBHOOK_INVALID để PayOS biết callback bị từ chối.
 */
public class PaymentWebhookException extends RuntimeException {

    public PaymentWebhookException(String message) {
        super(message);
    }

    public PaymentWebhookException(String message, Throwable cause) {
        super(message, cause);
    }
}
