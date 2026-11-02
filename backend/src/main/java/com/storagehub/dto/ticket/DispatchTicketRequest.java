package com.storagehub.dto.ticket;

import java.time.LocalDate;

/** Manager điều phối ticket ESCALATED. */
public record DispatchTicketRequest(
        String mode,
        String managerPlan,
        Long newUnitId,
        LocalDate newStartDate,
        LocalDate newEndDate
) {}
