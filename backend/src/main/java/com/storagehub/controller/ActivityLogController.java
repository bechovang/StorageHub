package com.storagehub.controller;

import com.storagehub.dto.activity.ActivityLogPageResponse;
import com.storagehub.service.LogService;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;

/**
 * Controller xem nhật ký hoạt động hệ thống (FR-28 / NFR-6) — Activity Log viewer.
 * Hoàn toàn READ-ONLY (append-only, cấm cập nhật hay xóa log).
 */
@RestController
@RequestMapping("/api/v1/activity-logs")
@Validated
public class ActivityLogController {

    private final LogService logService;

    public ActivityLogController(LogService logService) {
        this.logService = logService;
    }

    /**
     * Lấy danh sách audit trail có tìm kiếm, lọc theo entityType, khoảng ngày và phân trang.
     */
    @GetMapping
    public ResponseEntity<ActivityLogPageResponse> getActivityLogs(
            @RequestParam(name = "query", required = false) String query,
            @RequestParam(name = "entityType", required = false) String entityType,
            @RequestParam(name = "startDate", required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(name = "endDate", required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(name = "page", defaultValue = "1") @Min(value = 1, message = "Trang phải từ 1 trở lên") int page,
            @RequestParam(name = "pageSize", defaultValue = "25") @Min(value = 1) @Max(value = 100) int pageSize
    ) {
        ActivityLogPageResponse response = logService.getActivityLogs(query, entityType, startDate, endDate, page, pageSize);
        return ResponseEntity.ok(response);
    }
}
