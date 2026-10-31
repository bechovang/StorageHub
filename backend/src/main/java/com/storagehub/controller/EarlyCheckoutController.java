package com.storagehub.controller;

import com.storagehub.dto.checkout.ForcedCheckoutRequest;
import com.storagehub.dto.checkout.TransferRequest;
import com.storagehub.dto.checkout.TransferResponse;
import com.storagehub.entity.Reservation;
import com.storagehub.entity.User;
import com.storagehub.exception.BusinessRuleException;
import com.storagehub.repository.UserRepository;
import com.storagehub.service.EarlyCheckoutService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

/**
 * Early Checkout + Đổi kho (US quản trị — FACILITY_MANAGER/SYSTEM_ADMIN,
 * service tự check role;SecurityConfig chặn /users & /policies riêng).
 */
@RestController
@RequestMapping("/api/v1/reservations")
@RequiredArgsConstructor
public class EarlyCheckoutController {

    private final EarlyCheckoutService earlyCheckoutService;
    private final UserRepository userRepository;

    @PostMapping("/{reservationId}/checkout-request/forced")
    public ResponseEntity<Map<String, Object>> forcedCheckout(
            @PathVariable Long reservationId,
            @Valid @RequestBody ForcedCheckoutRequest request,
            Authentication authentication
    ) {
        Reservation reservation = earlyCheckoutService.forcedCheckout(
                requireUser(authentication), reservationId, request);
        return ResponseEntity.ok(Map.of(
                "reservationId", reservation.getReservationId(),
                "code", reservation.getCode(),
                "status", reservation.getStatus().name()
        ));
    }

    @PostMapping("/transfer")
    public ResponseEntity<TransferResponse> transfer(
            @Valid @RequestBody TransferRequest request,
            Authentication authentication
    ) {
        return ResponseEntity.ok(earlyCheckoutService.transfer(
                requireUser(authentication), request));
    }

    private User requireUser(Authentication authentication) {
        String email = authentication != null ? authentication.getName() : null;
        return userRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new BusinessRuleException("Không tìm thấy người dùng."));
    }
}
