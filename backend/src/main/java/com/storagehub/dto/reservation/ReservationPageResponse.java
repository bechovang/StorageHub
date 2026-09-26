package com.storagehub.dto.reservation;

import java.util.List;

public record ReservationPageResponse(
        List<ReservationSummaryResponse> items,
        int page,
        int pageSize,
        long total
) {
}
