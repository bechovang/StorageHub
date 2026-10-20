package com.storagehub.dto.shift;

import com.storagehub.entity.StaffAssignment;
import java.time.LocalDate;
import java.time.LocalDateTime;

public record ShiftAssignmentResponse(
        Long assignmentId,
        Long staffId,
        String staffName,
        String staffCode,
        Integer zoneId,
        String zoneCode,
        String zoneName,
        StaffAssignment.Shift shift,
        LocalDate workDate,
        LocalDateTime createdAt
) {
    public static ShiftAssignmentResponse fromEntity(StaffAssignment assignment) {
        String staffName = assignment.getStaff() != null ? assignment.getStaff().getFullName() : "";
        String staffCode = assignment.getStaff() != null ? ("KC-" + assignment.getStaff().getUserId()) : "";
        Integer zoneId = assignment.getZone() != null ? assignment.getZone().getZoneId() : null;
        String zoneCode = assignment.getZone() != null ? assignment.getZone().getCode() : "";
        String zoneName = assignment.getZone() != null ? ("Zone " + assignment.getZone().getCode()) : "";

        return new ShiftAssignmentResponse(
                assignment.getAssignmentId(),
                assignment.getStaff() != null ? assignment.getStaff().getUserId() : null,
                staffName,
                staffCode,
                zoneId,
                zoneCode,
                zoneName,
                assignment.getShift(),
                assignment.getWorkDate(),
                assignment.getCreatedAt()
        );
    }
}
