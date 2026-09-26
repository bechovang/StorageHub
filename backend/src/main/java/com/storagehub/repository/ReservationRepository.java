package com.storagehub.repository;

import com.storagehub.entity.Reservation;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.Optional;

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
}
