package com.storagehub.dto.notification;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.storagehub.entity.Notification;

import java.time.LocalDateTime;

/**
 * Thông báo trong feed theo schema Notification trong contracts/openapi.yaml (FR-33/34).
 */
public record NotificationResponse(
        Long id,
        String type,
        String title,
        String body,
        String deepLink,
        Boolean isRead,
        @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd'T'HH:mm:ss'Z'")
        LocalDateTime createdAt
) {
    public static NotificationResponse from(Notification entity) {
        return new NotificationResponse(
                entity.getNotificationId(),
                entity.getType(),
                entity.getTitle(),
                null,
                entity.getDeepLink(),
                Boolean.TRUE.equals(entity.getIsRead()),
                entity.getCreatedAt()
        );
    }
}
