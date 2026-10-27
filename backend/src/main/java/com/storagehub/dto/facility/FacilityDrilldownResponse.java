package com.storagehub.dto.facility;

import java.util.List;

public record FacilityDrilldownResponse(
        List<FacilityDrilldownItem> items,
        int page,
        int pageSize,
        long totalItems,
        int totalPages,
        String statusFilter
) {}
