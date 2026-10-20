package com.storagehub.dto.user;

import com.storagehub.entity.ActivityLog;
import java.time.LocalDateTime;

public record LoginHistoryItemResponse(
        Long logId,
        Long userId,
        String fullName,
        String email,
        String role,
        String action,
        String status,
        String reason,
        LocalDateTime timestamp
) {
    public static LoginHistoryItemResponse fromEntity(ActivityLog log) {
        Long userId = log.getActor() != null ? log.getActor().getUserId() : null;
        String fullName = log.getActor() != null ? log.getActor().getFullName() : "Hệ thống";
        String email = log.getActor() != null ? log.getActor().getEmail() : null;
        String role = (log.getActor() != null && log.getActor().getRole() != null && log.getActor().getRole().getName() != null)
                ? log.getActor().getRole().getName().name()
                : null;

        return new LoginHistoryItemResponse(
                log.getLogId(),
                userId,
                fullName,
                email,
                role,
                log.getAction(),
                log.getToValue() != null ? log.getToValue() : ("LOGIN".equals(log.getAction()) ? "SUCCESS" : "FAILED"),
                log.getReason(),
                log.getCreatedAt()
        );
    }
}
