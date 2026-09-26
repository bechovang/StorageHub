package com.storagehub.service.impl;

import com.storagehub.entity.ActivityLog;
import com.storagehub.entity.User;
import com.storagehub.repository.ActivityLogRepository;
import com.storagehub.service.LogService;
import org.springframework.stereotype.Service;

/** TỐI THIỂU cho US-8 — US sau bổ sung registry action + reason bắt buộc theo loại. */
@Service
public class LogServiceImpl implements LogService {

    private final ActivityLogRepository activityLogRepository;

    public LogServiceImpl(ActivityLogRepository activityLogRepository) {
        this.activityLogRepository = activityLogRepository;
    }

    @Override
    public void log(
            User actor,
            String entityType,
            Long entityId,
            String action,
            String fromValue,
            String toValue,
            String reason
    ) {
        ActivityLog entry = new ActivityLog();
        entry.setActor(actor);
        entry.setEntityType(entityType);
        entry.setEntityId(entityId);
        entry.setAction(action);
        entry.setFromValue(fromValue);
        entry.setToValue(toValue);
        entry.setReason(reason);

        activityLogRepository.save(entry);
    }
}
