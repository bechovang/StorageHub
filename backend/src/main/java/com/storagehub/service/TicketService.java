package com.storagehub.service;

import com.storagehub.dto.ticket.CreateTicketRequest;
import com.storagehub.dto.ticket.TicketResponse;
import com.storagehub.dto.ticket.UpdateTicketStatusRequest;

import java.util.List;

/**
 * Ticket API (US-23/FR-23/FR-24): khách tạo ticket, staff/manager xử lý.
 * Customer chỉ thấy ticket của mình; staff/manager/admin thấy tất cả.
 */
public interface TicketService {

    List<TicketResponse> listTickets(String actorEmail, String status, String unitCode);

    TicketResponse createTicket(String actorEmail, CreateTicketRequest request);

    TicketResponse updateStatus(String actorEmail, Long ticketId, UpdateTicketStatusRequest request);
}
