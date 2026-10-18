package com.storagehub.controller;

import com.storagehub.dto.notification.NotificationPageResponse;
import com.storagehub.dto.notification.NotificationResponse;
import com.storagehub.dto.notification.UnreadCountResponse;
import com.storagehub.exception.GlobalExceptionHandler;
import com.storagehub.exception.InvalidCredentialsException;
import com.storagehub.repository.UserRepository;
import com.storagehub.security.JwtService;
import com.storagehub.service.NotificationService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;
import java.util.List;

import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(NotificationController.class)
@AutoConfigureMockMvc(addFilters = false)
@Import(GlobalExceptionHandler.class)
class NotificationControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private NotificationService notificationService;

    @MockitoBean
    private JwtService jwtService;

    @MockitoBean
    private UserRepository userRepository;

    private final org.springframework.security.core.Authentication auth =
            new org.springframework.security.authentication.TestingAuthenticationToken("lan@demo.storagehub.vn", null);

    @Test
    @DisplayName("GET /api/v1/notifications trả về 200 OK với NotificationPage (FR-34)")
    void testListNotifications_Success() throws Exception {
        NotificationResponse item1 = new NotificationResponse(
                1L,
                "BOOKING_CONFIRMED",
                "Unit S-3 reserved. Deposit 103.500 ₫ received.",
                null,
                "/rentals/1",
                false,
                LocalDateTime.of(2026, 4, 20, 9, 12, 0)
        );

        NotificationPageResponse pageResponse = new NotificationPageResponse(
                List.of(item1),
                1,
                25,
                1
        );

        when(notificationService.listNotifications(eq("lan@demo.storagehub.vn"), eq(false), eq(1), eq(25)))
                .thenReturn(pageResponse);

        mockMvc.perform(get("/api/v1/notifications")
                        .principal(auth))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.page").value(1))
                .andExpect(jsonPath("$.pageSize").value(25))
                .andExpect(jsonPath("$.total").value(1))
                .andExpect(jsonPath("$.items[0].id").value(1))
                .andExpect(jsonPath("$.items[0].type").value("BOOKING_CONFIRMED"))
                .andExpect(jsonPath("$.items[0].title").value("Unit S-3 reserved. Deposit 103.500 ₫ received."))
                .andExpect(jsonPath("$.items[0].deepLink").value("/rentals/1"))
                .andExpect(jsonPath("$.items[0].isRead").value(false))
                .andExpect(jsonPath("$.items[0].createdAt").value("2026-04-20T09:12:00Z"));
    }

    @Test
    @DisplayName("GET /api/v1/notifications với query params unread-only, page, page-size")
    void testListNotifications_WithQueryParams() throws Exception {
        NotificationPageResponse emptyPage = new NotificationPageResponse(
                List.of(),
                2,
                10,
                0
        );

        when(notificationService.listNotifications(eq("lan@demo.storagehub.vn"), eq(true), eq(2), eq(10)))
                .thenReturn(emptyPage);

        mockMvc.perform(get("/api/v1/notifications")
                        .param("unread-only", "true")
                        .param("page", "2")
                        .param("page-size", "10")
                        .principal(auth))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.page").value(2))
                .andExpect(jsonPath("$.pageSize").value(10))
                .andExpect(jsonPath("$.total").value(0))
                .andExpect(jsonPath("$.items").isEmpty());
    }

    @Test
    @DisplayName("GET /api/v1/notifications khi chưa xác thực trả về 401 Unauthorized (FR-34)")
    void testListNotifications_Unauthenticated() throws Exception {
        when(notificationService.listNotifications(eq(""), eq(false), eq(1), eq(25)))
                .thenThrow(new InvalidCredentialsException());

        mockMvc.perform(get("/api/v1/notifications"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code").value("AUTH_INVALID_CREDENTIALS"));
    }

    @Test
    @DisplayName("GET /api/v1/notifications/unread-count trả về 200 OK với count (FR-33)")
    void testGetUnreadCount_Success() throws Exception {
        when(notificationService.getUnreadCount("lan@demo.storagehub.vn"))
                .thenReturn(new UnreadCountResponse(3L));

        mockMvc.perform(get("/api/v1/notifications/unread-count")
                        .principal(auth))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.count").value(3));
    }

    @Test
    @DisplayName("GET /api/v1/notifications/unread-count khi chưa xác thực trả về 401 Unauthorized (FR-33)")
    void testGetUnreadCount_Unauthenticated() throws Exception {
        when(notificationService.getUnreadCount(eq("")))
                .thenThrow(new InvalidCredentialsException());

        mockMvc.perform(get("/api/v1/notifications/unread-count"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code").value("AUTH_INVALID_CREDENTIALS"));
    }

    @Test
    @DisplayName("POST /api/v1/notifications/mark-all-read trả về 204 No Content (FR-34)")
    void testMarkAllRead_Success() throws Exception {
        mockMvc.perform(post("/api/v1/notifications/mark-all-read")
                        .principal(auth))
                .andExpect(status().isNoContent());

        verify(notificationService).markAllRead("lan@demo.storagehub.vn");
    }

    @Test
    @DisplayName("POST /api/v1/notifications/mark-all-read khi chưa xác thực trả về 401 Unauthorized (FR-34)")
    void testMarkAllRead_Unauthenticated() throws Exception {
        org.mockito.Mockito.doThrow(new InvalidCredentialsException())
                .when(notificationService).markAllRead(eq(""));

        mockMvc.perform(post("/api/v1/notifications/mark-all-read"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code").value("AUTH_INVALID_CREDENTIALS"));
    }
}
