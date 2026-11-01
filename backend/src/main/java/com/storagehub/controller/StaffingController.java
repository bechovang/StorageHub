package com.storagehub.controller;

import com.storagehub.dto.shift.CreateShiftAssignmentRequest;
import com.storagehub.dto.shift.ShiftAssignmentResponse;
import com.storagehub.dto.shift.StaffRosterMember;
import com.storagehub.service.StaffingService;
import jakarta.validation.Valid;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

/**
 * Controller quản lý phân công ca trực & phát hiện xung đột — FR-27.
 * Dành cho Facility Manager và System Admin.
 */
@RestController
@RequestMapping("/api/v1/shifts")
public class StaffingController {

    private final StaffingService staffingService;

    public StaffingController(StaffingService staffingService) {
        this.staffingService = staffingService;
    }

    /**
     * Lấy danh sách phân ca trực theo khoảng ngày (FR-27).
     */
    @GetMapping
    public ResponseEntity<List<ShiftAssignmentResponse>> getShifts(
            @RequestParam(name = "startDate", required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(name = "endDate", required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(name = "staffId", required = false) Long staffId,
            @RequestParam(name = "unitTypeId", required = false) Integer unitTypeId
    ) {
        List<ShiftAssignmentResponse> list = staffingService.getShifts(startDate, endDate, staffId, unitTypeId);
        return ResponseEntity.ok(list);
    }

    /**
     * Phân công ca trực mới kèm phát hiện va chạm tự động (FR-27).
     */
    @PostMapping
    public ResponseEntity<List<ShiftAssignmentResponse>> createShiftAssignment(
            @Valid @RequestBody CreateShiftAssignmentRequest request,
            Authentication authentication
    ) {
        String actorEmail = authentication != null ? authentication.getName() : null;
        List<ShiftAssignmentResponse> created = staffingService.createShiftAssignments(actorEmail, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    /**
     * Hủy phân công ca trực (FR-27).
     */
    @DeleteMapping("/{assignmentId}")
    public ResponseEntity<Void> deleteShiftAssignment(
            @PathVariable("assignmentId") Long assignmentId,
            Authentication authentication
    ) {
        String actorEmail = authentication != null ? authentication.getName() : null;
        staffingService.deleteShiftAssignment(actorEmail, assignmentId);
        return ResponseEntity.noContent().build();
    }

    /**
     * Lấy danh sách nhân sự trực ca kèm thống kê tuần (FR-27 / F5-03).
     */
    @GetMapping("/roster")
    public ResponseEntity<List<StaffRosterMember>> getStaffRoster(
            @RequestParam(name = "startDate", required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(name = "endDate", required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate
    ) {
        List<StaffRosterMember> roster = staffingService.getStaffRoster(startDate, endDate);
        return ResponseEntity.ok(roster);
    }
}
