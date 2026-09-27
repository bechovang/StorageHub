package com.storagehub.controller;

import com.storagehub.dto.reservation.CheckInPassResponse;
import com.storagehub.dto.reservation.CreateReservationRequest;
import com.storagehub.dto.reservation.ReservationDetailResponse;
import com.storagehub.dto.reservation.ReservationPageResponse;
import com.storagehub.service.ReservationService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
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

    @PostMapping
    public ResponseEntity<ReservationDetailResponse> createReservation(
            @Valid @RequestBody CreateReservationRequest request,
            Authentication authentication
    ) {
        String email = authentication != null ? authentication.getName() : "";
        ReservationDetailResponse response = reservationService.createReservation(
                email,
                request
        );
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping
    public ResponseEntity<ReservationPageResponse> listMyReservations(
            @RequestParam(name = "group", defaultValue = "active") String group,
            @RequestParam(name = "page", defaultValue = "1") int page,
            @RequestParam(name = "page-size", defaultValue = "25") int pageSize,
            Authentication authentication
    ) {
        String email = authentication != null ? authentication.getName() : "";
        return ResponseEntity.ok(
                reservationService.listMyReservations(
                        email,
                        group,
                        page,
                        pageSize
                )
        );
    }

    @GetMapping("/{reservationId}")
    public ResponseEntity<ReservationDetailResponse> getReservation(
            @PathVariable("reservationId") Long reservationId,
            Authentication authentication
    ) {
        String email = authentication != null ? authentication.getName() : "";
        return ResponseEntity.ok(
                reservationService.getReservationDetail(
                        email,
                        reservationId
                )
        );
    }

    @GetMapping("/{reservationId}/check-in-pass")
    public ResponseEntity<CheckInPassResponse> getCheckInPass(
            @PathVariable("reservationId") Long reservationId,
            Authentication authentication
    ) {
        String email = authentication != null ? authentication.getName() : "";
        return ResponseEntity.ok(
                reservationService.getCheckInPass(
                        email,
                        reservationId
                )
        );
    }
}
