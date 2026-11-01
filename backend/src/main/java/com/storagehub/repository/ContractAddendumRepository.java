package com.storagehub.repository;

import com.storagehub.entity.ContractAddendum;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ContractAddendumRepository extends JpaRepository<ContractAddendum, Long> {
    List<ContractAddendum> findByContract_Reservation_ReservationIdOrderByCreatedAtAsc(Long reservationId);

    List<ContractAddendum> findByContract_ContractIdOrderByCreatedAtAsc(Long contractId);

    java.util.Optional<ContractAddendum> findByCode(String code);

    /** US-18: đánh số addendum CT-...-A{n} trong chuỗi của một contract. */
    long countByContract_ContractId(Long contractId);
}
