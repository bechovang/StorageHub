package com.storagehub.dto.policy;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

import java.util.List;

/** POST /api/v1/policies — tạo phiên bản chính sách mới. */
public record PolicySaveRequest(
        @NotEmpty(message = "baseRates không được để trống")
        List<RateItem> baseRates,

        @NotNull(message = "facilityId là bắt buộc — chính sách giá phải theo từng cơ sở")
        Integer facilityId,

        Integer lateCheckoutPercent,

        Integer lateEscalationDays,

        @Min(value = 10, message = "Tỷ lệ cọc tối thiểu 10%")
        Integer depositPercent,

        @Min(value = 1, message = "Buffer tối thiểu 1 ngày")
        Integer turnoverBufferDays,

        Integer checkinGraceDays,

        Integer checkinLateFeePercent,

        Integer extensionGraceDays,

        Integer extensionLateFeePercent,

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
