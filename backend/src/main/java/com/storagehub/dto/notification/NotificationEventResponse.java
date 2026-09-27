package com.storagehub.dto.notification;

/**
 * Kèm trong response mutation thành công — FE bắn toast từ đây (Conventions);
 * bản ghi bell sinh cùng transaction qua NotificationService (openapi.yaml).
 */
public record NotificationEventResponse(
        String type,
        String title,
        String body,
        String deepLink
) {
}
