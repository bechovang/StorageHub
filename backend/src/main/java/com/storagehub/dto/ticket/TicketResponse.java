package com.storagehub.dto.ticket;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.storagehub.entity.SupportTicket;

import java.time.LocalDateTime;

/**
 * Shape khớp FE ticketService: id/code/status/incidentType/description/createdAt
 * + unitCode, khách, assignedStaff (tên hiển thị) + assignedRole, ghi chú xử lý.
 */
public record TicketResponse(
        Long id,
        String code,
        String status,
        String incidentType,
        String description,
        @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd'T'HH:mm:ss")
        LocalDateTime createdAt,
        String unitCode,
        Long customerId,
        String customerName,
        String customerPhone,
        Long reservationId,
        String assignedStaff,
        String assignedRole,
        String managerPlan,
        String severityMode,
        String relocatedToUnit,
        String resolutionNote,
        String escalationReason,
        @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd'T'HH:mm:ss")
        LocalDateTime resolvedAt
) {

    public static TicketResponse from(SupportTicket t) {
        return new TicketResponse(
                t.getTicketId(),
                t.getCode(),
                t.getStatus() != null ? t.getStatus().name() : null,
                t.getIncidentType() != null ? t.getIncidentType().name() : null,
                t.getDescription(),
                t.getCreatedAt(),
                t.getUnit() != null ? t.getUnit().getCode() : null,
                t.getCustomer() != null ? t.getCustomer().getUserId() : null,
                t.getCustomer() != null ? t.getCustomer().getFullName() : null,
                t.getCustomer() != null ? t.getCustomer().getPhone() : null,
                t.getReservation() != null ? t.getReservation().getReservationId() : null,
                t.getAssignedStaff() != null ? t.getAssignedStaff().getFullName() : null,
                t.getAssignedStaff() != null && t.getAssignedStaff().getRole() != null
                        ? t.getAssignedStaff().getRole().getName().name() : null,
                t.getManagerPlan(),
                t.getSeverityMode(),
                t.getRelocatedUnitCode(),
                t.getResolutionNote(),
                t.getEscalationReason(),
                t.getResolvedAt()
        );
    }
}
