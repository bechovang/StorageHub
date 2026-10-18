package com.storagehub.dto.task;

import com.storagehub.entity.StaffAssignment;
import com.storagehub.entity.Task;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;

public record CreateTaskRequest(
        @NotNull(message = "Loại task không được để trống")
        Task.Type type,
        Long unitId,
        String refCode,
        LocalDate workDate,
        StaffAssignment.Shift shift,
        String dueTime,
        String priority,
        String alertNote,
        String issueDescription
) {}
