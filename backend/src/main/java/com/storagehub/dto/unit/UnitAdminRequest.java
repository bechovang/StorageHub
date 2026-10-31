package com.storagehub.dto.unit;

import java.math.BigDecimal;

/** POST/PATCH /api/v1/units — tạo mới / sửa thông số (KHÔNG có trường giá). */
public record UnitAdminRequest(
        String code,
        Long typeId,
        Long zoneId,
        BigDecimal sizeM2,
        Integer floor,
        String accessType,
        String notes,
        String reason
) {
}
