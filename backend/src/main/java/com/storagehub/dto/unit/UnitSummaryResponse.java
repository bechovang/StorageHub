package com.storagehub.dto.unit;

import java.math.BigDecimal;

public record UnitSummaryResponse(
        Long id,
        String code,
        String typeName,
        BigDecimal sizeM2,
        Integer floor,
        String zoneCode,
        String facilityName,
        String accessType,
        Long baseMonthlyRent,
        UnitAvailabilityResponse availability,
        String photoUrl
) {
}
