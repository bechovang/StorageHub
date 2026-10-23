package com.storagehub.service;

import com.storagehub.dto.activity.ActivityLogPageResponse;
import com.storagehub.entity.ActivityLog;
import com.storagehub.entity.Role;
import com.storagehub.entity.User;
import com.storagehub.repository.ActivityLogRepository;
import com.storagehub.service.impl.LogServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class LogServiceTest {

    @Mock
    private ActivityLogRepository activityLogRepository;

    @InjectMocks
    private LogServiceImpl logService;

    private User actor;

    @BeforeEach
    void setUp() {
        Role role = new Role();
        role.setName(Role.Name.FACILITY_MANAGER);

        actor = new User();
        actor.setUserId(4L);
        actor.setFullName("Phạm Tuấn");
        actor.setEmail("tuan@demo.storagehub.vn");
        actor.setRole(role);
    }

    @Test
    @DisplayName("Ghi log hoạt động append-only thành công vào database")
    void testLog_Success() {
        logService.log(actor, "UNIT", 3L, "STATUS_CHANGE", "RENTED", "PREPARING", "Sửa trạng thái thực tế");

        ArgumentCaptor<ActivityLog> captor = ArgumentCaptor.forClass(ActivityLog.class);
        verify(activityLogRepository, times(1)).save(captor.capture());

        ActivityLog saved = captor.getValue();
        assertEquals(actor, saved.getActor());
        assertEquals("UNIT", saved.getEntityType());
        assertEquals(3L, saved.getEntityId());
        assertEquals("STATUS_CHANGE", saved.getAction());
        assertEquals("RENTED", saved.getFromValue());
        assertEquals("PREPARING", saved.getToValue());
        assertEquals("Sửa trạng thái thực tế", saved.getReason());
    }

    @Test
    @DisplayName("Ghi log hoạt động với reason null tự động gán N/A")
    void testLog_NullReasonDefaultsToNA() {
        logService.log(actor, "CONTRACT", 1L, "CREATED", null, "DRAFT", null);

        ArgumentCaptor<ActivityLog> captor = ArgumentCaptor.forClass(ActivityLog.class);
        verify(activityLogRepository, times(1)).save(captor.capture());

        ActivityLog saved = captor.getValue();
        assertEquals("N/A", saved.getReason());
    }

    @Test
    @DisplayName("FR-28: Lấy danh sách Activity Log phân trang và lọc theo entityType")
    void testGetActivityLogs_Filtered() {
        ActivityLog logEntry = new ActivityLog();
        logEntry.setLogId(101L);
        logEntry.setActor(actor);
        logEntry.setEntityType("UNIT");
        logEntry.setEntityId(3L);
        logEntry.setAction("STATUS_CHANGE");
        logEntry.setFromValue("RENTED");
        logEntry.setToValue("PREPARING");
        logEntry.setReason("Sửa kho không dùng");
        logEntry.setCreatedAt(LocalDateTime.of(2026, 10, 1, 14, 22));

        when(activityLogRepository.findLogs(
                eq("Tuấn"),
                eq("UNIT"),
                any(LocalDateTime.class),
                any(LocalDateTime.class),
                any(Pageable.class)
        )).thenReturn(new PageImpl<>(List.of(logEntry), Pageable.unpaged(), 1));

        ActivityLogPageResponse response = logService.getActivityLogs(
                "Tuấn",
                "UNIT",
                LocalDate.of(2026, 10, 1),
                LocalDate.of(2026, 10, 31),
                1,
                25
        );

        assertNotNull(response);
        assertEquals(1, response.items().size());
        assertEquals(1, response.total());
        assertEquals(1, response.page());
        assertEquals(25, response.pageSize());

        var item = response.items().get(0);
        assertEquals(101L, item.logId());
        assertEquals("Phạm Tuấn", item.actorName());
        assertEquals("FACILITY_MANAGER", item.actorRole());
        assertEquals("UNIT", item.entityType());
        assertEquals("STATUS_CHANGE", item.action());
        assertEquals("RENTED", item.fromValue());
        assertEquals("PREPARING", item.toValue());
        assertEquals("Sửa kho không dùng", item.reason());
    }
}
