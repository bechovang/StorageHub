package com.storagehub.dto.shift;

import java.util.List;

public record StaffRosterMember(
        Long staffId,
        String fullName,
        String email,
        String code,
        String roleLabel,
        String status,
        int shiftCount,
        int conflictCount,
        List<ShiftAssignmentResponse> shifts
) {}
