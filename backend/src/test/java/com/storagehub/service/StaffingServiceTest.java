package com.storagehub.service;

import com.storagehub.dto.shift.CreateShiftAssignmentRequest;
import com.storagehub.dto.shift.ShiftAssignmentResponse;
import com.storagehub.dto.shift.StaffRosterMember;
import com.storagehub.entity.Facility;
import com.storagehub.entity.Role;
import com.storagehub.entity.StaffAssignment;
import com.storagehub.entity.User;
import com.storagehub.entity.UnitType;
import com.storagehub.exception.ShiftConflictException;
import com.storagehub.exception.ShiftNotFoundException;
import com.storagehub.exception.UserNotFoundException;
import com.storagehub.repository.StaffAssignmentRepository;
import com.storagehub.repository.UserRepository;
import com.storagehub.repository.UnitTypeRepository;
import com.storagehub.service.impl.StaffingServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class StaffingServiceTest {

    @Mock
    private StaffAssignmentRepository staffAssignmentRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private UnitTypeRepository unitTypeRepository;

    @Mock
    private LogService logService;

    @InjectMocks
    private StaffingServiceImpl staffingService;

    private User manager;
    private User staffMinh;
    private UnitType typeS;
    private LocalDate workDate;

    @BeforeEach
    void setUp() {
        manager = new User();
        manager.setUserId(4L);
        manager.setEmail("tuan@demo.storagehub.vn");
        manager.setFullName("Phạm Tuấn");

        staffMinh = new User();
        staffMinh.setUserId(2L);
        staffMinh.setEmail("minh@demo.storagehub.vn");
        staffMinh.setFullName("Minh Nguyễn");

        Facility facility = new Facility();
        facility.setFacilityId(1);
        facility.setName("Tân Bình Depot");
        staffMinh.setFacility(facility);

        typeS = new UnitType();
        typeS.setTypeId(2);
        typeS.setName("S");

        workDate = LocalDate.of(2026, 10, 12);
    }

    @Test
    @DisplayName("FR-27: Phân công ca trực mới thành công khi không có va chạm lịch")
    void testCreateShiftAssignment_Success() {
        CreateShiftAssignmentRequest request = new CreateShiftAssignmentRequest(
                2L,
                2,
                StaffAssignment.Shift.MORNING,
                workDate
        );

        when(userRepository.findByEmailIgnoreCase("tuan@demo.storagehub.vn")).thenReturn(Optional.of(manager));
        when(userRepository.findById(2L)).thenReturn(Optional.of(staffMinh));
        when(unitTypeRepository.findById(2)).thenReturn(Optional.of(typeS));
        when(staffAssignmentRepository.findByStaff_UserIdAndWorkDateAndShift(2L, workDate, StaffAssignment.Shift.MORNING))
                .thenReturn(Optional.empty());

        StaffAssignment savedAssignment = new StaffAssignment();
        savedAssignment.setAssignmentId(101L);
        savedAssignment.setStaff(staffMinh);
        savedAssignment.setUnitType(typeS);
        savedAssignment.setShift(StaffAssignment.Shift.MORNING);
        savedAssignment.setWorkDate(workDate);

        when(staffAssignmentRepository.save(any(StaffAssignment.class))).thenReturn(savedAssignment);

        ShiftAssignmentResponse response = staffingService.createShiftAssignment("tuan@demo.storagehub.vn", request);

        assertNotNull(response);
        assertEquals(101L, response.assignmentId());
        assertEquals("Minh Nguyễn", response.staffName());
        assertEquals(StaffAssignment.Shift.MORNING, response.shift());
        assertEquals("S", response.unitTypeName());
        assertEquals(workDate, response.workDate());

        verify(staffAssignmentRepository, times(1)).save(any(StaffAssignment.class));
        verify(logService, times(1)).log(
                eq(manager),
                eq("STAFF_ASSIGNMENT"),
                eq(101L),
                eq("CREATED"),
                isNull(),
                eq("MORNING"),
                anyString()
        );
    }

    @Test
    @DisplayName("FR-27: Chặn va chạm lịch (conflict detection) trước khi lưu — ném ShiftConflictException")
    void testCreateShiftAssignment_ConflictThrowsException() {
        CreateShiftAssignmentRequest request = new CreateShiftAssignmentRequest(
                2L,
                2,
                StaffAssignment.Shift.MORNING,
                workDate
        );

        when(userRepository.findById(2L)).thenReturn(Optional.of(staffMinh));
        when(unitTypeRepository.findById(2)).thenReturn(Optional.of(typeS));

        StaffAssignment existingConflict = new StaffAssignment();
        existingConflict.setAssignmentId(99L);
        existingConflict.setStaff(staffMinh);
        existingConflict.setUnitType(typeS);
        existingConflict.setShift(StaffAssignment.Shift.MORNING);
        existingConflict.setWorkDate(workDate);

        // Giả lập đã có ca trực trùng người - ca - ngày
        when(staffAssignmentRepository.findByStaff_UserIdAndWorkDateAndShift(2L, workDate, StaffAssignment.Shift.MORNING))
                .thenReturn(Optional.of(existingConflict));

        ShiftConflictException exception = assertThrows(ShiftConflictException.class, () ->
                staffingService.createShiftAssignment("tuan@demo.storagehub.vn", request)
        );

        assertTrue(exception.getMessage().contains("Minh Nguyễn"));
        assertTrue(exception.getMessage().contains("MORNING"));
        assertTrue(exception.getMessage().contains("kho S"));
        assertEquals(2L, exception.getStaffId());

        // Đảm bảo TUYỆT ĐỐI không gọi save khi bị conflict
        verify(staffAssignmentRepository, never()).save(any(StaffAssignment.class));
        verify(logService, never()).log(any(), any(), any(), any(), any(), any(), any());
    }

    @Test
    @DisplayName("Hủy phân công ca trực thành công và ghi nhận Activity Log")
    void testDeleteShiftAssignment_Success() {
        StaffAssignment assignment = new StaffAssignment();
        assignment.setAssignmentId(101L);
        assignment.setStaff(staffMinh);
        assignment.setUnitType(typeS);
        assignment.setShift(StaffAssignment.Shift.MORNING);
        assignment.setWorkDate(workDate);

        when(userRepository.findByEmailIgnoreCase("tuan@demo.storagehub.vn")).thenReturn(Optional.of(manager));
        when(staffAssignmentRepository.findById(101L)).thenReturn(Optional.of(assignment));

        staffingService.deleteShiftAssignment("tuan@demo.storagehub.vn", 101L);

        verify(staffAssignmentRepository, times(1)).delete(assignment);
        verify(logService, times(1)).log(
                eq(manager),
                eq("STAFF_ASSIGNMENT"),
                eq(101L),
                eq("DELETED"),
                eq("MORNING"),
                isNull(),
                anyString()
        );
    }

    @Test
    @DisplayName("Hủy phân công ca trực ném ShiftNotFoundException khi ID không tồn tại")
    void testDeleteShiftAssignment_NotFound() {
        when(staffAssignmentRepository.findById(999L)).thenReturn(Optional.empty());

        assertThrows(ShiftNotFoundException.class, () ->
                staffingService.deleteShiftAssignment("tuan@demo.storagehub.vn", 999L)
        );

        verify(staffAssignmentRepository, never()).delete(any(StaffAssignment.class));
    }

    @Test
    @DisplayName("Lấy danh sách ca trực theo bộ lọc ngày và nhân viên")
    void testGetShifts_Filtered() {
        StaffAssignment assignment = new StaffAssignment();
        assignment.setAssignmentId(101L);
        assignment.setStaff(staffMinh);
        assignment.setUnitType(typeS);
        assignment.setShift(StaffAssignment.Shift.MORNING);
        assignment.setWorkDate(workDate);

        when(staffAssignmentRepository.findFiltered(workDate, workDate.plusDays(6), 2L, 2))
                .thenReturn(List.of(assignment));

        List<ShiftAssignmentResponse> result = staffingService.getShifts(workDate, workDate.plusDays(6), 2L, 2);

        assertEquals(1, result.size());
        assertEquals("Minh Nguyễn", result.get(0).staffName());
        assertEquals(StaffAssignment.Shift.MORNING, result.get(0).shift());
    }

    @Test
    @DisplayName("Lấy danh sách Roster nhân sự và tính toán số lượng ca trực")
    void testGetStaffRoster() {
        when(userRepository.findByRole_NameAndStatus(Role.Name.STAFF, 1))
                .thenReturn(List.of(staffMinh));

        StaffAssignment assignment = new StaffAssignment();
        assignment.setAssignmentId(101L);
        assignment.setStaff(staffMinh);
        assignment.setUnitType(typeS);
        assignment.setShift(StaffAssignment.Shift.MORNING);
        assignment.setWorkDate(workDate);

        when(staffAssignmentRepository.findByWorkDateBetween(workDate, workDate.plusDays(6)))
                .thenReturn(List.of(assignment));

        List<StaffRosterMember> roster = staffingService.getStaffRoster(workDate, workDate.plusDays(6));

        assertEquals(1, roster.size());
        assertEquals("Minh Nguyễn", roster.get(0).fullName());
        assertEquals(1, roster.get(0).shiftCount());
        assertEquals(0, roster.get(0).conflictCount());
    }
}
