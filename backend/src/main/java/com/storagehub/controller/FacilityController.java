package com.storagehub.controller;

import com.storagehub.dto.facility.FacilityDrilldownResponse;
import com.storagehub.dto.facility.FacilityOverviewResponse;
import com.storagehub.service.FacilityService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * Controller bảng điều khiển vận hành & giám sát cơ sở (Facility Overview & Operations Monitor) — FR-32.
 * Dành cho: FACILITY_MANAGER, SYSTEM_ADMIN, BUSINESS_OPS.
 */
@RestController
@RequestMapping("/api/v1/facility")
public class FacilityController {

    private final FacilityService facilityService;

    public FacilityController(FacilityService facilityService) {
        this.facilityService = facilityService;
    }

    /**
     * Lấy dữ liệu tổng quan cơ sở: 4 KPI vận hành + biểu đồ phân bổ trạng thái + cơ cấu doanh thu + hàng chờ dọn dẹp (FR-32).
     */
    @GetMapping("/overview")
    public ResponseEntity<FacilityOverviewResponse> getFacilityOverview() {
        FacilityOverviewResponse response = facilityService.getFacilityOverview();
        return ResponseEntity.ok(response);
    }

    /**
     * Tra cứu chi tiết danh sách kho phục vụ drill-down từ KPI / Biểu đồ (FR-32).
     */
    @GetMapping("/drilldown")
    public ResponseEntity<FacilityDrilldownResponse> getFacilityDrilldown(
            @RequestParam(name = "status", required = false) String status,
            @RequestParam(name = "query", required = false) String query,
            @RequestParam(name = "page", defaultValue = "1") int page,
            @RequestParam(name = "pageSize", defaultValue = "25") int pageSize
    ) {
        FacilityDrilldownResponse response = facilityService.getFacilityDrilldown(status, query, page, pageSize);
        return ResponseEntity.ok(response);
    }
}
