package com.storagehub.dto.shift;

import com.storagehub.entity.StaffAssignment;
import java.time.LocalDate;
import java.time.LocalDateTime;

public record ShiftAssignmentResponse(
        Long assignmentId,
        Long staffId,
        String staffName,
        String staffCode,
        Integer unitTypeId,
        String unitTypeName,
        String unitTypeLabel,
        StaffAssignment.Shift shift,
        LocalDate workDate,
        LocalDateTime createdAt
) {
    public static ShiftAssignmentResponse fromEntity(StaffAssignment assignment) {
        String staffName = assignment.getStaff() != null ? assignment.getStaff().getFullName() : "";
        String staffCode = assignment.getStaff() != null ? ("KC-" + assignment.getStaff().getUserId()) : "";
        Integer typeId = assignment.getUnitType() != null ? assignment.getUnitType().getTypeId() : null;
        String typeName = assignment.getUnitType() != null ? assignment.getUnitType().getName() : "";
        String typeLabel = assignment.getUnitType() != null
                ? "Kho " + assignment.getUnitType().getName()
                : "";

        return new ShiftAssignmentResponse(
                assignment.getAssignmentId(),
                assignment.getStaff() != null ? assignment.getStaff().getUserId() : null,
                staffName,
                staffCode,
                typeId,
                typeName,
                typeLabel,
                assignment.getShift(),
                assignment.getWorkDate(),
                assignment.getCreatedAt()
        );
    }
}
