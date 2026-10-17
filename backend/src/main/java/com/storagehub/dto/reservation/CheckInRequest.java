package com.storagehub.dto.reservation;

import jakarta.validation.constraints.NotBlank;

/**
 * US-15 (FR-11): ảnh bản ký là điều kiện cấp Access Code — bắt buộc.
 * Attachments upload endpoint thuộc Sprint 2 khác; URL giữ shape như seed
 * (/storage/contracts/CT-...-signed.jpg).
 */
public record CheckInRequest(
        @NotBlank(message = "signedPhotoUrl is required")
        String signedPhotoUrl
) {
}
