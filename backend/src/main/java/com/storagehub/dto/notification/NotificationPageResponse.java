package com.storagehub.dto.notification;

import java.util.List;

/**
 * Trang thông báo theo schema NotificationPage trong contracts/openapi.yaml (FR-34).
 */
public record NotificationPageResponse(
        List<NotificationResponse> items,
        int page,
        int pageSize,
        int total
) {
}
