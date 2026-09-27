package com.storagehub.repository;

import com.storagehub.entity.Reservation;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Repository
public interface ReservationRepository extends JpaRepository<Reservation, Long> {

    @Query(value = """
        SELECT r FROM Reservation r
        LEFT JOIN FETCH r.unit u
        LEFT JOIN FETCH u.type
        WHERE r.customer.userId = :customerId
          AND (
            r.status IN (com.storagehub.entity.Reservation.Status.PENDING_PAYMENT,
                         com.storagehub.entity.Reservation.Status.CHECKED_IN,
                         com.storagehub.entity.Reservation.Status.CHECKOUT_REQUESTED)
            OR (r.status = com.storagehub.entity.Reservation.Status.RESERVED AND r.startDate >= :today)
          )
    """,
    countQuery = """
        SELECT count(r) FROM Reservation r
        WHERE r.customer.userId = :customerId
          AND (
            r.status IN (com.storagehub.entity.Reservation.Status.PENDING_PAYMENT,
                         com.storagehub.entity.Reservation.Status.CHECKED_IN,
                         com.storagehub.entity.Reservation.Status.CHECKOUT_REQUESTED)
            OR (r.status = com.storagehub.entity.Reservation.Status.RESERVED AND r.startDate >= :today)
          )
    """)
    Page<Reservation> findActiveReservations(
            @Param("customerId") Long customerId,
            @Param("today") LocalDate today,
            Pageable pageable
    );

    @Query(value = """
        SELECT r FROM Reservation r
        LEFT JOIN FETCH r.unit u
        LEFT JOIN FETCH u.type
        WHERE r.customer.userId = :customerId
          AND (
            r.status IN (com.storagehub.entity.Reservation.Status.CLOSED,
                         com.storagehub.entity.Reservation.Status.EXPIRED)
            OR (r.status = com.storagehub.entity.Reservation.Status.RESERVED AND r.startDate < :today)
          )
    """,
    countQuery = """
        SELECT count(r) FROM Reservation r
        WHERE r.customer.userId = :customerId
          AND (
            r.status IN (com.storagehub.entity.Reservation.Status.CLOSED,
                         com.storagehub.entity.Reservation.Status.EXPIRED)
            OR (r.status = com.storagehub.entity.Reservation.Status.RESERVED AND r.startDate < :today)
          )
    """)
    Page<Reservation> findHistoryReservations(
            @Param("customerId") Long customerId,
            @Param("today") LocalDate today,
            Pageable pageable
    );

    @Query("""
        SELECT r FROM Reservation r
        LEFT JOIN FETCH r.unit u
        LEFT JOIN FETCH u.type
        LEFT JOIN FETCH u.zone z
        LEFT JOIN FETCH z.facility
        LEFT JOIN FETCH r.customer
        WHERE r.reservationId = :reservationId
    """)
    Optional<Reservation> findWithDetailsById(@Param("reservationId") Long reservationId);

    /**
     * Lấy các reservation đang hoạt động của danh sách units để kiểm tra overlap.
     */
    @Query("SELECT r FROM Reservation r " +
            "WHERE r.unit.unitId IN :unitIds " +
            "AND r.status IN :activeStatuses")
    List<Reservation> findActiveReservationsForUnits(
            @Param("unitIds") Collection<Long> unitIds,
            @Param("activeStatuses") Collection<Reservation.Status> activeStatuses
    );

    /**
     * Lấy reservation closed gần nhất của unit để tính mốc thời gian hoàn thành dọn dẹp (Turnover Buffer).
     */
    @Query("SELECT r FROM Reservation r " +
            "WHERE r.unit.unitId = :unitId " +
            "AND r.status = com.storagehub.entity.Reservation.Status.CLOSED " +
            "ORDER BY r.endDate DESC")
    List<Reservation> findLatestClosedReservations(@Param("unitId") Long unitId);

    /**
     * Lấy các reservation đang hoạt động của 1 unit để kiểm tra overlap.
     */
    @Query("SELECT r FROM Reservation r " +
            "WHERE r.unit.unitId = :unitId " +
            "AND r.status IN :activeStatuses")
    List<Reservation> findActiveReservationsForUnit(
            @Param("unitId") Long unitId,
            @Param("activeStatuses") Collection<Reservation.Status> activeStatuses
    );

    boolean existsByCode(String code);
}
