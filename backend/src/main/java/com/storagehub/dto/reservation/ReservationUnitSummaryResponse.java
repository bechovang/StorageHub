package com.storagehub.dto.reservation;

import com.storagehub.dto.unit.UnitAvailabilityResponse;

import java.math.BigDecimal;

/**
 * Tóm tắt Unit gắn với Reservation theo schema UnitSummary trong contracts/openapi.yaml.
 */
public record ReservationUnitSummaryResponse(
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
    public ReservationUnitSummaryResponse(String code, BigDecimal sizeM2, String typeName) {
        this(null, code, typeName, sizeM2, null, null, null, null, null, null, null);
    }
}
