package com.storagehub.controller;

import com.storagehub.dto.ticket.CreateTicketRequest;
import com.storagehub.dto.ticket.TicketResponse;
import com.storagehub.dto.ticket.UpdateTicketStatusRequest;
import com.storagehub.service.TicketService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * Ticket API (US-23/FR-23/FR-24) — customer tạo/xem ticket của mình;
 * staff/manager/admin xử lý (list + PATCH status).
 */
@RestController
@RequestMapping("/api/v1/tickets")
@RequiredArgsConstructor
public class TicketController {

    private final TicketService ticketService;

    @GetMapping
    public ResponseEntity<List<TicketResponse>> listTickets(
            Authentication authentication,
            @RequestParam(name = "status", required = false) String status,
            @RequestParam(name = "unit-code", required = false) String unitCode
    ) {
        return ResponseEntity.ok(ticketService.listTickets(
                authentication.getName(), status, unitCode));
    }

    @PostMapping
    public ResponseEntity<TicketResponse> createTicket(
            Authentication authentication,
            @Valid @RequestBody CreateTicketRequest request
    ) {
        return ResponseEntity.ok(ticketService.createTicket(authentication.getName(), request));
    }

    @PatchMapping("/{ticketId}/status")
    public ResponseEntity<TicketResponse> updateStatus(
            Authentication authentication,
            @PathVariable Long ticketId,
            @Valid @RequestBody UpdateTicketStatusRequest request
    ) {
        return ResponseEntity.ok(ticketService.updateStatus(
                authentication.getName(), ticketId, request));
    }
}
