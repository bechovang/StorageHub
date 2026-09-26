package com.storagehub.controller;

import com.storagehub.dto.reservation.CheckInPassResponse;
import com.storagehub.dto.reservation.ReservationPageResponse;
import com.storagehub.service.ReservationService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/reservations")
public class ReservationController {

    private final ReservationService reservationService;

    public ReservationController(ReservationService reservationService) {
        this.reservationService = reservationService;
    }

    @GetMapping
    public ResponseEntity<ReservationPageResponse> listMyReservations(
            @RequestParam(name = "group", defaultValue = "active") String group,
            @RequestParam(name = "page", defaultValue = "1") int page,
            @RequestParam(name = "page-size", defaultValue = "25") int pageSize,
            Authentication authentication
    ) {
        return ResponseEntity.ok(
                reservationService.listMyReservations(
                        authentication.getName(),
                        group,
                        page,
                        pageSize
                )
        );
    }

    @GetMapping("/{reservationId}/check-in-pass")
    public ResponseEntity<CheckInPassResponse> getCheckInPass(
            @PathVariable("reservationId") Long reservationId,
            Authentication authentication
    ) {
        return ResponseEntity.ok(
                reservationService.getCheckInPass(
                        authentication.getName(),
                        reservationId
                )
        );
    }
}
