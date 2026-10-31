package com.storagehub.controller;

import com.storagehub.dto.reservation.BookingDraftResponse;
import com.storagehub.dto.reservation.CreateReservationRequest;
import com.storagehub.service.ReservationService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

/**
 * Giữ chỗ tạm trước khi trả cọc. Draft không phải đơn thuê — đơn chỉ sinh
 * sau khi PayOS SUCCEEDED (DepositPaymentSuccessHandler).
 */
@RestController
@RequestMapping("/api/v1/booking-drafts")
public class BookingDraftController {

    private final ReservationService reservationService;

    public BookingDraftController(ReservationService reservationService) {
        this.reservationService = reservationService;
    }

    @PostMapping
    public ResponseEntity<BookingDraftResponse> createDraft(
            @Valid @RequestBody CreateReservationRequest request,
            Authentication authentication
    ) {
        String email = authentication != null ? authentication.getName() : "";
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(reservationService.createDraft(email, request));
    }

    @GetMapping("/{draftId}")
    public ResponseEntity<BookingDraftResponse> getDraft(
            @PathVariable Long draftId,
            Authentication authentication
    ) {
        String email = authentication != null ? authentication.getName() : "";
        return ResponseEntity.ok(reservationService.getDraft(email, draftId));
    }
}
