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

import java.time.LocalDate;
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
    private final com.storagehub.service.EarlyCheckoutService earlyCheckoutService;
    private final com.storagehub.service.PricingEngine pricingEngine;

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

        // Gắn ticket với đơn thuê đang hoạt động để luồng RELOCATE có "kho cũ"
        // (trước đây reservation luôn null dù khách đang thuê).
        Reservation linkedReservation = occupancies.isEmpty()
                ? null
                : isStaff(customer)
                    ? occupancies.get(0)
                    : occupancies.stream()
                        .filter(r -> r.getCustomer().getUserId().equals(customer.getUserId()))
                        .findFirst()
                        .orElse(occupancies.get(0));

        SupportTicket ticket = new SupportTicket();
        ticket.setCode(generateCode());
        ticket.setCustomer(ticketOwner);
        ticket.setUnit(unit);
        ticket.setReservation(linkedReservation);
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
    public TicketResponse dispatchTicket(
            String actorEmail,
            Long ticketId,
            com.storagehub.dto.ticket.DispatchTicketRequest request
    ) {
        User actor = requireUser(actorEmail);
        if (actor.getRole() == null
                || (actor.getRole().getName() != Role.Name.FACILITY_MANAGER
                    && actor.getRole().getName() != Role.Name.SYSTEM_ADMIN)) {
            throw new AccessDeniedException("Chỉ quản lý cơ sở mới được điều phối ticket.");
        }
        SupportTicket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new BusinessRuleException("Ticket không tồn tại."));
        if (ticket.getStatus() != SupportTicket.Status.ESCALATED) {
            throw new BusinessRuleException("Chỉ ticket ESCALATED mới được quản lý điều phối.");
        }

        String mode = request.mode() == null ? "" : request.mode().trim().toUpperCase(Locale.ROOT);
        String oldStatus = ticket.getStatus().name();
        Reservation oldReservation = ticket.getReservation();
        if (oldReservation == null) {
            List<Reservation> active = reservationRepository.findActiveReservationsForUnit(
                    ticket.getUnit().getUnitId(),
                    List.of(Reservation.Status.CHECKED_IN, Reservation.Status.CHECKOUT_REQUESTED));
            oldReservation = active.isEmpty() ? null : active.get(0);
        }

        if ("INSTRUCT".equals(mode)) {
            String plan = request.managerPlan() == null ? "" : request.managerPlan().trim();
            if (plan.isEmpty()) {
                throw new BusinessRuleException("Vui lòng nhập chỉ đạo xử lý cho nhân viên.");
            }
            ticket.setStatus(SupportTicket.Status.IN_PROGRESS);
            ticket.setManagerPlan(plan);
            ticket.setSeverityMode("NORMAL");
            ticket.setAssignedStaff(null);
            SupportTicket saved = ticketRepository.save(ticket);
            var task = taskService.createSupportTask(saved);
            if (task != null && task.getAssignedStaff() != null) {
                saved.setAssignedStaff(task.getAssignedStaff());
                saved = ticketRepository.save(saved);
                notificationService.notifyTaskHandoff(task, task.getAssignedStaff(), plan);
            }
            notificationService.notifyTicketStatusChanged(saved, oldStatus);
            logService.log(actor, "TICKET", saved.getTicketId(), "MANAGER_INSTRUCT",
                    oldStatus, saved.getStatus().name(), plan);
            return TicketResponse.from(saved);
        }

        if (oldReservation == null) {
            throw new BusinessRuleException("Ticket không gắn với đơn thuê đang hoạt động.");
        }

        if ("RELOCATE".equals(mode)) {
            if (request.newUnitId() == null || request.newStartDate() == null || request.newEndDate() == null) {
                throw new BusinessRuleException("Thiếu kho mới hoặc khoảng ngày thuê.");
            }
            Unit newUnit = unitRepository.findWithDetailsById(request.newUnitId())
                    .orElseThrow(() -> new UnitNotFoundException("Kho mới không tồn tại."));
            LocalDate today = LocalDate.now(ICT_ZONE);
            LocalDate expectedStart = oldReservation.getStartDate() != null
                    && oldReservation.getStartDate().isAfter(today)
                    ? oldReservation.getStartDate() : today;
            LocalDate expectedEnd = oldReservation.getEndDate() != null
                    && !oldReservation.getEndDate().isBefore(expectedStart)
                    ? oldReservation.getEndDate() : expectedStart;
            if (!expectedStart.equals(request.newStartDate())
                    || !expectedEnd.equals(request.newEndDate())) {
                throw new BusinessRuleException(
                        "Đổi kho do sự cố phải giữ đúng thời gian còn lại của đơn ("
                                + expectedStart + " → " + expectedEnd + ").");
            }
            var oldQuote = pricingEngine.calculateQuote(
                    oldReservation.getUnit(), expectedStart, expectedEnd,
                    oldReservation.getPolicy());
            var newQuote = pricingEngine.calculateQuote(
                    newUnit, request.newStartDate(), request.newEndDate());
            int oldDays = Math.max(1, oldQuote.durationDays());
            int newDays = Math.max(1, newQuote.durationDays());
            long oldDaily = oldQuote.totalRent() / oldDays;
            long newDaily = newQuote.totalRent() / newDays;
            if (newDaily < oldDaily) {
                throw new BusinessRuleException(
                        "Chỉ chọn kho cùng giá hoặc cao hơn. Kho mới rẻ hơn không hợp lệ.");
            }

            earlyCheckoutService.relocateForTicket(
                    actor,
                    new com.storagehub.dto.checkout.TransferRequest(
                            oldReservation.getReservationId(),
                            newUnit.getUnitId(),
                            request.newStartDate(),
                            request.newEndDate()
                    ),
                    request.managerPlan()
            );

            long absorbed = Math.max(0L, newQuote.totalRent() - oldQuote.totalRent());
            String plan = request.managerPlan() != null && !request.managerPlan().isBlank()
                    ? request.managerPlan().trim()
                    : "Đổi kho do sự cố";
            ticket.setStatus(SupportTicket.Status.RESOLVED);
            ticket.setManagerPlan(plan);
            ticket.setSeverityMode("SEVERE");
            ticket.setRelocatedUnitCode(newUnit.getCode());
            ticket.setRelocationCompensation(0L);
            ticket.setRelocationAbsorbed(absorbed);
            ticket.setResolutionNote("Đổi kho " + oldReservation.getUnit().getCode()
                    + " → " + newUnit.getCode()
                    + ". Công ty chịu chênh lệch " + absorbed
                    + " ₫. Không thu thêm tiền của khách.");
            ticket.setResolvedAt(LocalDateTime.now(ICT_ZONE));
            SupportTicket saved = ticketRepository.save(ticket);
            notificationService.notifyTicketStatusChanged(saved, oldStatus);
            logService.log(actor, "TICKET", saved.getTicketId(), "MANAGER_RELOCATE",
                    oldStatus, saved.getStatus().name(),
                    "Đổi kho " + oldReservation.getUnit().getCode() + " → " + newUnit.getCode());
            return TicketResponse.from(saved);
        }

        if ("CHECKOUT_REFUND".equals(mode)) {
            String reason = request.managerPlan() != null && !request.managerPlan().isBlank()
                    ? request.managerPlan().trim()
                    : "Không có kho phù hợp — trả kho và hoàn tiền ngay";
            earlyCheckoutService.forcedCheckout(
                    actor,
                    oldReservation.getReservationId(),
                    new com.storagehub.dto.checkout.ForcedCheckoutRequest("TRANSFER", reason)
            );
            taskService.createOrUpdateCheckoutTask(
                    actor, oldReservation, LocalDate.now(ICT_ZONE), null, reason);

            ticket.setStatus(SupportTicket.Status.RESOLVED);
            ticket.setManagerPlan(reason);
            ticket.setSeverityMode("SEVERE");
            ticket.setResolutionNote("Không có kho phù hợp. Checkout và hoàn tiền ngay cho khách; không thu thêm tiền.");
            ticket.setResolvedAt(LocalDateTime.now(ICT_ZONE));
            SupportTicket saved = ticketRepository.save(ticket);
            notificationService.notifyTicketStatusChanged(saved, oldStatus);
            logService.log(actor, "TICKET", saved.getTicketId(), "MANAGER_CHECKOUT_REFUND",
                    oldStatus, saved.getStatus().name(), reason);
            return TicketResponse.from(saved);
        }

        throw new BusinessRuleException("Mode điều phối không hợp lệ: " + request.mode());
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
