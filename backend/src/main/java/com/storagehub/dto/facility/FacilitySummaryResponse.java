package com.storagehub.dto.facility;

/** Cơ sở đang hoạt động cho bộ chọn địa chỉ của khách hàng. */
public record FacilitySummaryResponse(
        Integer id,
        String code,
        String name,
        String description,
        String address,
        String phone,
        String photoUrl,
        long unitCount
) {
}
