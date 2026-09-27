package com.storagehub.repository;

import com.storagehub.entity.Contract;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ContractRepository extends JpaRepository<Contract, Long> {

    List<Contract> findByReservation_ReservationId(Long reservationId);

    List<Contract> findByReservation_ReservationIdOrderByCreatedAtAsc(Long reservationId);

    Optional<Contract> findByReservation_ReservationIdAndIsLatestTrue(Long reservationId);

    @Query("""
        SELECT c FROM Contract c
        JOIN FETCH c.reservation r
        JOIN FETCH r.customer cust
        JOIN FETCH r.unit u
        JOIN FETCH u.type t
        JOIN FETCH u.zone z
        JOIN FETCH z.facility f
        JOIN FETCH c.policy p
        WHERE c.contractId = :contractId
    """)
    Optional<Contract> findWithDetailsById(@Param("contractId") Long contractId);

    boolean existsByCode(String code);
}
