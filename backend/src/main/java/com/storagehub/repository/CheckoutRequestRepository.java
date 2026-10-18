package com.storagehub.repository;

import com.storagehub.entity.CheckoutRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CheckoutRequestRepository extends JpaRepository<CheckoutRequest, Long> {

    List<CheckoutRequest> findByReservation_ReservationIdOrderByCreatedAtDesc(Long reservationId);

    Optional<CheckoutRequest> findFirstByReservation_ReservationIdAndStatusOrderByCreatedAtDesc(
            Long reservationId,
            CheckoutRequest.Status status
    );

    List<CheckoutRequest> findByReservation_ReservationIdAndStatus(
            Long reservationId,
            CheckoutRequest.Status status
    );
}
