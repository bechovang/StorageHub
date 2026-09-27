package com.storagehub.dto.payment;

import java.time.LocalDateTime;

/**
 * Record thanh toán theo schema PaymentRecord trong contracts/openapi.yaml.
 */
public record PaymentRecordResponse(
        Long id,
        Long reservationId,
        String receiptCode,
        String purpose,
        String method,
        Long amount,
        String status,
        LocalDateTime paidAt
) {
}
