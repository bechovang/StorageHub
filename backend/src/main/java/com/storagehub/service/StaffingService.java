package com.storagehub.service;

import com.storagehub.dto.shift.CreateShiftAssignmentRequest;
import com.storagehub.dto.shift.ShiftAssignmentResponse;
import com.storagehub.dto.shift.StaffRosterMember;

import java.time.LocalDate;
import java.util.List;

/**
 * Service quản lý phân công ca trực và rà soát xung đột — FR-27 (AD-6).
 * Đảm bảo quy tắc người-ca-ngày không bị trùng lặp trước khi lưu.
 */
public interface StaffingService {

    List<ShiftAssignmentResponse> getShifts(
            LocalDate startDate,
            LocalDate endDate,
            Long staffId,
            Integer zoneId
    );

    ShiftAssignmentResponse createShiftAssignment(
            String actorEmail,
            CreateShiftAssignmentRequest request
    );

    void deleteShiftAssignment(
            String actorEmail,
            Long assignmentId
    );

    List<StaffRosterMember> getStaffRoster(
            LocalDate startDate,
            LocalDate endDate
    );
}
