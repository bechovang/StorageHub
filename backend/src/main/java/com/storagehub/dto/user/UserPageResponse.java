package com.storagehub.dto.user;

import java.util.List;

/**
 * Trang danh sách người dùng theo schema UserPage trong contracts/openapi.yaml (FR-37).
 */
public record UserPageResponse(
        List<UserDetailResponse> items,
        int page,
        int pageSize,
        long totalItems,
        int totalPages
) {
}
