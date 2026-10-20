package com.storagehub.repository;

import com.storagehub.entity.ActivityLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;

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

    @Query(value = """
        SELECT l FROM ActivityLog l
        JOIN FETCH l.actor a
        JOIN FETCH a.role r
        WHERE l.action IN ('LOGIN', 'LOGIN_FAILED')
          AND (:userId IS NULL OR a.userId = :userId)
          AND (:status IS NULL OR :status = '' OR UPPER(l.toValue) = UPPER(:status))
          AND (:query IS NULL OR :query = '' 
               OR LOWER(a.fullName) LIKE LOWER(CONCAT('%', :query, '%'))
               OR LOWER(a.email) LIKE LOWER(CONCAT('%', :query, '%'))
               OR (l.reason IS NOT NULL AND LOWER(l.reason) LIKE LOWER(CONCAT('%', :query, '%'))))
          AND (:startDate IS NULL OR l.createdAt >= :startDate)
          AND (:endDate IS NULL OR l.createdAt <= :endDate)
        ORDER BY l.createdAt DESC
    """,
    countQuery = """
        SELECT COUNT(l) FROM ActivityLog l
        JOIN l.actor a
        WHERE l.action IN ('LOGIN', 'LOGIN_FAILED')
          AND (:userId IS NULL OR a.userId = :userId)
          AND (:status IS NULL OR :status = '' OR UPPER(l.toValue) = UPPER(:status))
          AND (:query IS NULL OR :query = '' 
               OR LOWER(a.fullName) LIKE LOWER(CONCAT('%', :query, '%'))
               OR LOWER(a.email) LIKE LOWER(CONCAT('%', :query, '%'))
               OR (l.reason IS NOT NULL AND LOWER(l.reason) LIKE LOWER(CONCAT('%', :query, '%'))))
          AND (:startDate IS NULL OR l.createdAt >= :startDate)
          AND (:endDate IS NULL OR l.createdAt <= :endDate)
    """)
    Page<ActivityLog> findLoginHistory(
            @Param("userId") Long userId,
            @Param("status") String status,
            @Param("query") String query,
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate,
            Pageable pageable
    );
}
