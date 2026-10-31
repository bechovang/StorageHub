package com.storagehub.controller;

import com.storagehub.dto.policy.PolicyActiveResponse;
import com.storagehub.dto.policy.PolicySaveRequest;
import com.storagehub.service.PolicyAdminService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Policy API — quản trị chính sách giá (BUSINESS_OPS / SYSTEM_ADMIN, xem
 * SecurityConfig). Lưu = phiên bản mới; reset = khôi phục bộ seed mặc định.
 */
@RestController
@RequestMapping("/api/v1/policies")
@RequiredArgsConstructor
public class PolicyController {

    private final PolicyAdminService policyAdminService;

    @GetMapping("/active")
    public ResponseEntity<PolicyActiveResponse> getActivePolicy() {
        return ResponseEntity.ok(policyAdminService.getActivePolicy());
    }

    @PostMapping
    public ResponseEntity<PolicyActiveResponse> savePolicy(
            @Valid @RequestBody PolicySaveRequest request,
            Authentication authentication
    ) {
        String actor = resolveActor(request.updatedBy(), authentication);
        return ResponseEntity.ok(policyAdminService.savePolicy(request, actor));
    }

    @PostMapping("/reset")
    public ResponseEntity<PolicyActiveResponse> resetPolicy(
            Authentication authentication
    ) {
        return ResponseEntity.ok(policyAdminService.resetToDefault(
                authentication != null ? authentication.getName() : "system"));
    }

    private String resolveActor(String updatedBy, Authentication authentication) {
        if (authentication != null && authentication.getName() != null) {
            return authentication.getName();
        }
        return updatedBy != null ? updatedBy : "system";
    }
}
