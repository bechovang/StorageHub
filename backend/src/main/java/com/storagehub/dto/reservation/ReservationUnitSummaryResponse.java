package com.storagehub.dto.reservation;

import java.math.BigDecimal;

public record ReservationUnitSummaryResponse(
        String code,
        BigDecimal sizeM2,
        String typeName
) {
}
