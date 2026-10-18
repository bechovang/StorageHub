package com.storagehub.dto.notification;

/**
 * Số lượng thông báo chưa đọc cho bell badge (FR-33 / openapi.yaml).
 */
public record UnreadCountResponse(
        long count
) {
}
