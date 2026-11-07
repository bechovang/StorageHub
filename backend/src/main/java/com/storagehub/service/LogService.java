package com.storagehub.service;

import com.storagehub.dto.activity.ActivityLogPageResponse;
import com.storagehub.entity.User;

import java.time.LocalDate;
import java.util.List;

/**
 * Điểm ghi duy nhất cho ACTIVITY_LOGS (AD-6) — append-only, ghi đồng bộ
 * trong cùng transaction nghiệp vụ. entityType/action là registry mở (String).
 * Cung cấp API xem nhật ký hoạt động (FR-28 / NFR-6).
 */
public interface LogService {

    void log(
            User actor,
            String entityType,
            Long entityId,
            String action,
            String fromValue,
            String toValue,
            String reason
    );

    /**
     * @param entityTypes      danh sách entity type cần lọc; rỗng = tất cả
     * @param scopeFacilityId  null = toàn hệ thống; khác null = chỉ cơ sở đó
     */
    ActivityLogPageResponse getActivityLogs(
            String query,
            List<String> entityTypes,
            LocalDate startDate,
            LocalDate endDate,
            Long scopeFacilityId,
            int page,
            int pageSize
    );
}
