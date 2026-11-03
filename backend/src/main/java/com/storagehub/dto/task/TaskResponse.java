package com.storagehub.dto.task;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.storagehub.entity.StaffAssignment;
import com.storagehub.entity.Task;

import java.time.LocalDate;
import java.util.List;

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
        TaskRitualDto ritual,
        String paymentProofPhotoUrl,
        String contractPhotoUrl,
        String settlementPhotoUrl,
        List<TaskAssetDto> assets
) {
    public TaskResponse(
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
            TaskRitualDto ritual,
            String paymentProofPhotoUrl,
            String contractPhotoUrl,
            String settlementPhotoUrl
    ) {
        this(taskId, type, refCode, unitCode, customerName, customerPhone, dueTime,
                status, workDate, shift, accessPin, rentAmount, depositPaid, priority,
                issueDescription, alertNote, assignedStaff, ritual, paymentProofPhotoUrl,
                contractPhotoUrl, settlementPhotoUrl, null);
    }

    /** Constructor cũ cho test/consumer chưa cần ảnh ritual. */
    public TaskResponse(
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
    ) {
        this(taskId, type, refCode, unitCode, customerName, customerPhone, dueTime,
                status, workDate, shift, accessPin, rentAmount, depositPaid, priority,
                issueDescription, alertNote, assignedStaff, ritual, null, null, null, null);
    }
}
