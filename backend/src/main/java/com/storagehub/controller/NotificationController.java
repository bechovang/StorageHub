package com.storagehub.controller;

import com.storagehub.dto.notification.NotificationPageResponse;
import com.storagehub.dto.notification.UnreadCountResponse;
import com.storagehub.service.NotificationService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

/**
 * Controller xử lý thông báo (FR-33: Toast + Bell, FR-34: Notification Feed).
 * Cung cấp API đếm chưa đọc cho bell badge, lấy feed thông báo và đánh dấu đã đọc.
 */
@RestController
@RequestMapping("/api/v1/notifications")
public class NotificationController {

    private final NotificationService notificationService;

    public NotificationController(NotificationService notificationService) {
        this.notificationService = notificationService;
    }

    /**
     * Lấy danh sách feed thông báo của user (FR-34) — unread trước.
     */
    @GetMapping
    public ResponseEntity<NotificationPageResponse> listNotifications(
            @RequestParam(name = "unread-only", defaultValue = "false") boolean unreadOnly,
            @RequestParam(name = "page", defaultValue = "1") int page,
            @RequestParam(name = "page-size", defaultValue = "25") int pageSize,
            Authentication authentication
    ) {
        String email = authentication != null ? authentication.getName() : "";
        return ResponseEntity.ok(
                notificationService.listNotifications(email, unreadOnly, page, pageSize)
        );
    }

    /**
     * Đếm unread cho bell badge — endpoint nhẹ, poll riêng (FR-33).
     */
    @GetMapping("/unread-count")
    public ResponseEntity<UnreadCountResponse> getUnreadCount(Authentication authentication) {
        String email = authentication != null ? authentication.getName() : "";
        return ResponseEntity.ok(
                notificationService.getUnreadCount(email)
        );
    }

    /**
     * Đánh dấu đã đọc tất cả thông báo (FR-34).
     */
    @PostMapping("/mark-all-read")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public ResponseEntity<Void> markAllRead(Authentication authentication) {
        String email = authentication != null ? authentication.getName() : "";
        notificationService.markAllRead(email);
        return ResponseEntity.noContent().build();
    }
}
