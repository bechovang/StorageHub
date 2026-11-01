package com.storagehub.dto.shift;

import com.storagehub.entity.StaffAssignment;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;

public record CreateShiftAssignmentRequest(
        @NotNull(message = "ID nhân viên không được để trống")
        Long staffId,

        @NotNull(message = "Loại kho phân công không được để trống")
        Integer unitTypeId,

        @NotNull(message = "Ca trực không được để trống")
        StaffAssignment.Shift shift,

        @NotNull(message = "Ngày làm việc không được để trống")
        LocalDate workDate
) {}
