package com.storagehub.dto.quote;

/**
 * Từng dòng trong bảng giá (QuoteLine theo contracts/openapi.yaml).
 * kind: RENT | SURCHARGE | DISCOUNT | DEPOSIT
 */
public record QuoteLineResponse(
        String kind,
        String code,
        String label,
        Long amount,
        boolean refundable
) {
}
