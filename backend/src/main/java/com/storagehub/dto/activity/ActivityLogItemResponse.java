package com.storagehub.dto.activity;

import com.storagehub.entity.ActivityLog;
import java.time.LocalDateTime;

public record ActivityLogItemResponse(
        Long logId,
        Long actorId,
        String actorName,
        String actorEmail,
        String actorRole,
        String entityType,
        Long entityId,
        String action,
        String fromValue,
        String toValue,
        String reason,
        LocalDateTime createdAt
) {
    public static ActivityLogItemResponse fromEntity(ActivityLog log) {
        Long actorId = log.getActor() != null ? log.getActor().getUserId() : null;
        String actorName = log.getActor() != null ? log.getActor().getFullName() : "Hệ thống";
        String actorEmail = log.getActor() != null ? log.getActor().getEmail() : null;
        String actorRole = (log.getActor() != null && log.getActor().getRole() != null && log.getActor().getRole().getName() != null)
                ? log.getActor().getRole().getName().name()
                : null;

        return new ActivityLogItemResponse(
                log.getLogId(),
                actorId,
                actorName,
                actorEmail,
                actorRole,
                log.getEntityType(),
                log.getEntityId(),
                log.getAction(),
                log.getFromValue(),
                log.getToValue(),
                log.getReason(),
                log.getCreatedAt()
        );
    }
}
