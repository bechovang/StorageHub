package com.storagehub.dto.user;

import java.util.List;

public record LoginHistoryPageResponse(
        List<LoginHistoryItemResponse> items,
        int page,
        int pageSize,
        long totalItems,
        int totalPages
) {}
