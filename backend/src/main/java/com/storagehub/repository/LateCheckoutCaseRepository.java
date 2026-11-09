package com.storagehub.repository;

import com.storagehub.entity.LateCheckoutCase;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Repository
public interface LateCheckoutCaseRepository extends JpaRepository<LateCheckoutCase, Long> {

    Optional<LateCheckoutCase> findByReservation_ReservationId(Long reservationId);

    List<LateCheckoutCase> findByStatusInOrderByDaysLateDesc(Collection<LateCheckoutCase.Status> statuses);

    @Query("""
        SELECT c FROM LateCheckoutCase c
        JOIN FETCH c.reservation r
        JOIN FETCH r.customer
        JOIN FETCH r.unit u
        JOIN FETCH u.type
        JOIN FETCH u.zone z
        JOIN FETCH z.facility
        WHERE c.status IN :statuses
        ORDER BY c.daysLate DESC, c.createdAt ASC
    """)
    List<LateCheckoutCase> findWithDetailsByStatusIn(
            @Param("statuses") Collection<LateCheckoutCase.Status> statuses
    );

    @Query("""
        SELECT c FROM LateCheckoutCase c
        JOIN FETCH c.reservation r
        JOIN FETCH r.customer
        JOIN FETCH r.unit u
        JOIN FETCH u.type
        JOIN FETCH u.zone z
        JOIN FETCH z.facility
        ORDER BY c.createdAt DESC
    """)
    List<LateCheckoutCase> findAllWithDetails();

    @Query("""
        SELECT c FROM LateCheckoutCase c
        JOIN FETCH c.reservation r
        JOIN FETCH r.customer
        JOIN FETCH r.unit u
        JOIN FETCH u.type
        JOIN FETCH u.zone z
        JOIN FETCH z.facility
        LEFT JOIN FETCH c.settlement
        WHERE c.caseId = :caseId
    """)
    Optional<LateCheckoutCase> findWithDetailsById(@Param("caseId") Long caseId);
}
