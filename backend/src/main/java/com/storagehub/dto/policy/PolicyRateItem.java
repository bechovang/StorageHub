package com.storagehub.dto.policy;

/** Một dòng đơn giá/ngày theo loại kho. */
public record PolicyRateItem(
        Long id,
        String typeName,
        String fullName,
        Long rateVnd
) {
}
