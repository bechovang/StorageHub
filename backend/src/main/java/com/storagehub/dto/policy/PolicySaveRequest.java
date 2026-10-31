package com.storagehub.dto.policy;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotEmpty;

import java.util.List;

/** POST /api/v1/policies — tạo phiên bản chính sách mới. */
public record PolicySaveRequest(
        @NotEmpty(message = "baseRates không được để trống")
        List<RateItem> baseRates,

        Integer lateCheckoutPercent,

        @Min(value = 10, message = "Tỷ lệ cọc tối thiểu 10%")
        Integer depositPercent,

        @Min(value = 1, message = "Buffer tối thiểu 1 ngày")
        Integer turnoverBufferDays,

        String updatedBy
) {

    public record RateItem(
            Long id,
            @NotEmpty String typeName,
            @Min(value = 1, message = "Đơn giá phải lớn hơn 0 ₫")
            Long rateVnd
    ) {
    }
}
