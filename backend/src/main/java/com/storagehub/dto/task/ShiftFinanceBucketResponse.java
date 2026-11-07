package com.storagehub.dto.task;

import com.storagehub.entity.StaffAssignment;

/** Một ca: tổng thu quầy + tổng hoàn cọc (nếu có). */
public record ShiftFinanceBucketResponse(
        StaffAssignment.Shift shift,
        long collected,
        long refunded
) {
}
