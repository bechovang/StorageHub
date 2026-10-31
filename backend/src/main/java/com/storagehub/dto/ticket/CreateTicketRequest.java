package com.storagehub.dto.ticket;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

/** POST /api/v1/tickets — khách tạo yêu cầu hỗ trợ (FR-23). */
public record CreateTicketRequest(
        @NotBlank(message = "unitCode không được để trống")
        String unitCode,
        Long reservationId,
        @NotNull(message = "incidentType không được để trống")
        String incidentType,
        @NotBlank(message = "Vui lòng nhập mô tả sự cố")
        String description,
        String customerName,
        String customerPhone
) {
}
