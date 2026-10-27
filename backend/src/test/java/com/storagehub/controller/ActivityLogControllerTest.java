package com.storagehub.controller;

import com.storagehub.dto.activity.ActivityLogItemResponse;
import com.storagehub.dto.activity.ActivityLogPageResponse;
import com.storagehub.repository.UserRepository;
import com.storagehub.security.JwtService;
import com.storagehub.service.LogService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(ActivityLogController.class)
@AutoConfigureMockMvc(addFilters = false)
class ActivityLogControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private LogService logService;

    @MockitoBean
    private JwtService jwtService;

    @MockitoBean
    private UserRepository userRepository;

    @Test
    @DisplayName("GET /api/v1/activity-logs trả về 200 OK với trang audit trail (FR-28 / NFR-6)")
    void testGetActivityLogs_Success() throws Exception {
        ActivityLogItemResponse item = new ActivityLogItemResponse(
                1L,
                4L,
                "Phạm Tuấn",
                "tuan@demo.storagehub.vn",
                "FACILITY_MANAGER",
                "UNIT",
                3L,
                "STATUS_CHANGE",
                "RENTED",
                "PREPARING",
                "Sửa trạng thái thực tế kho không dùng",
                LocalDateTime.of(2026, 10, 1, 14, 22)
        );

        ActivityLogPageResponse pageResponse = new ActivityLogPageResponse(
                List.of(item),
                1,
                25,
                1L,
                1
        );

        when(logService.getActivityLogs(any(), any(), any(), any(), eq(1), eq(25)))
                .thenReturn(pageResponse);

        mockMvc.perform(get("/api/v1/activity-logs")
                        .param("query", "Tuấn")
                        .param("entityType", "UNIT")
                        .param("page", "1")
                        .param("pageSize", "25"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.page").value(1))
                .andExpect(jsonPath("$.pageSize").value(25))
                .andExpect(jsonPath("$.total").value(1))
                .andExpect(jsonPath("$.items[0].logId").value(1))
                .andExpect(jsonPath("$.items[0].actorName").value("Phạm Tuấn"))
                .andExpect(jsonPath("$.items[0].entityType").value("UNIT"))
                .andExpect(jsonPath("$.items[0].action").value("STATUS_CHANGE"))
                .andExpect(jsonPath("$.items[0].fromValue").value("RENTED"))
                .andExpect(jsonPath("$.items[0].toValue").value("PREPARING"))
                .andExpect(jsonPath("$.items[0].reason").value("Sửa trạng thái thực tế kho không dùng"));
    }
}
