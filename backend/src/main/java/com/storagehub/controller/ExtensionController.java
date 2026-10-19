package com.storagehub.controller;

import com.storagehub.dto.extension.ExtensionQuoteResponse;
import com.storagehub.dto.extension.ExtensionRequest;
import com.storagehub.service.ExtensionService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * US-18 (FR-16): tạo yêu cầu gia hạn — bước 1/2. Response là bảng tính
 * server-truth + extensionId; FE mở Payment Modal sẵn có với purpose
 * EXTENSION_FEE (bước 2/2). Customer-only ownership kiểm tra trong service.
 */
@RestController
@RequestMapping("/api/v1/reservations")
public class ExtensionController {

    private final ExtensionService extensionService;

    public ExtensionController(ExtensionService extensionService) {
        this.extensionService = extensionService;
    }

    @PostMapping("/{reservationId}/extensions")
    public ResponseEntity<ExtensionQuoteResponse> requestExtension(
            @PathVariable Long reservationId,
            @Valid @RequestBody ExtensionRequest request,
            org.springframework.security.core.Authentication authentication
    ) {
        String email = authentication != null ? authentication.getName() : "";
        return ResponseEntity.ok(
                extensionService.createRequest(email, reservationId, request.newEndDate()));
    }
}
