package com.storagehub.dto.extension;

import com.fasterxml.jackson.annotation.JsonFormat;

import java.time.LocalDate;

/**
 * US-18 (FR-16): bảng tính gia hạn server-truth + id extension chờ thanh toán.
 * FE (ExtensionModal) thay toàn bộ phép tính client bằng response này, rồi mở
 * Payment Modal với purpose EXTENSION_FEE — amount BE tự resolve đúng totalPayable.
 * latestNewCheckout null khi không có đơn đặt trước trên cùng unit (FR-16 boundary).
 */
public record ExtensionQuoteResponse(
        Long extensionId,
        @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd")
        LocalDate oldEndDate,
        @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd")
        LocalDate newEndDate,
        int addedMonths,
        long addedRent,
        long depositHeldCurrent,
        long depositTopUp,
        long newDepositHeld,
        long totalPayable,
        @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd")
        LocalDate latestNewCheckout,
        String policyVersion
) {
}
