package com.storagehub.dto.checkout;

import java.time.LocalDate;

/** Trạng thái trễ checkout suy diễn on-read (AD-4) + phí phạt tạm tính. */
public record LateCheckoutInfo(
        int daysLate,
        long dailyRent,
        int lateFeePercent,
        long lateFee,
        int escalationThresholdDays,
        LocalDate effectiveDueDate,
        String caseStatus,
        LocalDate extendedUntil,
        boolean canSettle,
        String blockMessage
) {
    @com.fasterxml.jackson.annotation.JsonIgnore
    public boolean isLate() {
        return daysLate > 0;
    }
}
