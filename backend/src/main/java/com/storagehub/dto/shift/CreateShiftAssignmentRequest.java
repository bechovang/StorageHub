package com.storagehub.dto.shift;

import com.storagehub.entity.StaffAssignment;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;
import java.util.List;

public record CreateShiftAssignmentRequest(
        @NotNull(message = "ID nhân viên không được để trống")
        Long staffId,

        @NotEmpty(message = "Chọn ít nhất một loại kho")
        List<Integer> unitTypeIds,

        @NotEmpty(message = "Chọn ít nhất một ca trực")
        List<StaffAssignment.Shift> shifts,

        @NotNull(message = "Ngày làm việc không được để trống")
        LocalDate workDate
) {
    /** Backward-compatible single type/shift (tests/legacy callers). */
    public CreateShiftAssignmentRequest(Long staffId, Integer unitTypeId,
                                        StaffAssignment.Shift shift, LocalDate workDate) {
        this(staffId, java.util.List.of(unitTypeId),
                java.util.List.of(shift), workDate);
    }
}
