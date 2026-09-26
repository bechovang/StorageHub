package com.storagehub.service.impl;

import com.storagehub.entity.Reservation;
import com.storagehub.repository.ReservationRepository;
import com.storagehub.service.ReservationService;
import org.springframework.stereotype.Service;

/**
 * TỐI THIỂU cho US-8 (deposit flip). US-9/US-10 (cùng An phụ trách) sẽ thêm
 * booking + lifecycle + EXPIRED no-show on-read. KHÔNG flip Unit ở đây —
 * thuộc UnitService (phối US-9).
 */
@Service
public class ReservationServiceImpl implements ReservationService {

    private final ReservationRepository reservationRepository;

    public ReservationServiceImpl(ReservationRepository reservationRepository) {
        this.reservationRepository = reservationRepository;
    }

    @Override
    public Reservation markDepositPaid(Reservation reservation) {
        if (reservation.getStatus() != Reservation.Status.PENDING_PAYMENT) {
            throw new IllegalStateException(
                    "Reservation " + reservation.getCode()
                            + " is not PENDING_PAYMENT (current: "
                            + reservation.getStatus() + ")"
            );
        }

        reservation.setStatus(Reservation.Status.RESERVED);
        return reservationRepository.save(reservation);
    }
}
