package com.storagehub.repository;

import com.storagehub.entity.Reservation;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface ReservationRepository extends JpaRepository<Reservation, Long> {

    Optional<Reservation> findByCode(String code);

    /** Ownership check — chỉ chủ reservation mới thấy/thanh toán. */
    Optional<Reservation> findByReservationIdAndCustomer_EmailIgnoreCase(
            Long reservationId,
            String email
    );
}
