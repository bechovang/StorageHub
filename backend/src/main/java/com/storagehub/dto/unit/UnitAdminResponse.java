package com.storagehub.dto.unit;

import com.storagehub.entity.Unit;

/** Response quản trị kho — đơn giá KHÔNG nằm ở đây (thuộc Policy). */
public record UnitAdminResponse(
        Long id,
        String code,
        String typeName,
        Long typeId,
        String zoneCode,
        Long zoneId,
        java.math.BigDecimal sizeM2,
        Integer floor,
        String accessType,
        String status,
        String notes
) {

    public static UnitAdminResponse from(Unit u) {
        return new UnitAdminResponse(
                u.getUnitId(),
                u.getCode(),
                u.getType() != null ? u.getType().getName() : null,
                u.getType() != null ? u.getType().getTypeId().longValue() : null,
                u.getZone() != null ? u.getZone().getCode() : null,
                u.getZone() != null ? u.getZone().getZoneId().longValue() : null,
                u.getSizeM2(),
                u.getFloor(),
                u.getAccessType(),
                u.getStatus() != null ? u.getStatus().name() : null,
                u.getNotes()
        );
    }
}
