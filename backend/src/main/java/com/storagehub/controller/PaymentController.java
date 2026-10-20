package com.storagehub.controller;

import com.storagehub.dto.payment.ConfirmPaymentRequest;
import com.storagehub.dto.payment.CreatePaymentRequest;
import com.storagehub.dto.payment.PaymentPageResponse;
import com.storagehub.dto.payment.PaymentResultResponse;
import com.storagehub.dto.payment.PaymentSessionResponse;
import com.storagehub.service.PaymentService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * US-8 (FR-8/9) — 4 endpoint khớp contracts/openapi.yaml (operationId
 * createPayment/listPayments/getPayment/confirmPayment). Identity lấy từ JWT
 * (authentication.getName() = email) — không tin userId từ request.
 */
@RestController
@RequestMapping("/api/v1/payments")
public class PaymentController {

    private final PaymentService paymentService;

    public PaymentController(PaymentService paymentService) {
        this.paymentService = paymentService;
    }

    /**
     * Public (AD-9): PayOS gọi server-to-server, xác thực bằng HMAC-SHA256
     * trong payload — không JWT. Raw body giữ nguyên để SDK verify chữ ký.
     */
    @PostMapping({"/webhooks/payos", "/webhook"})
    public ResponseEntity<Map<String, String>> payOsWebhook(
            @RequestBody String rawPayload
    ) {
        paymentService.handlePayOsWebhook(rawPayload);
        return ResponseEntity.ok(Map.of("code", "00", "desc", "success"));
    }

    @PostMapping
    public ResponseEntity<PaymentSessionResponse> createPayment(
            Authentication authentication,
            @Valid @RequestBody CreatePaymentRequest request
    ) {
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(paymentService.createPayment(
                        authentication.getName(), request));
    }

    @GetMapping
    public ResponseEntity<PaymentPageResponse> listPayments(
            Authentication authentication,
            @RequestParam(name = "reservation-id", required = false)
            Long reservationId,
            @RequestParam(defaultValue = "1")
            @Min(1) int page,
            @RequestParam(name = "page-size", defaultValue = "25")
            @Min(1) @Max(100) int pageSize
    ) {
        return ResponseEntity.ok(paymentService.listPayments(
                authentication.getName(), reservationId, page, pageSize));
    }

    @GetMapping("/{paymentId}")
    public ResponseEntity<PaymentSessionResponse> getPayment(
            Authentication authentication,
            @PathVariable Long paymentId
    ) {
        return ResponseEntity.ok(paymentService.getPayment(
                authentication.getName(), paymentId));
    }

    @PostMapping("/{paymentId}/confirm")
    public ResponseEntity<PaymentResultResponse> confirmPayment(
            Authentication authentication,
            @PathVariable Long paymentId,
            @Valid @RequestBody ConfirmPaymentRequest request
    ) {
        return ResponseEntity.ok(paymentService.confirmPayment(
                authentication.getName(), paymentId, request));
    }
}
