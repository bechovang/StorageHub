package com.storagehub.service;

import com.storagehub.dto.activity.ActivityLogPageResponse;
import com.storagehub.entity.User;

import java.time.LocalDate;

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

    ActivityLogPageResponse getActivityLogs(
            String query,
            String entityType,
            LocalDate startDate,
            LocalDate endDate,
            int page,
            int pageSize
    );
}
