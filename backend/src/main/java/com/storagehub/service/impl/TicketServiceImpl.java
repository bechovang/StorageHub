package com.storagehub.service.impl;

import com.storagehub.dto.ticket.CreateTicketRequest;
import com.storagehub.dto.ticket.TicketResponse;
import com.storagehub.dto.ticket.UpdateTicketStatusRequest;
import com.storagehub.entity.Reservation;
import com.storagehub.entity.Role;
import com.storagehub.entity.SupportTicket;
import com.storagehub.entity.Unit;
import com.storagehub.entity.User;
import com.storagehub.exception.BusinessRuleException;
import com.storagehub.exception.UnitNotFoundException;
import com.storagehub.repository.ReservationRepository;
import com.storagehub.repository.SupportTicketRepository;
import com.storagehub.repository.UnitRepository;
import com.storagehub.repository.UserRepository;
import com.storagehub.service.LogService;
import com.storagehub.service.NotificationService;
import com.storagehub.service.TicketService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.Arrays;
import java.util.List;
import java.util.Locale;
import java.util.concurrent.ThreadLocalRandom;

@Service
@RequiredArgsConstructor
public class TicketServiceImpl implements TicketService {

    private static final ZoneId ICT_ZONE = ZoneId.of("Asia/Ho_Chi_Minh");

    private final SupportTicketRepository ticketRepository;
    private final UnitRepository unitRepository;
    private final ReservationRepository reservationRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;
    private final LogService logService;
    private final com.storagehub.service.TaskService taskService;

    @Override
    @Transactional(readOnly = true)
    public List<TicketResponse> listTickets(String actorEmail, String status, String unitCode) {
        User actor = requireUser(actorEmail);
        List<SupportTicket> tickets = ticketRepository.findByStatusInWithDetails(
                Arrays.asList(SupportTicket.Status.values()));

        return tickets.stream()
                // Customer chỉ thấy ticket của chính mình (không tin param từ FE)
                .filter(t -> isStaff(actor) || t.getCustomer().getUserId().equals(actor.getUserId()))
                .filter(t -> status == null || status.isBlank()
                        || t.getStatus().name().equalsIgnoreCase(status))
                .filter(t -> unitCode == null || unitCode.isBlank()
                        || (t.getUnit() != null && t.getUnit().getCode().equalsIgnoreCase(unitCode)))
                .map(TicketResponse::from)
                .toList();
    }

    @Override
    @Transactional
    public TicketResponse createTicket(String actorEmail, CreateTicketRequest request) {
        User customer = requireUser(actorEmail);
        Unit unit = unitRepository.findByCode(request.unitCode().trim().toUpperCase(Locale.ROOT))
                .orElseThrow(() -> new UnitNotFoundException(
                        "Không tìm thấy kho " + request.unitCode() + "."));

        SupportTicket.IncidentType incidentType;
        try {
            incidentType = SupportTicket.IncidentType.valueOf(
                    request.incidentType().trim().toUpperCase(Locale.ROOT));
        } catch (IllegalArgumentException e) {
            throw new BusinessRuleException("Loại sự cố không hợp lệ: " + request.incidentType());
        }

        // FR-23: customer tạo ticket thì phải ĐANG thuê unit này. Staff/manager
        // tạo hộ (escalate Flow 7) thì bỏ check và gắn ticket với khách đang
        // thuê unit (nếu có) thay vì chính mình.
        List<Reservation> occupancies = reservationRepository.findActiveReservationsForUnit(
                unit.getUnitId(),
                List.of(Reservation.Status.CHECKED_IN, Reservation.Status.CHECKOUT_REQUESTED));
        User ticketOwner = customer;
        if (isStaff(customer)) {
            ticketOwner = occupancies.isEmpty()
                    ? customer
                    : occupancies.get(0).getCustomer();
        } else {
            boolean ownsUnit = occupancies.stream()
                    .anyMatch(r -> r.getCustomer().getUserId().equals(customer.getUserId()));
            if (!ownsUnit) {
                throw new BusinessRuleException(
                        "Yêu cầu hỗ trợ bắt buộc phải gắn với kho hợp lệ bạn đang thuê.");
            }
        }

        SupportTicket ticket = new SupportTicket();
        ticket.setCode(generateCode());
        ticket.setCustomer(ticketOwner);
        ticket.setUnit(unit);
        ticket.setIncidentType(incidentType);
        ticket.setDescription(request.description());
        ticket.setStatus(SupportTicket.Status.OPEN);
        SupportTicket saved = ticketRepository.save(ticket);

        logService.log(customer, "TICKET", saved.getTicketId(), "CREATED",
                null, "OPEN",
                "Ticket " + saved.getCode() + " — kho " + unit.getCode()
                        + " (" + incidentType + ")");
        notificationService.notifyTicketCreated(saved);

        // Vòng support 2 chiều: sinh task SUPPORT gán staff trực ca để staff
        // xử lý trên Task Board; hoàn thành task sẽ tự resolve ticket này.
        taskService.createSupportTask(saved);

        return TicketResponse.from(saved);
    }

    @Override
    @Transactional
    public TicketResponse updateStatus(String actorEmail, Long ticketId, UpdateTicketStatusRequest request) {
        User actor = requireUser(actorEmail);
        if (!isStaff(actor)) {
            throw new AccessDeniedException("Chỉ nhân viên/quản lý mới được xử lý ticket.");
        }

        SupportTicket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new BusinessRuleException("Ticket không tồn tại."));

        SupportTicket.Status newStatus;
        try {
            newStatus = SupportTicket.Status.valueOf(request.status().trim().toUpperCase(Locale.ROOT));
        } catch (IllegalArgumentException e) {
            throw new BusinessRuleException("Trạng thái không hợp lệ: " + request.status());
        }

        String oldStatus = ticket.getStatus().name();

        // assignedStaff/assignedRole hiển thị: dùng role thật của actor đang thao tác.
        if (ticket.getAssignedStaff() == null) {
            ticket.setAssignedStaff(actor);
        }

        ticket.setStatus(newStatus);
        if (request.managerPlan() != null) {
            ticket.setManagerPlan(request.managerPlan());
        }
        if (request.severityMode() != null) {
            ticket.setSeverityMode(request.severityMode());
        }
        if (request.relocatedToUnit() != null) {
            ticket.setRelocatedUnitCode(request.relocatedToUnit());
        }
        if (request.resolutionNote() != null) {
            ticket.setResolutionNote(request.resolutionNote());
        }
        if (request.escalationReason() != null) {
            ticket.setEscalationReason(request.escalationReason());
        }
        if (newStatus == SupportTicket.Status.RESOLVED) {
            ticket.setResolvedAt(LocalDateTime.now(ICT_ZONE));
        }

        SupportTicket saved = ticketRepository.save(ticket);

        logService.log(actor, "TICKET", saved.getTicketId(), "STATUS_CHANGED",
                oldStatus, newStatus.name(),
                "Ticket " + saved.getCode() + " chuyển " + oldStatus + " → " + newStatus);
        notificationService.notifyTicketStatusChanged(saved, oldStatus);

        return TicketResponse.from(saved);
    }

    private User requireUser(String email) {
        return userRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new AccessDeniedException("Không tìm thấy người dùng."));
    }

    private boolean isStaff(User user) {
        return user.getRole() != null && user.getRole().getName() != Role.Name.CUSTOMER;
    }

    /** Mã ticket SR-YYYY-NNNN duy nhất. */
    private synchronized String generateCode() {
        int year = LocalDateTime.now(ICT_ZONE).getYear();
        long count = ticketRepository.count() + 1;
        String code = String.format("SR-%d-%04d", year, count);
        while (ticketRepository.findByCode(code).isPresent()) {
            count++;
            code = String.format("SR-%d-%04d", year, count);
        }
        return code;
    }
}
