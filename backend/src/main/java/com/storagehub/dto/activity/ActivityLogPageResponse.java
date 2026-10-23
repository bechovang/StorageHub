package com.storagehub.dto.activity;

import java.util.List;

public record ActivityLogPageResponse(
        List<ActivityLogItemResponse> items,
        int page,
        int pageSize,
        long total,
        int totalPages
) {}
