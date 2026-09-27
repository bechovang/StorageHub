package com.storagehub.repository;

import com.storagehub.entity.ActivityLog;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ActivityLogRepository extends JpaRepository<ActivityLog, Long> {

    /**
     * US-10 (FR-36): marker exactly-once — side-effect EXPIRED đã áp cho
     * reservation này chưa (đặt trong tx có lock dòng reservation).
     */
    boolean existsByEntityTypeAndEntityIdAndAction(
            String entityType,
            Long entityId,
            String action
    );
}
