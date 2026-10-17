package com.storagehub.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.storagehub.dto.task.*;
import com.storagehub.entity.StaffAssignment;
import com.storagehub.entity.Task;
import com.storagehub.exception.TaskNotFoundException;
import com.storagehub.exception.TaskSnapBackException;
import com.storagehub.repository.UserRepository;
import com.storagehub.security.JwtService;
import com.storagehub.service.TaskService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDate;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(TaskController.class)
@AutoConfigureMockMvc(addFilters = false)
class TaskControllerTest {

    @Autowired
    private MockMvc mockMvc;

    private final ObjectMapper objectMapper = new ObjectMapper().findAndRegisterModules();

    @MockitoBean
    private TaskService taskService;

    @MockitoBean
    private JwtService jwtService;

    @MockitoBean
    private UserRepository userRepository;

    private final org.springframework.security.core.Authentication auth =
            new org.springframework.security.authentication.TestingAuthenticationToken("minh@demo.storagehub.vn", null);

    @Test
    @DisplayName("GET /api/v1/tasks trả về 200 OK với danh sách task kanban")
    void testGetTasks_Success() throws Exception {
        TaskResponse task1 = new TaskResponse(
                1042L,
                Task.Type.CHECK_IN,
                "BK-1042",
                "Unit S-3",
                "Nguyễn Thị Lan",
                "0901 234 567",
                "09:00",
                Task.Status.TODO,
                LocalDate.of(2026, 10, 13),
                StaffAssignment.Shift.MORNING,
                "8842-Active",
                1800000L,
                180000L,
                null,
                null,
                null,
                new AssignedStaffDto(2L, "Trần Minh"),
                TaskRitualDto.empty()
        );

        when(taskService.getTasks(any(), any(), any(), any(), any())).thenReturn(List.of(task1));

        mockMvc.perform(get("/api/v1/tasks")
                        .principal(auth)
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].taskId").value(1042))
                .andExpect(jsonPath("$[0].type").value("CHECK_IN"))
                .andExpect(jsonPath("$[0].status").value("TODO"))
                .andExpect(jsonPath("$[0].refCode").value("BK-1042"))
                .andExpect(jsonPath("$[0].unitCode").value("Unit S-3"));
    }

    @Test
    @DisplayName("GET /api/v1/tasks/{taskId} trả về 200 OK với chi tiết task")
    void testGetTaskDetail_Success() throws Exception {
        TaskResponse task = new TaskResponse(
                1043L,
                Task.Type.CLEANING,
                "CL-0101",
                "Unit S-1",
                "Hệ thống",
                null,
                "16:00",
                Task.Status.TODO,
                LocalDate.of(2026, 10, 13),
                StaffAssignment.Shift.MORNING,
                null,
                null,
                null,
                null,
                null,
                "Khách kế tiếp nhận lúc 16:30",
                new AssignedStaffDto(2L, "Trần Minh"),
                TaskRitualDto.empty()
        );

        when(taskService.getTaskDetail(any(), eq(1043L))).thenReturn(task);

        mockMvc.perform(get("/api/v1/tasks/1043")
                        .principal(auth)
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.taskId").value(1043))
                .andExpect(jsonPath("$.type").value("CLEANING"));
    }

    @Test
    @DisplayName("GET /api/v1/tasks/{taskId} trả về 404 NOT_FOUND khi không tồn tại")
    void testGetTaskDetail_NotFound() throws Exception {
        when(taskService.getTaskDetail(any(), eq(9999L)))
                .thenThrow(new TaskNotFoundException(9999L));

        mockMvc.perform(get("/api/v1/tasks/9999")
                        .principal(auth)
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.code").value("TASK_NOT_FOUND"))
                .andExpect(jsonPath("$.message").value("Không tìm thấy nhiệm vụ #9999"));
    }

    @Test
    @DisplayName("PATCH /api/v1/tasks/{taskId}/status cập nhật trạng thái thành công")
    void testUpdateTaskStatus_Success() throws Exception {
        TaskResponse updated = new TaskResponse(
                1042L,
                Task.Type.CHECK_IN,
                "BK-1042",
                "Unit S-3",
                "Nguyễn Thị Lan",
                "0901 234 567",
                "09:00",
                Task.Status.IN_PROGRESS,
                LocalDate.of(2026, 10, 13),
                StaffAssignment.Shift.MORNING,
                "8842-Active",
                1800000L,
                180000L,
                null,
                null,
                null,
                new AssignedStaffDto(2L, "Trần Minh"),
                TaskRitualDto.empty()
        );

        when(taskService.updateTaskStatus(any(), eq(1042L), eq(Task.Status.IN_PROGRESS))).thenReturn(updated);

        UpdateTaskStatusRequest request = new UpdateTaskStatusRequest(Task.Status.IN_PROGRESS);

        mockMvc.perform(patch("/api/v1/tasks/1042/status")
                        .principal(auth)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.taskId").value(1042))
                .andExpect(jsonPath("$.status").value("IN_PROGRESS"));
    }

    @Test
    @DisplayName("PATCH /api/v1/tasks/{taskId}/status trả về 409 TASK_SNAP_BACK khi vi phạm snap-back")
    void testUpdateTaskStatus_SnapBackViolation() throws Exception {
        when(taskService.updateTaskStatus(any(), eq(1042L), eq(Task.Status.DONE)))
                .thenThrow(new TaskSnapBackException("Chặn Done ảo: Chưa thu 100% tiền thuê kho tại quầy!", "RENT_NOT_COLLECTED"));

        UpdateTaskStatusRequest request = new UpdateTaskStatusRequest(Task.Status.DONE);

        mockMvc.perform(patch("/api/v1/tasks/1042/status")
                        .principal(auth)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("TASK_SNAP_BACK"))
                .andExpect(jsonPath("$.message").value("Chặn Done ảo: Chưa thu 100% tiền thuê kho tại quầy!"));
    }

    @Test
    @DisplayName("POST /api/v1/tasks tự động sinh và phân task trả về 201 Created")
    void testCreateTask_Success() throws Exception {
        CreateTaskRequest request = new CreateTaskRequest(
                Task.Type.CHECK_IN,
                3L,
                "BK-1042",
                LocalDate.of(2026, 10, 13),
                StaffAssignment.Shift.MORNING,
                "09:00",
                null,
                null,
                null
        );

        TaskResponse created = new TaskResponse(
                1050L,
                Task.Type.CHECK_IN,
                "BK-1042",
                "Unit S-3",
                "Nguyễn Thị Lan",
                "0901 234 567",
                "09:00",
                Task.Status.TODO,
                LocalDate.of(2026, 10, 13),
                StaffAssignment.Shift.MORNING,
                "8842-Active",
                1800000L,
                180000L,
                null,
                null,
                null,
                new AssignedStaffDto(2L, "Trần Minh"),
                TaskRitualDto.empty()
        );

        when(taskService.autoCreateTask(any())).thenReturn(created);

        mockMvc.perform(post("/api/v1/tasks")
                        .principal(auth)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.taskId").value(1050))
                .andExpect(jsonPath("$.type").value("CHECK_IN"))
                .andExpect(jsonPath("$.assignedStaff.fullName").value("Trần Minh"));
    }
}
