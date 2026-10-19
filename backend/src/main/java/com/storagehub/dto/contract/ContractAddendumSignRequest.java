package com.storagehub.dto.contract;

import jakarta.validation.constraints.NotBlank;

/**
 * Request body cho API ký phụ lục hợp đồng tại quầy (FR-12, US-19).
 * signedPhotoUrl là bắt buộc theo Snap-back rule.
 */
public record ContractAddendumSignRequest(
        @NotBlank(message = "Ảnh chụp bản ký phụ lục không được để trống")
        String signedPhotoUrl,
        String notes
) {
}
