package com.storagehub.service.handler;

import com.storagehub.dto.notification.NotificationEventResponse;
import com.storagehub.entity.Contract;
import com.storagehub.entity.Payment;

/**
 * Kích hoạt nghiệp vụ sau khi payment terminal SUCCEEDED — chạy trong cùng
 * transaction của PaymentService (arch spine: state machine ở service, AD-4).
 * Mỗi purpose đúng 1 handler; service guard chỉ chạy handler 1 lần.
 */
public interface PaymentSuccessHandler {

    boolean supports(Payment.Purpose purpose);

    /**
     * @return outcome cho response (contract draft, notification event);
     *         chạy trong transaction — ném exception sẽ rollback toàn bộ.
     */
    PaymentSuccessOutcome onSuccess(Payment payment);

    record PaymentSuccessOutcome(
            Contract contract,
            NotificationEventResponse notification
    ) {
    }
}
