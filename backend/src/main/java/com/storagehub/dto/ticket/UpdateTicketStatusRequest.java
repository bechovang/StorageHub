package com.storagehub.dto.ticket;

import jakarta.validation.constraints.NotBlank;

/**
 * PATCH /api/v1/tickets/{id}/status — staff/manager cập nhật xử lý.
 * Các trường ghi chú tùy chọn theo hành động (accept/dispatch/resolve/escalate).
 */
public record UpdateTicketStatusRequest(
        @NotBlank(message = "status không được để trống")
        String status,
        String assignedRole,
        String managerPlan,
        String severityMode,
        String relocatedToUnit,
        String resolutionNote,
        String escalationReason
) {
}
