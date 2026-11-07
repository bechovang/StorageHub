package com.storagehub.controller;

import com.storagehub.dto.checkout.LateCheckoutActiveRentalResponse;
import com.storagehub.dto.checkout.LateCheckoutCaseResponse;
import com.storagehub.dto.checkout.LateCheckoutDecisionRequest;
import com.storagehub.entity.LateCheckoutCase;
import com.storagehub.entity.User;
import com.storagehub.exception.BusinessRuleException;
import com.storagehub.repository.UserRepository;
import com.storagehub.service.CheckoutLiquidationService;
import com.storagehub.service.LateCheckoutService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/** V42: tab manager "Trả kho & Thanh lý". */
@RestController
@RequestMapping("/api/v1/checkout-cases")
@RequiredArgsConstructor
public class CheckoutManagementController {

    private final LateCheckoutService lateCheckoutService;
    private final CheckoutLiquidationService liquidationService;
    private final UserRepository userRepository;

    @GetMapping
    public ResponseEntity<List<LateCheckoutCaseResponse>> listCases(
            Authentication authentication,
            @RequestParam(name = "status", required = false) String status,
            @RequestParam(name = "q", required = false) String query,
            @RequestParam(name = "page", defaultValue = "1") int page,
            @RequestParam(name = "page-size", defaultValue = "50") int pageSize
    ) {
        return ResponseEntity.ok(lateCheckoutService.listCases(
                requireUser(authentication), status, query, page, pageSize));
    }

    @GetMapping("/active-rentals")
    public ResponseEntity<List<LateCheckoutActiveRentalResponse>> listActiveRentals(
            Authentication authentication,
            @RequestParam(name = "q", required = false) String query,
            @RequestParam(name = "page", defaultValue = "1") int page,
            @RequestParam(name = "page-size", defaultValue = "50") int pageSize
    ) {
        return ResponseEntity.ok(lateCheckoutService.listActiveRentals(
                requireUser(authentication), query, page, pageSize));
    }

    @PostMapping("/{caseId}/decision")
    public ResponseEntity<Map<String, Object>> decide(
            Authentication authentication,
            @PathVariable Long caseId,
            @Valid @RequestBody LateCheckoutDecisionRequest request
    ) {
        User manager = requireUser(authentication);
        LateCheckoutCase current = lateCheckoutService.requireCaseForManager(manager, caseId);
        String decision = request.decision().trim().toUpperCase();
        if ("EXTEND".equals(decision)) {
            int days = request.extensionDays() == null ? 0 : request.extensionDays();
            if (days < 0 || days > 30) {
                throw new BusinessRuleException("Số ngày gia hạn phải từ 0 đến 30.");
            }
            LateCheckoutCase saved = lateCheckoutService.extend(
                    current.getReservation(), manager, days, request.reason());
            Map<String, Object> body = new HashMap<>();
            body.put("caseId", saved.getCaseId());
            body.put("status", saved.getStatus().name());
            body.put("extendedUntil", saved.getExtendedUntil());
            return ResponseEntity.ok(body);
        }
        if ("LIQUIDATE".equals(decision)) {
            liquidationService.liquidate(
                    manager,
                    current.getReservation().getReservationId(),
                    "OVERDUE",
                    request.reason() != null && !request.reason().isBlank()
                            ? request.reason() : "Thanh lý do quá hạn");
            Map<String, Object> body = new HashMap<>();
            body.put("caseId", caseId);
            body.put("status", LateCheckoutCase.Status.LIQUIDATED.name());
            return ResponseEntity.ok(body);
        }
        throw new BusinessRuleException("decision phải là EXTEND hoặc LIQUIDATE.");
    }

    private User requireUser(Authentication authentication) {
        String email = authentication != null ? authentication.getName() : "";
        return userRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new BusinessRuleException("Không tìm thấy người dùng."));
    }
}
