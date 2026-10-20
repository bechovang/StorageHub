package com.storagehub.dto.facility;

import java.math.BigDecimal;

public record FacilityDrilldownItem(
        Long unitId,
        String code,
        String unitType,
        BigDecimal sizeM2,
        String zoneCode,
        Integer floor,
        String status,
        BigDecimal rentPrice,
        String tenantName,
        String rentalCode
) {}
