package com.storagehub.controller;

import com.storagehub.dto.unit.UnitAdminRequest;
import com.storagehub.dto.unit.UnitAdminResponse;
import com.storagehub.dto.unit.UnitStatusRequest;
import com.storagehub.entity.Role;
import com.storagehub.entity.User;
import com.storagehub.exception.BusinessRuleException;
import com.storagehub.repository.UserRepository;
import com.storagehub.service.UnitManagementService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * Unit management API — quyền ghi: FACILITY_MANAGER / BUSINESS_OPS /
 * SYSTEM_ADMIN (SecurityConfig chặn theo method); GET mở cho list admin.
 */
@RestController
@RequestMapping("/api/v1/units")
@RequiredArgsConstructor
public class UnitManagementController {

    private final UnitManagementService unitManagementService;
    private final UserRepository userRepository;

    @GetMapping("/admin")
    public ResponseEntity<List<UnitAdminResponse>> listUnits() {
        return ResponseEntity.ok(unitManagementService.listUnits());
    }

    @PostMapping
    public ResponseEntity<UnitAdminResponse> createUnit(
            Authentication authentication,
            @Valid @RequestBody UnitAdminRequest request
    ) {
        return ResponseEntity.ok(unitManagementService.createUnit(
                requireUser(authentication), request));
    }

    @PatchMapping("/{unitId}/status")
    public ResponseEntity<UnitAdminResponse> changeStatus(
            Authentication authentication,
            @PathVariable Long unitId,
            @Valid @RequestBody UnitStatusRequest request
    ) {
        return ResponseEntity.ok(unitManagementService.changeStatus(
                requireUser(authentication), unitId, request));
    }

    @PatchMapping("/{unitId}")
    public ResponseEntity<UnitAdminResponse> updateSpecs(
            Authentication authentication,
            @PathVariable Long unitId,
            @RequestBody UnitAdminRequest request
    ) {
        return ResponseEntity.ok(unitManagementService.updateSpecs(
                requireUser(authentication), unitId, request));
    }

    @DeleteMapping("/{unitId}")
    public ResponseEntity<UnitAdminResponse> retireUnit(
            Authentication authentication,
            @PathVariable Long unitId,
            @RequestBody(required = false) UnitAdminRequest request
    ) {
        String reason = request != null ? request.reason() : null;
        return ResponseEntity.ok(unitManagementService.retireUnit(
                requireUser(authentication), unitId, reason));
    }

    private User requireUser(Authentication authentication) {
        String email = authentication != null ? authentication.getName() : null;
        return userRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new BusinessRuleException("Không tìm thấy người dùng."));
    }
}
