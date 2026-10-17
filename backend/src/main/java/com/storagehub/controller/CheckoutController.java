package com.storagehub.controller;

import com.storagehub.dto.checkout.CancelCheckoutResponse;
import com.storagehub.dto.checkout.CheckoutRequestResponse;
import com.storagehub.dto.checkout.CreateCheckoutRequest;
import com.storagehub.service.CheckoutService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Controller xử lý yêu cầu trả kho của khách hàng (US-20 / FR-17).
 */
@RestController
@RequestMapping("/api/v1/reservations/{reservationId}/checkout-request")
@RequiredArgsConstructor
public class CheckoutController {

    private final CheckoutService checkoutService;

    @PostMapping
    public ResponseEntity<CheckoutRequestResponse> createCheckoutRequest(
            @PathVariable("reservationId") Long reservationId,
            @Valid @RequestBody CreateCheckoutRequest request,
            Authentication authentication
    ) {
        String email = authentication != null ? authentication.getName() : "";
        CheckoutRequestResponse response = checkoutService.createCheckoutRequest(
                email,
                reservationId,
                request
        );
        return ResponseEntity.ok(response);
    }

    @DeleteMapping
    public ResponseEntity<CancelCheckoutResponse> cancelCheckoutRequest(
            @PathVariable("reservationId") Long reservationId,
            Authentication authentication
    ) {
        String email = authentication != null ? authentication.getName() : "";
        CancelCheckoutResponse response = checkoutService.cancelCheckoutRequest(
                email,
                reservationId
        );
        return ResponseEntity.ok(response);
    }

    @GetMapping
    public ResponseEntity<CheckoutRequestResponse> getLatestCheckoutRequest(
            @PathVariable("reservationId") Long reservationId,
            Authentication authentication
    ) {
        String email = authentication != null ? authentication.getName() : "";
        CheckoutRequestResponse response = checkoutService.getLatestCheckoutRequest(
                email,
                reservationId
        );
        if (response == null) {
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.ok(response);
    }
}
