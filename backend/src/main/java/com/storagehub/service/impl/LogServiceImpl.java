package com.storagehub.service.impl;

import com.storagehub.dto.activity.ActivityLogItemResponse;
import com.storagehub.dto.activity.ActivityLogPageResponse;
import com.storagehub.dto.activity.ActivityLogSummaryResponse;
import com.storagehub.entity.ActivityLog;
import com.storagehub.entity.Facility;
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
import java.util.Set;

@Service
@Transactional
public class LogServiceImpl implements LogService {

    /** "Chuyển trạng thái" trên dashboard kiểm toán. */
    private static final Set<String> STATUS_ACTIONS = Set.of(
            "STATUS_CHANGE", "STATUS_CHANGED", "UPDATE_SPECS", "UPDATED",
            "SET_MAINTENANCE", "FINISH_MAINTENANCE", "RETIRE_UNIT",
            "FIX_STATUS", "MANUAL_STATUS_FIX", "RELOCATE_UNIT"
    );

    /** "Sự kiện bảo mật" — đăng nhập / xác thực. */
    private static final Set<String> SECURITY_ACTIONS = Set.of(
            "LOGIN", "LOGIN_FAILED", "LOGOUT"
    );

    /** IN () rỗng không hợp lệ trong JPQL — dùng placeholder khi lọc "tất cả". */
    private static final String EMPTY_ENTITY_PLACEHOLDER = "__NONE__";

    private final ActivityLogRepository activityLogRepository;
    private final ActivityLogFacilityResolver facilityResolver;

    public LogServiceImpl(
            ActivityLogRepository activityLogRepository,
            ActivityLogFacilityResolver facilityResolver
    ) {
        this.activityLogRepository = activityLogRepository;
        this.facilityResolver = facilityResolver;
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
        Long facilityId = facilityResolver.resolve(entityType, entityId);
        if (facilityId != null) {
            Facility facility = new Facility();
            facility.setFacilityId(facilityId.intValue());
            entry.setFacility(facility);
        }
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
            List<String> entityTypes,
            LocalDate startDate,
            LocalDate endDate,
            Long scopeFacilityId,
            int page,
            int pageSize
    ) {
        int pageIndex = Math.max(0, page - 1);
        int size = (pageSize > 0 && pageSize <= 100) ? pageSize : 25;
        Pageable pageable = PageRequest.of(pageIndex, size, Sort.by(Sort.Direction.DESC, "createdAt"));

        String normalizedQuery = (query == null || query.isBlank()) ? null : query.trim();
        Long numericQuery = parseLong(normalizedQuery);

        List<String> normalizedTypes = entityTypes == null
                ? List.of()
                : entityTypes.stream()
                        .filter(type -> type != null && !type.isBlank())
                        .map(type -> {
                            String normalized = type.trim().toUpperCase();
                            // UI chip "Ca trực" ↔ entity_type STAFF_ASSIGNMENT ở DB.
                            return "SHIFT".equals(normalized) ? "STAFF_ASSIGNMENT" : normalized;
                        })
                        .distinct()
                        .toList();
        boolean allEntities = normalizedTypes.isEmpty();
        List<String> queryTypes = allEntities
                ? List.of(EMPTY_ENTITY_PLACEHOLDER)
                : normalizedTypes;

        LocalDateTime startDateTime = startDate != null ? startDate.atStartOfDay() : null;
        LocalDateTime endDateTime = endDate != null ? endDate.atTime(LocalTime.MAX) : null;

        Page<ActivityLog> logPage = activityLogRepository.findLogs(
                normalizedQuery,
                numericQuery,
                allEntities,
                queryTypes,
                scopeFacilityId,
                startDateTime,
                endDateTime,
                pageable
        );

        List<ActivityLogItemResponse> items = logPage.getContent().stream()
                .map(ActivityLogItemResponse::fromEntity)
                .toList();

        return new ActivityLogPageResponse(
                items,
                page,
                size,
                logPage.getTotalElements(),
                logPage.getTotalPages(),
                summarize(scopeFacilityId)
        );
    }

    private ActivityLogSummaryResponse summarize(Long scopeFacilityId) {
        return new ActivityLogSummaryResponse(
                activityLogRepository.countInScope(scopeFacilityId),
                activityLogRepository.countInScopeByActions(scopeFacilityId, STATUS_ACTIONS),
                activityLogRepository.countInScopeByActions(scopeFacilityId, SECURITY_ACTIONS)
        );
    }

    private static Long parseLong(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        try {
            return Long.valueOf(value.trim());
        } catch (NumberFormatException ex) {
            return null;
        }
    }
}
