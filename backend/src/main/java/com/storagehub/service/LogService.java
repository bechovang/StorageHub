package com.storagehub.service;

import com.storagehub.entity.User;

/**
 * Điểm ghi duy nhất cho ACTIVITY_LOGS (AD-6) — append-only, ghi đồng bộ
 * trong cùng transaction nghiệp vụ. entityType/action là registry mở (String).
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
}
