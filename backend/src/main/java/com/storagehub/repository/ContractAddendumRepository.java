package com.storagehub.repository;

import com.storagehub.entity.ContractAddendum;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ContractAddendumRepository extends JpaRepository<ContractAddendum, Long> {
    List<ContractAddendum> findByContract_Reservation_ReservationIdOrderByCreatedAtAsc(Long reservationId);
}
