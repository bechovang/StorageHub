package com.storagehub.dto.unit;

import java.math.BigDecimal;
import java.util.List;

/**
 * Spec đầy đủ của unit (FR-6, phần tĩnh) theo schema UnitDetail trong contracts/openapi.yaml.
 */
public record UnitDetailResponse(
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
        String photoUrl,
        String dimensions,
        String security,
        List<String> photoUrls
) {
}
