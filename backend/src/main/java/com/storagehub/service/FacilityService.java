package com.storagehub.service;

import com.storagehub.dto.facility.FacilityDrilldownResponse;
import com.storagehub.dto.facility.FacilityOverviewResponse;

public interface FacilityService {

    /**
     * Lấy dữ liệu tổng quan cơ sở vật chất và chỉ số vận hành (FR-32).
     */
    FacilityOverviewResponse getFacilityOverview();

    /**
     * Tra cứu chi tiết danh sách kho theo trạng thái / từ khóa tìm kiếm có phân trang (FR-32 drill-down).
     *
     * @param status     Bộ lọc trạng thái (RENTED, AVAILABLE, PREPARING, MAINTENANCE, RESERVED, RETIRED)
     * @param query      Từ khóa tìm kiếm (mã kho, loại kho, khu vực)
     * @param page       Số trang (1-based)
     * @param pageSize   Số dòng mỗi trang
     * @return Kết quả phân trang chi tiết
     */
    FacilityDrilldownResponse getFacilityDrilldown(String status, String query, int page, int pageSize);
}
