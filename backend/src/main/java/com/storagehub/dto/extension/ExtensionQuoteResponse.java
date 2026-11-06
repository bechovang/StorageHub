package com.storagehub.dto.extension;

import com.fasterxml.jackson.annotation.JsonFormat;

import java.time.LocalDate;

/**
 * US-18 (FR-16): bảng tính gia hạn server-truth. Online chỉ thu chênh lệch cọc;
 * 100% tiền thuê phần gia hạn được thu tại quầy khi ký phụ lục.
 */
public record ExtensionQuoteResponse(
        Long extensionId,
        @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd")
        LocalDate oldEndDate,
        @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd")
        LocalDate newEndDate,
        int addedDays,
        long extensionRent,
        long oldDeposit,
        long newDeposit,
        long depositDelta,
        String policyVersion,
        @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd")
        LocalDate latestNewCheckout
) {
}
