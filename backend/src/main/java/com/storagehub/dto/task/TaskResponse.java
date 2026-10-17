package com.storagehub.dto.task;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.storagehub.entity.StaffAssignment;
import com.storagehub.entity.Task;

import java.time.LocalDate;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record TaskResponse(
        Long taskId,
        Task.Type type,
        String refCode,
        String unitCode,
        String customerName,
        String customerPhone,
        String dueTime,
        Task.Status status,
        LocalDate workDate,
        StaffAssignment.Shift shift,
        String accessPin,
        Long rentAmount,
        Long depositPaid,
        String priority,
        String issueDescription,
        String alertNote,
        AssignedStaffDto assignedStaff,
        TaskRitualDto ritual
) {}
