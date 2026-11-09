package com.storagehub.dto.task;

import java.time.LocalDate;
import java.util.List;

/**
 * Tiền thu tại quầy theo ca trong ngày — chỉ CASH/BANK/POS, không gồm
 * DEPOSIT/EXTENSION_DEPOSIT (escrow) và không gồm giao dịch online.
 */
public record ShiftFinanceSummaryResponse(
        LocalDate workDate,
        long totalCollected,
        long totalRefunded,
        List<ShiftFinanceBucketResponse> shifts
) {
}
