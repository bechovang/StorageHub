package com.storagehub.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.storagehub.dto.shift.CreateShiftAssignmentRequest;
import com.storagehub.dto.shift.ShiftAssignmentResponse;
import com.storagehub.dto.shift.StaffRosterMember;
import com.storagehub.entity.StaffAssignment;
import com.storagehub.exception.ShiftConflictException;
import com.storagehub.exception.ShiftNotFoundException;
import com.storagehub.repository.UserRepository;
import com.storagehub.security.JwtService;
import com.storagehub.service.StaffingService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(StaffingController.class)
@AutoConfigureMockMvc(addFilters = false)
class StaffingControllerTest {

    @Autowired
    private MockMvc mockMvc;

    private final ObjectMapper objectMapper = new ObjectMapper().findAndRegisterModules();

    @MockitoBean
    private StaffingService staffingService;

    @MockitoBean
    private JwtService jwtService;

    @MockitoBean
    private UserRepository userRepository;

    @Test
    @DisplayName("GET /api/v1/shifts trả về 200 OK với danh sách ca trực")
    void testGetShifts_Success() throws Exception {
        ShiftAssignmentResponse shift = new ShiftAssignmentResponse(
                101L,
                2L,
                "Minh Nguyễn",
                "KC-8842",
                2,
                "B",
                "Zone B",
                StaffAssignment.Shift.MORNING,
                LocalDate.of(2026, 10, 12),
                LocalDateTime.now()
        );

        when(staffingService.getShifts(any(), any(), any(), any())).thenReturn(List.of(shift));

        mockMvc.perform(get("/api/v1/shifts")
                        .param("startDate", "2026-10-12")
                        .param("endDate", "2026-10-18"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].assignmentId").value(101))
                .andExpect(jsonPath("$[0].staffName").value("Minh Nguyễn"))
                .andExpect(jsonPath("$[0].shift").value("MORNING"))
                .andExpect(jsonPath("$[0].zoneCode").value("B"));
    }

    @Test
    @DisplayName("POST /api/v1/shifts trả về 201 CREATED khi phân công thành công")
    void testCreateShiftAssignment_Success() throws Exception {
        CreateShiftAssignmentRequest request = new CreateShiftAssignmentRequest(
                2L,
                2,
                StaffAssignment.Shift.MORNING,
                LocalDate.of(2026, 10, 12)
        );

        ShiftAssignmentResponse created = new ShiftAssignmentResponse(
                101L,
                2L,
                "Minh Nguyễn",
                "KC-8842",
                2,
                "B",
                "Zone B",
                StaffAssignment.Shift.MORNING,
                LocalDate.of(2026, 10, 12),
                LocalDateTime.now()
        );

        when(staffingService.createShiftAssignment(any(), any())).thenReturn(created);

        mockMvc.perform(post("/api/v1/shifts")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.assignmentId").value(101))
                .andExpect(jsonPath("$.staffName").value("Minh Nguyễn"))
                .andExpect(jsonPath("$.shift").value("MORNING"));
    }

    @Test
    @DisplayName("POST /api/v1/shifts trả về 409 CONFLICT kèm mã SHIFT_ASSIGNMENT_CONFLICT khi phát hiện trùng lịch (FR-27)")
    void testCreateShiftAssignment_ConflictThrows409() throws Exception {
        CreateShiftAssignmentRequest request = new CreateShiftAssignmentRequest(
                2L,
                2,
                StaffAssignment.Shift.MORNING,
                LocalDate.of(2026, 10, 12)
        );

        when(staffingService.createShiftAssignment(any(), any())).thenThrow(
                new ShiftConflictException(2L, "Minh Nguyễn", StaffAssignment.Shift.MORNING, "B", LocalDate.of(2026, 10, 12))
        );

        mockMvc.perform(post("/api/v1/shifts")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("SHIFT_ASSIGNMENT_CONFLICT"))
                .andExpect(jsonPath("$.message").value(org.hamcrest.Matchers.containsString("Minh Nguyễn đã được phân công ca MORNING tại Zone B")))
                .andExpect(jsonPath("$.fieldErrors[0].field").value("shift"))
                .andExpect(jsonPath("$.fieldErrors[0].code").value("CONFLICT"));
    }

    @Test
    @DisplayName("DELETE /api/v1/shifts/{id} trả về 204 NO CONTENT khi xóa ca trực thành công")
    void testDeleteShiftAssignment_Success() throws Exception {
        doNothing().when(staffingService).deleteShiftAssignment(any(), eq(101L));

        mockMvc.perform(delete("/api/v1/shifts/101"))
                .andExpect(status().isNoContent());
    }

    @Test
    @DisplayName("DELETE /api/v1/shifts/{id} trả về 404 NOT FOUND khi không tìm thấy ca trực")
    void testDeleteShiftAssignment_NotFound() throws Exception {
        doThrow(new ShiftNotFoundException("Không tìm thấy phân công ca trực này."))
                .when(staffingService).deleteShiftAssignment(any(), eq(999L));

        mockMvc.perform(delete("/api/v1/shifts/999"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.code").value("SHIFT_NOT_FOUND"));
    }

    @Test
    @DisplayName("GET /api/v1/shifts/roster trả về 200 OK với danh sách nhân sự Roster")
    void testGetStaffRoster_Success() throws Exception {
        StaffRosterMember member = new StaffRosterMember(
                2L,
                "Minh Nguyễn",
                "minh@demo.storagehub.vn",
                "KC-8842",
                "Staff · Zones A, B",
                "ON_DUTY",
                5,
                0,
                List.of()
        );

        when(staffingService.getStaffRoster(any(), any())).thenReturn(List.of(member));

        mockMvc.perform(get("/api/v1/shifts/roster"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].staffId").value(2))
                .andExpect(jsonPath("$[0].fullName").value("Minh Nguyễn"))
                .andExpect(jsonPath("$[0].shiftCount").value(5));
    }
}
