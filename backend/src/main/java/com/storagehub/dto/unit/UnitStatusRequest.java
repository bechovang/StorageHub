package com.storagehub.dto.unit;

import jakarta.validation.constraints.NotBlank;

/** PATCH /api/v1/units/{id}/status — đổi trạng thái (retire/maintenance/available). */
public record UnitStatusRequest(
        @NotBlank(message = "status không được để trống")
        String status,
        String reason,
        String notes
) {
}
