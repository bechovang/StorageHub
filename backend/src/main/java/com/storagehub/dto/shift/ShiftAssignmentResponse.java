package com.storagehub.dto.shift;

import com.storagehub.entity.StaffAssignment;
import com.storagehub.entity.UnitType;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

public record ShiftAssignmentResponse(
        Long assignmentId,
        Long staffId,
        String staffName,
        String staffCode,
        List<Integer> unitTypeIds,
        List<String> unitTypeNames,
        List<String> unitTypeLabels,
        StaffAssignment.Shift shift,
        LocalDate workDate,
        LocalDateTime createdAt
) {
    public static ShiftAssignmentResponse fromEntity(StaffAssignment assignment) {
        String staffName = assignment.getStaff() != null ? assignment.getStaff().getFullName() : "";
        String staffCode = assignment.getStaff() != null ? ("KC-" + assignment.getStaff().getUserId()) : "";
        List<UnitType> types = assignment.getUnitTypes() == null
                ? List.of()
                : assignment.getUnitTypes().stream().toList();

        return new ShiftAssignmentResponse(
                assignment.getAssignmentId(),
                assignment.getStaff() != null ? assignment.getStaff().getUserId() : null,
                staffName,
                staffCode,
                types.stream().map(UnitType::getTypeId).toList(),
                types.stream().map(UnitType::getName).toList(),
                types.stream().map(t -> "Kho " + t.getName()).toList(),
                assignment.getShift(),
                assignment.getWorkDate(),
                assignment.getCreatedAt()
        );
    }

    public ShiftAssignmentResponse(
            Long assignmentId, Long staffId, String staffName, String staffCode,
            Integer unitTypeId, String unitTypeName, String unitTypeLabel,
            StaffAssignment.Shift shift, LocalDate workDate, java.time.LocalDateTime createdAt
    ) {
        this(assignmentId, staffId, staffName, staffCode,
                java.util.List.of(unitTypeId),
                java.util.List.of(unitTypeName),
                java.util.List.of(unitTypeLabel),
                shift, workDate, createdAt);
    }

    public Integer unitTypeId() {
        return unitTypeIds == null || unitTypeIds.isEmpty() ? null : unitTypeIds.get(0);
    }

    public String unitTypeName() {
        return unitTypeNames == null || unitTypeNames.isEmpty() ? null : unitTypeNames.get(0);
    }

    public String unitTypeLabel() {
        return unitTypeLabels == null || unitTypeLabels.isEmpty() ? null : unitTypeLabels.get(0);
    }
}
