package com.storagehub.controller;

import com.storagehub.dto.activity.ActivityLogPageResponse;
import com.storagehub.entity.Role;
import com.storagehub.entity.User;
import com.storagehub.repository.UserRepository;
import com.storagehub.service.LogService;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.List;

/**
 * Controller xem nhật ký hoạt động hệ thống (FR-28 / NFR-6) — Activity Log viewer.
 * Hoàn toàn READ-ONLY (append-only, cấm cập nhật hay xóa log).
 *
 * <p>FACILITY_MANAGER chỉ thấy log thuộc cơ sở mình (NFR-4); SYSTEM_ADMIN và
 * BUSINESS_OPS thấy toàn hệ thống.
 */
@RestController
@RequestMapping("/api/v1/activity-logs")
@Validated
public class ActivityLogController {

    private final LogService logService;
    private final UserRepository userRepository;

    public ActivityLogController(LogService logService, UserRepository userRepository) {
        this.logService = logService;
        this.userRepository = userRepository;
    }

    /**
     * Lấy danh sách audit trail có tìm kiếm, lọc theo entityType, khoảng ngày và phân trang.
     */
    @GetMapping
    public ResponseEntity<ActivityLogPageResponse> getActivityLogs(
            @RequestParam(name = "query", required = false) String query,
            @RequestParam(name = "entityType", required = false) List<String> entityTypes,
            @RequestParam(name = "startDate", required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(name = "endDate", required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(name = "page", defaultValue = "1") @Min(value = 1, message = "Trang phải từ 1 trở lên") int page,
            @RequestParam(name = "pageSize", defaultValue = "25") @Min(value = 1) @Max(value = 100) int pageSize,
            Authentication authentication
    ) {
        Long scopeFacilityId = resolveScopeFacility(authentication);
        ActivityLogPageResponse response = logService.getActivityLogs(
                query,
                entityTypes,
                startDate,
                endDate,
                scopeFacilityId,
                page,
                pageSize
        );
        return ResponseEntity.ok(response);
    }

    /**
     * Manager bị giới hạn theo cơ sở; các vai trò khác (và các test không có
     * security context) xem toàn hệ thống. Manager không thuộc cơ sở nào thì
     * dùng -1 để không trả về dòng nào thay vì lộ dữ liệu toàn hệ thống.
     */
    private Long resolveScopeFacility(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return null;
        }
        User user = userRepository.findByEmailIgnoreCase(authentication.getName()).orElse(null);
        if (user == null || user.getRole() == null
                || user.getRole().getName() != Role.Name.FACILITY_MANAGER) {
            return null;
        }
        return user.getFacility() != null ? user.getFacility().getFacilityId() : -1L;
    }
}
