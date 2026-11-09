package com.storagehub.repository;

import com.storagehub.entity.ActivityLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.Collection;

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

    /**
     * FR-28: audit trail có search (actor / action / reason / mã đối tượng),
     * lọc entity type, khoảng ngày và phạm vi cơ sở.
     */
    @Query(value = """
        SELECT l FROM ActivityLog l
        JOIN FETCH l.actor a
        JOIN FETCH a.role r
        WHERE (:query IS NULL OR :query = ''
               OR LOWER(a.fullName) LIKE LOWER(CONCAT('%', :query, '%'))
               OR LOWER(a.email) LIKE LOWER(CONCAT('%', :query, '%'))
               OR LOWER(l.action) LIKE LOWER(CONCAT('%', :query, '%'))
               OR (l.reason IS NOT NULL AND LOWER(l.reason) LIKE LOWER(CONCAT('%', :query, '%')))
               OR (:numericQuery IS NOT NULL AND l.entityId = :numericQuery)
               OR (l.entityType = 'UNIT' AND EXISTS (
                       SELECT u.unitId FROM Unit u
                       WHERE u.unitId = l.entityId
                         AND LOWER(u.code) LIKE LOWER(CONCAT('%', :query, '%'))))
               OR (l.entityType = 'RESERVATION' AND EXISTS (
                       SELECT r.reservationId FROM Reservation r
                       WHERE r.reservationId = l.entityId
                         AND LOWER(r.code) LIKE LOWER(CONCAT('%', :query, '%'))))
               OR (l.entityType = 'CONTRACT' AND EXISTS (
                       SELECT c.contractId FROM Contract c
                       WHERE c.contractId = l.entityId
                         AND LOWER(c.code) LIKE LOWER(CONCAT('%', :query, '%'))))
               OR (l.entityType = 'TICKET' AND EXISTS (
                       SELECT t.ticketId FROM SupportTicket t
                       WHERE t.ticketId = l.entityId
                         AND LOWER(t.code) LIKE LOWER(CONCAT('%', :query, '%')))))
          AND (:allEntities = TRUE OR l.entityType IN :entityTypes)
          AND (:facilityId IS NULL OR l.facility.facilityId = :facilityId)
          AND (:startDate IS NULL OR l.createdAt >= :startDate)
          AND (:endDate IS NULL OR l.createdAt <= :endDate)
        ORDER BY l.createdAt DESC
    """,
    countQuery = """
        SELECT COUNT(l) FROM ActivityLog l
        JOIN l.actor a
        WHERE (:query IS NULL OR :query = ''
               OR LOWER(a.fullName) LIKE LOWER(CONCAT('%', :query, '%'))
               OR LOWER(a.email) LIKE LOWER(CONCAT('%', :query, '%'))
               OR LOWER(l.action) LIKE LOWER(CONCAT('%', :query, '%'))
               OR (l.reason IS NOT NULL AND LOWER(l.reason) LIKE LOWER(CONCAT('%', :query, '%')))
               OR (:numericQuery IS NOT NULL AND l.entityId = :numericQuery)
               OR (l.entityType = 'UNIT' AND EXISTS (
                       SELECT u.unitId FROM Unit u
                       WHERE u.unitId = l.entityId
                         AND LOWER(u.code) LIKE LOWER(CONCAT('%', :query, '%'))))
               OR (l.entityType = 'RESERVATION' AND EXISTS (
                       SELECT r.reservationId FROM Reservation r
                       WHERE r.reservationId = l.entityId
                         AND LOWER(r.code) LIKE LOWER(CONCAT('%', :query, '%'))))
               OR (l.entityType = 'CONTRACT' AND EXISTS (
                       SELECT c.contractId FROM Contract c
                       WHERE c.contractId = l.entityId
                         AND LOWER(c.code) LIKE LOWER(CONCAT('%', :query, '%'))))
               OR (l.entityType = 'TICKET' AND EXISTS (
                       SELECT t.ticketId FROM SupportTicket t
                       WHERE t.ticketId = l.entityId
                         AND LOWER(t.code) LIKE LOWER(CONCAT('%', :query, '%')))))
          AND (:allEntities = TRUE OR l.entityType IN :entityTypes)
          AND (:facilityId IS NULL OR l.facility.facilityId = :facilityId)
          AND (:startDate IS NULL OR l.createdAt >= :startDate)
          AND (:endDate IS NULL OR l.createdAt <= :endDate)
    """)
    Page<ActivityLog> findLogs(
            @Param("query") String query,
            @Param("numericQuery") Long numericQuery,
            @Param("allEntities") boolean allEntities,
            @Param("entityTypes") Collection<String> entityTypes,
            @Param("facilityId") Long facilityId,
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate,
            Pageable pageable
    );

    /**
     * KPI — số bản ghi trong phạm vi cơ sở của người xem (không áp filter/search).
     */
    @Query("""
        SELECT COUNT(l) FROM ActivityLog l
        WHERE (:facilityId IS NULL OR l.facility.facilityId = :facilityId)
    """)
    long countInScope(@Param("facilityId") Long facilityId);

    /**
     * KPI — số bản ghi có action thuộc nhóm (chuyển trạng thái / bảo mật).
     */
    @Query("""
        SELECT COUNT(l) FROM ActivityLog l
        WHERE (:facilityId IS NULL OR l.facility.facilityId = :facilityId)
          AND l.action IN :actions
    """)
    long countInScopeByActions(
            @Param("facilityId") Long facilityId,
            @Param("actions") Collection<String> actions
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
