package com.storagehub.service.impl;

import com.storagehub.dto.activity.ActivityLogItemResponse;
import com.storagehub.dto.activity.ActivityLogPageResponse;
import com.storagehub.entity.ActivityLog;
import com.storagehub.entity.User;
import com.storagehub.repository.ActivityLogRepository;
import com.storagehub.service.LogService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;

@Service
@Transactional
public class LogServiceImpl implements LogService {

    private final ActivityLogRepository activityLogRepository;

    public LogServiceImpl(ActivityLogRepository activityLogRepository) {
        this.activityLogRepository = activityLogRepository;
    }

    @Override
    @Transactional(propagation = Propagation.REQUIRES_NEW)
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
        entry.setReason(reason != null ? reason : "N/A");

        activityLogRepository.save(entry);
    }

    @Override
    @Transactional(readOnly = true)
    public ActivityLogPageResponse getActivityLogs(
            String query,
            String entityType,
            LocalDate startDate,
            LocalDate endDate,
            int page,
            int pageSize
    ) {
        int pageIndex = Math.max(0, page - 1);
        int size = (pageSize > 0 && pageSize <= 100) ? pageSize : 25;
        Pageable pageable = PageRequest.of(pageIndex, size, Sort.by(Sort.Direction.DESC, "createdAt"));

        LocalDateTime startDateTime = startDate != null ? startDate.atStartOfDay() : null;
        LocalDateTime endDateTime = endDate != null ? endDate.atTime(LocalTime.MAX) : null;

        Page<ActivityLog> logPage = activityLogRepository.findLogs(query, entityType, startDateTime, endDateTime, pageable);

        List<ActivityLogItemResponse> items = logPage.getContent().stream()
                .map(ActivityLogItemResponse::fromEntity)
                .toList();

        return new ActivityLogPageResponse(
                items,
                page,
                size,
                logPage.getTotalElements(),
                logPage.getTotalPages()
        );
    }
}
