package com.storagehub.dto.payment;

import com.storagehub.dto.notification.NotificationEventResponse;
import com.storagehub.dto.reservation.ReservationDetailResponse;
import com.storagehub.entity.Payment;

import java.time.Instant;

/**
 * Response confirmPayment — schema PaymentResult (openapi.yaml):
 * receipt/contract/notification nullable, chỉ có khi SUCCEEDED.
 */
public record PaymentResultResponse(
        PaymentRecordResponse payment,
        ReceiptResponse receipt,
        ReservationDetailResponse reservation,
        Object contract, // TODO US-11: ContractChainItem khi ContractService của Phúc merge
        NotificationEventResponse notification
) {

    public record ReceiptResponse(
            String receiptCode,
            long amount,
            Instant paidAt
    ) {

        public static ReceiptResponse from(Payment payment) {
            return new ReceiptResponse(
                    payment.getReceiptCode(),
                    payment.getAmount().longValueExact(),
                    payment.getCreatedAt().toInstant(java.time.ZoneOffset.UTC)
            );
        }
    }
}
