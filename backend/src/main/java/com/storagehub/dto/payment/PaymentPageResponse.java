package com.storagehub.dto.payment;

import com.storagehub.entity.Payment;
import org.springframework.data.domain.Page;

import java.util.List;

/** Envelope phân trang AD-8 — schema PaymentPage (openapi.yaml). */
public record PaymentPageResponse(
        List<PaymentRecordResponse> items,
        int page,
        int pageSize,
        long total
) {

    public static PaymentPageResponse from(Page<Payment> page) {
        return new PaymentPageResponse(
                page.getContent().stream()
                        .map(PaymentRecordResponse::from)
                        .toList(),
                page.getNumber() + 1, // Spring 0-based → contract 1-based
                page.getSize(),
                page.getTotalElements()
        );
    }
}
