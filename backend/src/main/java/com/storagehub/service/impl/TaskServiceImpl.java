package com.storagehub.service.impl;

import com.storagehub.dto.task.AssignedStaffDto;
import com.storagehub.dto.task.CreateTaskRequest;
import com.storagehub.dto.task.TaskResponse;
import com.storagehub.dto.task.TaskRitualDto;
import com.storagehub.dto.task.TaskAssetDto;
import com.storagehub.entity.UnitAsset;
import com.storagehub.repository.UnitAssetRepository;
import com.storagehub.repository.InspectionAssetRepository;
import com.storagehub.entity.*;
import com.storagehub.exception.TaskNotFoundException;
import com.storagehub.exception.TaskSnapBackException;
import com.storagehub.repository.*;
import com.storagehub.service.LogService;
import com.storagehub.service.NotificationService;
import com.storagehub.service.TaskService;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Clock;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.ZoneId;
import java.util.List;
import java.util.Optional;

@Service
@Transactional
public class TaskServiceImpl implements TaskService {

    private static final ZoneId ICT_ZONE = ZoneId.of("Asia/Ho_Chi_Minh");

    private final TaskRepository taskRepository;
    private final StaffAssignmentRepository staffAssignmentRepository;
    private final UserRepository userRepository;
    private final UnitRepository unitRepository;
    private final ReservationRepository reservationRepository;
    private final ContractRepository contractRepository;
    private final SupportTicketRepository supportTicketRepository;
    private final PaymentRepository paymentRepository;
    private final LogService logService;
    private final NotificationService notificationService;
    private final com.storagehub.repository.SettlementRepository settlementRepository;
    private final com.storagehub.repository.InspectionRepository inspectionRepository;
    private final com.storagehub.repository.CheckoutRequestRepository checkoutRequestRepository;

    @org.springframework.beans.factory.annotation.Autowired(required = false)
    private UnitAssetRepository unitAssetRepository;

    @org.springframework.beans.factory.annotation.Autowired(required = false)
    private InspectionAssetRepository inspectionAssetRepository;
    private final com.storagehub.service.PricingEngine pricingEngine;
    private final com.storagehub.service.ReservationService reservationService;
    private final com.storagehub.service.LateCheckoutService lateCheckoutService;
    private final com.storagehub.service.ContractService contractService;
    private final com.storagehub.repository.ContractAddendumRepository contractAddendumRepository;
    private final com.storagehub.repository.ExtensionRepository extensionRepository;
    private final org.springframework.transaction.support.TransactionTemplate transactionTemplate;
    private final Clock clock;

    public TaskServiceImpl(
            TaskRepository taskRepository,
            StaffAssignmentRepository staffAssignmentRepository,
            UserRepository userRepository,
            UnitRepository unitRepository,
            ReservationRepository reservationRepository,
            ContractRepository contractRepository,
            SupportTicketRepository supportTicketRepository,
            PaymentRepository paymentRepository,
            LogService logService,
            NotificationService notificationService,
            com.storagehub.repository.SettlementRepository settlementRepository,
            com.storagehub.repository.InspectionRepository inspectionRepository,
            com.storagehub.repository.CheckoutRequestRepository checkoutRequestRepository,
            com.storagehub.service.PricingEngine pricingEngine,
            @org.springframework.context.annotation.Lazy com.storagehub.service.ReservationService reservationService,
            com.storagehub.service.LateCheckoutService lateCheckoutService,
            com.storagehub.service.ContractService contractService,
            com.storagehub.repository.ContractAddendumRepository contractAddendumRepository,
            com.storagehub.repository.ExtensionRepository extensionRepository,
            org.springframework.transaction.PlatformTransactionManager transactionManager,
            Clock clock
    ) {
        this.taskRepository = taskRepository;
        this.staffAssignmentRepository = staffAssignmentRepository;
        this.userRepository = userRepository;
        this.unitRepository = unitRepository;
        this.reservationRepository = reservationRepository;
        this.contractRepository = contractRepository;
        this.supportTicketRepository = supportTicketRepository;
        this.paymentRepository = paymentRepository;
        this.logService = logService;
        this.notificationService = notificationService;
        this.settlementRepository = settlementRepository;
        this.inspectionRepository = inspectionRepository;
        this.checkoutRequestRepository = checkoutRequestRepository;
        this.pricingEngine = pricingEngine;
        this.reservationService = reservationService;
        this.lateCheckoutService = lateCheckoutService;
        this.contractService = contractService;
        this.contractAddendumRepository = contractAddendumRepository;
        this.extensionRepository = extensionRepository;
        this.transactionTemplate = new org.springframework.transaction.support.TransactionTemplate(transactionManager);
        this.clock = clock;
    }

    private LocalDate getToday() {
        return LocalDate.now(clock.withZone(ICT_ZONE));
    }

    private StaffAssignment.Shift getCurrentShift() {
        LocalTime now = LocalTime.now(clock.withZone(ICT_ZONE));
        if (!now.isBefore(LocalTime.of(7, 0)) && now.isBefore(LocalTime.of(15, 0))) {
            return StaffAssignment.Shift.MORNING;
        } else if (!now.isBefore(LocalTime.of(15, 0)) && now.isBefore(LocalTime.of(23, 0))) {
            return StaffAssignment.Shift.AFTERNOON;
        } else {
            return StaffAssignment.Shift.EVENING;
        }
    }

    @Override
    @Transactional
    public List<TaskResponse> getTasks(
            String currentUserEmail,
            LocalDate workDate,
            StaffAssignment.Shift shift,
            Task.Type type,
            Task.Status status,
            Long staffId
    ) {
        User currentUser = userRepository.findByEmailIgnoreCase(currentUserEmail)
                .orElseThrow(() -> new AccessDeniedException("Người dùng không tồn tại"));

        Role.Name roleName = currentUser.getRole().getName();
        if (roleName != Role.Name.STAFF &&
                roleName != Role.Name.FACILITY_MANAGER &&
                roleName != Role.Name.SYSTEM_ADMIN) {
            throw new AccessDeniedException("Chỉ Staff hoặc Quản lý mới có quyền truy cập Task Board");
        }

        expireDueTasks();
        carryOverStaleTasks();

        boolean isDefaultDate = (workDate == null);
        LocalDate targetDate = isDefaultDate ? getToday() : workDate;
        StaffAssignment.Shift targetShift = (shift != null) ? shift : getCurrentShift();

        List<Task> tasks;
        if (roleName == Role.Name.STAFF) {
            tasks = taskRepository.findFilteredTasks(currentUser.getUserId(), targetDate, type, status);
            if (tasks.isEmpty() && isDefaultDate) {
                tasks = taskRepository.findStaffTasks(currentUser.getUserId(), type, status);
            }
            if (currentUser.getFacility() != null) {
                tasks = java.util.stream.Stream.concat(
                                tasks.stream(),
                                taskRepository.findUnassignedPoolForFacility(
                                        currentUser.getFacility().getFacilityId(),
                                        targetDate, type, status).stream())
                        .toList();
            }
        } else if (roleName == Role.Name.FACILITY_MANAGER
                && currentUser.getFacility() != null) {
            Integer facilityId = currentUser.getFacility().getFacilityId();
            tasks = taskRepository.findFilteredTasksByFacility(
                    staffId, facilityId, targetDate, type, status);
            if (tasks.isEmpty() && isDefaultDate) {
                tasks = taskRepository.findFilteredTasksByFacility(
                        staffId, facilityId, null, type, status);
            }
            tasks = java.util.stream.Stream.concat(
                            tasks.stream(),
                            taskRepository.findUnassignedPoolForFacility(
                                    facilityId, targetDate, type, status).stream())
                    .toList();
        } else {
            // System Admin: xem toàn bộ hoặc lọc theo 1 staff.
            tasks = taskRepository.findFilteredTasks(staffId, targetDate, type, status);
            if (tasks.isEmpty() && isDefaultDate) {
                tasks = taskRepository.findFilteredTasks(staffId, null, type, status);
            }
        }

        return tasks.stream()
                .map(t -> toTaskResponse(t, targetShift, null, null, null, null))
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public TaskResponse getTaskDetail(String currentUserEmail, Long taskId) {
        Task task = taskRepository.findWithStaffById(taskId)
                .orElseThrow(() -> new TaskNotFoundException(taskId));
        User currentUser = userRepository.findByEmailIgnoreCase(currentUserEmail)
                .orElseThrow(() -> new org.springframework.security.access.AccessDeniedException("Người dùng không tồn tại"));
        assertTaskFacility(currentUser, task);

        return toTaskResponse(task, getCurrentShift(), null, null, null, null, true);
    }

    @Override
    public TaskResponse updateTaskStatus(String currentUserEmail, Long taskId, Task.Status newStatus) {
        User currentUser = userRepository.findByEmailIgnoreCase(currentUserEmail)
                .orElseThrow(() -> new AccessDeniedException("Người dùng không tồn tại"));

        Task task = taskRepository.findWithStaffById(taskId)
                .orElseThrow(() -> new TaskNotFoundException(taskId));
        assertTaskFacility(currentUser, task);

        Role.Name roleName = currentUser.getRole().getName();
        if (roleName == Role.Name.STAFF) {
            if (task.getAssignedStaff() == null) {
                // Task pool: staff cùng cơ sở được nhận việc; guard chống cross-facility.
                if (currentUser.getFacility() == null
                        || task.getFacility() == null
                        || !currentUser.getFacility().getFacilityId()
                            .equals(task.getFacility().getFacilityId())) {
                    throw new AccessDeniedException(
                            "Nhiệm vụ thuộc cơ sở khác hoặc chưa xác định cơ sở.");
                }
                task.setAssignedStaff(currentUser);
                task.setClaimedAt(java.time.LocalDateTime.now(clock.withZone(ICT_ZONE)));
            } else if (!currentUser.getUserId().equals(task.getAssignedStaff().getUserId())) {
                throw new AccessDeniedException("Nhiệm vụ chưa được bạn nhận hoặc không được phân công.");
            }
        }

        // Task đã DONE là trạng thái cuối — không cho kéo về TODO/IN_PROGRESS.
        if (task.getStatus() == Task.Status.DONE && newStatus != Task.Status.DONE) {
            throw new com.storagehub.exception.BusinessRuleException(
                    "Nhiệm vụ đã hoàn thành — không thể chuyển lại trạng thái trước.");
        }
        if (roleName == Role.Name.STAFF
                && task.getStatus() == Task.Status.IN_PROGRESS
                && newStatus == Task.Status.TODO
                && task.getAssignedStaff() != null) {
            throw new com.storagehub.exception.BusinessRuleException(
                    "Task đã nhận không thể trả về To do. Hãy xử lý hoặc báo quản lý.");
        }

        // Kiểm tra Snap-back chống Done ảo (FR-22 / AD-8)
        if (newStatus == Task.Status.DONE) {
            validateSnapBackRule(task);
        }

        Task.Status oldStatus = task.getStatus();
        task.setStatus(newStatus);
        Task saved = taskRepository.save(task);

        if (newStatus == Task.Status.DONE && task.getType() == Task.Type.CLEANING) {
            releaseUnitAfterCleaning(currentUser, saved);
        }

        // Vòng support 2 chiều: task SUPPORT hoàn thành → resolve ticket SR-...
        // (khách thấy "Đã xử lý xong" ngay trên Support page).
        if (newStatus == Task.Status.DONE
                && task.getType() == Task.Type.SUPPORT
                && task.getRefCode() != null
                && task.getRefCode().startsWith("SR-")) {
            resolveSupportTicketByTask(currentUser, task.getRefCode());
        }

        logService.log(
                currentUser,
                "TASK",
                task.getTaskId(),
                "STATUS_CHANGE",
                oldStatus.name(),
                newStatus.name(),
                "Chuyển trạng thái task kanban: " + oldStatus + " -> " + newStatus
        );

        return toTaskResponse(saved, getCurrentShift(), null, null, null, null);
    }

    @Override
    public void setTaskNote(Long taskId, String note) {
        taskRepository.findByIdForUpdate(taskId).ifPresent(task -> {
            task.setNote(note);
            taskRepository.save(task);
        });
    }

    @Override
    @Transactional(readOnly = true)
    public com.storagehub.dto.task.ContractPreviewResponse getContractPreview(Long taskId) {
        Task task = taskRepository.findWithStaffById(taskId)
                .orElseThrow(() -> new TaskNotFoundException(taskId));

        String refCode = task.getRefCode();
        Reservation reservation = null;
        if (refCode != null && refCode.startsWith("BK-")) {
            reservation = reservationRepository.findByCode(refCode).orElse(null);
        } else if (refCode != null && refCode.startsWith("CT-")) {
            reservation = contractRepository.findByCode(refCode)
                    .map(Contract::getReservation)
                    .orElse(null);
        }
        if (reservation == null) {
            throw new com.storagehub.exception.BusinessRuleException(
                    "Nhiệm vụ này không gắn với hợp đồng thuê kho.");
        }

        Unit unit = unitRepository.findWithDetailsById(reservation.getUnit().getUnitId())
                .orElseThrow(() -> new com.storagehub.exception.BusinessRuleException("Không tìm thấy kho."));
        LocalDate startDate = reservation.getStartDate();
        LocalDate endDate = reservation.getEndDate();
        int durationDays = (int) java.time.temporal.ChronoUnit.DAYS.between(startDate, endDate) + 1;
        if (durationDays < 1) {
            durationDays = 1;
        }
        var quote = pricingEngine.calculateQuote(unit, startDate, endDate);
        long totalRent = quote.totalRent();
        long dailyRent = totalRent / durationDays;
        long depositPaid = reservation.getDepositAmount() != null
                ? reservation.getDepositAmount().longValue()
                : quote.depositAmount();

        return new com.storagehub.dto.task.ContractPreviewResponse(
                reservation.getCode(),
                startDate,
                endDate,
                durationDays,
                dailyRent,
                totalRent,
                depositPaid,
                unit.getCode(),
                unit.getType() != null ? unit.getType().getName() : "Kho lưu trữ",
                unit.getSizeM2(),
                unit.getAccessType(),
                reservation.getCustomer() != null ? reservation.getCustomer().getFullName() : null,
                reservation.getCustomer() != null ? reservation.getCustomer().getPhone() : null,
                reservation.getCustomer() != null ? reservation.getCustomer().getEmail() : null
        );
    }

    @Override
    public TaskResponse completeSupportRitual(
            String currentUserEmail,
            Long taskId,
            com.storagehub.dto.task.SupportRitualRequest request
    ) {
        User currentUser = userRepository.findByEmailIgnoreCase(currentUserEmail)
                .orElseThrow(() -> new AccessDeniedException("Người dùng không tồn tại"));
        Task task = taskRepository.findWithStaffById(taskId)
                .orElseThrow(() -> new TaskNotFoundException(taskId));

        Role.Name roleName = currentUser.getRole().getName();
        if (roleName == Role.Name.STAFF
                && (task.getAssignedStaff() == null
                    || !currentUser.getUserId().equals(task.getAssignedStaff().getUserId()))) {
            throw new AccessDeniedException("Nhiệm vụ chưa được bạn nhận hoặc không được phân công.");
        }
        if (task.getType() != Task.Type.SUPPORT) {
            throw new com.storagehub.exception.BusinessRuleException("Task không phải loại SUPPORT.");
        }

        String refCode = task.getRefCode();
        SupportTicket ticket = refCode != null && refCode.startsWith("SR-")
                ? supportTicketRepository.findByCode(refCode).orElse(null)
                : null;
        if (ticket == null) {
            throw new com.storagehub.exception.BusinessRuleException(
                    "Không tìm thấy yêu cầu hỗ trợ gắn với nhiệm vụ.");
        }

        boolean escalate = Boolean.TRUE.equals(request.escalated());
        String oldStatus = ticket.getStatus().name();

        if (escalate) {
            String reason = request.escalationReason() == null ? "" : request.escalationReason().trim();
            if (reason.isEmpty()) {
                throw new com.storagehub.exception.BusinessRuleException(
                        "Lý do chuyển cấp lên Quản lý là bắt buộc.");
            }
            ticket.setStatus(SupportTicket.Status.ESCALATED);
            ticket.setEscalationReason(reason);
        } else {
            String note = request.resolutionNote() == null ? "" : request.resolutionNote().trim();
            if (note.isEmpty()) {
                throw new com.storagehub.exception.BusinessRuleException(
                        "Ghi chú giải quyết cho khách hàng là bắt buộc.");
            }
            ticket.setStatus(SupportTicket.Status.RESOLVED);
            ticket.setResolutionNote(note);
            ticket.setResolvedAt(java.time.LocalDateTime.now());
        }
        if (ticket.getAssignedStaff() == null) {
            ticket.setAssignedStaff(currentUser);
        }
        supportTicketRepository.save(ticket);

        task.setStatus(Task.Status.DONE);
        Task saved = taskRepository.save(task);

        notificationService.notifyTicketStatusChanged(ticket, oldStatus);
        logService.log(
                currentUser,
                "TASK",
                task.getTaskId(),
                escalate ? "ESCALATED" : "RESOLVED",
                oldStatus,
                ticket.getStatus().name(),
                "Xử lý support ticket " + ticket.getCode() + " từ Task Board"
        );

        return toTaskResponse(saved, getCurrentShift(), null, null, null, null, true);
    }

    @Override
    public TaskResponse autoCreateTask(CreateTaskRequest request) {
        // 1. Xác định Unit liên kết
        Unit unit = resolveUnit(request);

        // 2. Xác định ngày làm việc và ca trực
        LocalDate workDate = (request.workDate() != null) ? request.workDate() : getToday();
        StaffAssignment.Shift shift = (request.shift() != null) ? request.shift() : getCurrentShift();

        User assignedStaff = autoAssignStaff(unit, workDate, shift);

        Task task = new Task();
        task.setType(request.type());
        task.setRefCode(request.refCode());
        task.setAssignedStaff(assignedStaff);
        task.setShift(shift);
        task.setUnitType(unit != null ? unit.getType() : null);
        task.setFacility(facilityOf(unit));
        task.setWorkDate(workDate);
        task.setStatus(Task.Status.TODO);

        Task saved = taskRepository.save(task);

        String typeName = (unit != null && unit.getType() != null) ? unit.getType().getName() : "Chung";
        String assigneeName = assignedStaff != null ? assignedStaff.getFullName() : "chưa phân công";
        logService.log(
                assignedStaff,
                "TASK",
                saved.getTaskId(),
                "TASK_CREATED",
                null,
                Task.Status.TODO.name(),
                "Task " + typeName + " ca " + shift + " — " + assigneeName
        );

        return toTaskResponse(saved, shift, request.dueTime(), request.priority(), request.alertNote(), request.issueDescription());
    }

    private Unit resolveUnit(Task task) {
        if (task == null || task.getRefCode() == null) return null;
        String refCode = task.getRefCode();
        if (refCode.startsWith("BK-")) {
            return reservationRepository.findByCode(refCode).map(Reservation::getUnit).orElse(null);
        }
        if (refCode.startsWith("CT-") || refCode.startsWith("HD-")) {
            return contractRepository.findByCode(refCode)
                    .map(c -> c.getReservation() != null ? c.getReservation().getUnit() : null)
                    .orElse(null);
        }
        if (refCode.startsWith("SR-")) {
            return supportTicketRepository.findByCode(refCode).map(SupportTicket::getUnit).orElse(null);
        }
        return unitRepository.findByCode(refCode).orElse(null);
    }

    private Unit resolveUnit(CreateTaskRequest request) {
        if (request.unitId() != null) {
            return unitRepository.findWithDetailsById(request.unitId()).orElse(null);
        }

        String refCode = request.refCode();
        if (refCode == null) return null;

        if (refCode.startsWith("BK-")) {
            return reservationRepository.findByCode(refCode).map(Reservation::getUnit).orElse(null);
        }
        if (refCode.startsWith("CT-")) {
            return contractRepository.findByCode(refCode)
                    .map(c -> c.getReservation().getUnit())
                    .orElse(null);
        }
        if (refCode.startsWith("SR-")) {
            return supportTicketRepository.findByCode(refCode).map(SupportTicket::getUnit).orElse(null);
        }

        return unitRepository.findByCode(refCode).orElse(null);
    }

    /** Chuyển task chưa xong sang staff ca kế tiếp cùng loại kho. */
    /** Task quá expires_on: DONE + note, kích hoạt side-effect của owner. */
    private void expireDueTasks() {
        LocalDate today = getToday();
        for (Task task : taskRepository.findExpiredOpenTasks(today)) {
            if (task.getStatus() == Task.Status.DONE) {
                continue;
            }
            String note = "Hết hạn xử lý ngày " + task.getExpiresOn()
                    + " — tự động đóng task.";
            if (task.getType() == Task.Type.CHECK_IN && task.getRefCode() != null) {
                reservationRepository.findByCode(task.getRefCode()).ifPresent(res -> {
                    if (res.getStatus() == Reservation.Status.RESERVED) {
                        reservationService.expireNoShowIfDue(
                                res.getCustomer().getEmail(), res.getReservationId());
                    }
                });
            } else if (task.getType() == Task.Type.CONTRACT && task.getRefCode() != null) {
                var addendum = contractAddendumRepository.findByCode(task.getRefCode()).orElse(null);
                var extension = addendum != null ? addendum.getExtension() : null;
                if (extension != null && extension.getStatus() == Extension.Status.PENDING_CONTRACT) {
                    addendum.setStatus(ContractAddendum.Status.VOIDED);
                    contractAddendumRepository.save(addendum);

                    extension.setStatus(Extension.Status.EXPIRED);
                    extensionRepository.save(extension);

                    Reservation res = extension.getReservation();
                    res.setEndDate(task.getExpiresOn() != null ? task.getExpiresOn() : today);
                    if (extension.getNewDeposit() != null && extension.getOldDeposit() != null
                            && extension.getNewDeposit().compareTo(extension.getOldDeposit()) > 0) {
                        res.setDepositAmount(extension.getOldDeposit());
                    }
                    reservationRepository.save(res);
                    logService.log(res.getCustomer(), "EXTENSION", extension.getExtensionId(),
                            "EXPIRED", "PENDING_CONTRACT", "EXPIRED",
                            "Task contract " + task.getRefCode() + " hết hạn — rollback EndDate "
                                    + res.getEndDate());
                }
            }

            task.setStatus(Task.Status.DONE);
            String oldNote = task.getNote();
            task.setNote(oldNote == null || oldNote.isBlank() ? note : oldNote + " | " + note);
            Task saved = taskRepository.save(task);
            logService.log(task.getAssignedStaff() != null ? task.getAssignedStaff() : null,
                    "TASK", saved.getTaskId(), "EXPIRED", "OPEN", "DONE", note);
        }
    }

    private void carryOverStaleTasks() {
        LocalTime now = LocalTime.now(clock.withZone(ICT_ZONE));
        LocalDate today = getToday();
        for (Task task : taskRepository.findOpenTasksWithStaff()) {
            if (task.getShift() == null || task.getWorkDate() == null
                    || task.getWorkDate().isAfter(today)) {
                continue;
            }
            LocalDate targetDate = today;
            StaffAssignment.Shift targetShift;
            switch (task.getShift()) {
                case MORNING -> {
                    if (now.isBefore(LocalTime.of(15, 0))) targetShift = StaffAssignment.Shift.MORNING;
                    else targetShift = StaffAssignment.Shift.AFTERNOON;
                }
                case AFTERNOON -> {
                    if (now.isBefore(LocalTime.of(23, 0))) targetShift = StaffAssignment.Shift.AFTERNOON;
                    else {
                        targetShift = StaffAssignment.Shift.MORNING;
                        targetDate = today.plusDays(1);
                    }
                }
                case FULL_DAY -> {
                    if (now.isBefore(LocalTime.of(23, 0))) targetShift = StaffAssignment.Shift.FULL_DAY;
                    else {
                        targetShift = StaffAssignment.Shift.MORNING;
                        targetDate = today.plusDays(1);
                    }
                }
                default -> {
                    continue;
                }
            }

            Unit taskUnit = resolveUnit(task);
            Integer facilityId = null;
            if (taskUnit != null && taskUnit.getZone() != null && taskUnit.getZone().getFacility() != null) {
                facilityId = taskUnit.getZone().getFacility().getFacilityId();
            } else if (task.getAssignedStaff() != null && task.getAssignedStaff().getFacility() != null) {
                facilityId = task.getAssignedStaff().getFacility().getFacilityId();
            }

            Integer typeId = task.getUnitType() != null ? task.getUnitType().getTypeId() : null;
            List<StaffAssignment> candidates = typeId == null
                    ? staffAssignmentRepository.findByFacilityAndWorkDateAndShift(facilityId, targetDate, targetShift)
                    : staffAssignmentRepository.findByFacilityAndUnitType_TypeIdAndWorkDateAndShift(
                            facilityId, typeId, targetDate, targetShift);
            if (candidates.isEmpty()
                    && (targetShift == StaffAssignment.Shift.MORNING
                        || targetShift == StaffAssignment.Shift.AFTERNOON)) {
                candidates = typeId == null
                        ? staffAssignmentRepository.findByFacilityAndWorkDateAndShift(
                                facilityId, targetDate, StaffAssignment.Shift.FULL_DAY)
                        : staffAssignmentRepository.findByFacilityAndUnitType_TypeIdAndWorkDateAndShift(
                                facilityId, typeId, targetDate, StaffAssignment.Shift.FULL_DAY);
            }
            if (candidates.isEmpty()) continue;

            User currentOwner = task.getAssignedStaff();
            boolean currentStillOnShift = candidates.stream()
                    .anyMatch(a -> a.getStaff() != null
                            && currentOwner != null
                            && a.getStaff().getUserId().equals(currentOwner.getUserId()));
            if (currentStillOnShift) continue;

            User nextOwner = candidates.get(0).getStaff();
            if (nextOwner == null) continue;

            String oldOwner = currentOwner != null ? currentOwner.getFullName() : "—";
            task.setAssignedStaff(nextOwner);
            task.setShift(targetShift);
            task.setWorkDate(targetDate);
            taskRepository.save(task);
            logService.log(nextOwner, "TASK", task.getTaskId(), "AUTO_HANDOFF",
                    oldOwner, nextOwner.getFullName(),
                    "Hết ca — chuyển task sang ca " + targetShift);
            notificationService.notifyTaskHandoff(task, nextOwner, "Task chuyển từ ca trước");
        }
    }

    private User defaultActor() {
        return userRepository.findFirstByRole_NameAndStatus(Role.Name.STAFF, 1)
                .orElseThrow(() -> new IllegalStateException(
                        "Không có user để ghi activity log cho task hệ thống."));
    }

    private User autoAssignStaff(Unit unit, LocalDate workDate, StaffAssignment.Shift shift) {
        Integer facilityId = facilityIdOf(unit);
        if (facilityId == null) {
            return null;
        }

        // Ưu tiên staff được phân ca đúng LOẠI KHO (LOCK/S/M/L) cùng cơ sở.
        if (unit != null && unit.getType() != null) {
            Integer typeId = unit.getType().getTypeId();
            List<StaffAssignment> assignments = staffAssignmentRepository
                    .findByFacilityAndUnitType_TypeIdAndWorkDateAndShift(facilityId, typeId, workDate, shift);
            User picked = pickStaff(assignments, facilityId);
            if (picked != null) {
                return picked;
            }
            // Staff trực FULL_DAY phủ cả ca sáng/chiều.
            if (shift == StaffAssignment.Shift.MORNING || shift == StaffAssignment.Shift.AFTERNOON) {
                List<StaffAssignment> fullDay = staffAssignmentRepository
                        .findByFacilityAndUnitType_TypeIdAndWorkDateAndShift(facilityId, typeId, workDate, StaffAssignment.Shift.FULL_DAY);
                User pickedFullDay = pickStaff(fullDay, facilityId);
                if (pickedFullDay != null) {
                    return pickedFullDay;
                }
            }
        }

        // Fallback: bất kỳ staff nào trực cùng ca tại cùng cơ sở.
        List<StaffAssignment> shiftAssignments = staffAssignmentRepository.findByFacilityAndWorkDateAndShift(facilityId, workDate, shift);
        User pickedShift = pickStaff(shiftAssignments, facilityId);
        if (pickedShift != null) {
            return pickedShift;
        }
        if (shift != StaffAssignment.Shift.FULL_DAY) {
            List<StaffAssignment> fullDay = staffAssignmentRepository
                    .findByFacilityAndWorkDateAndShift(facilityId, workDate, StaffAssignment.Shift.FULL_DAY);
            User pickedFullDay = pickStaff(fullDay, facilityId);
            if (pickedFullDay != null) {
                return pickedFullDay;
            }
        }

        // Không có người cùng cơ sở: để task unassigned cho manager xử lý.
        return null;
    }

    private User pickStaff(List<StaffAssignment> assignments, Integer facilityId) {
        if (assignments == null || assignments.isEmpty() || facilityId == null) {
            return null;
        }
        return assignments.stream()
                .map(StaffAssignment::getStaff)
                .filter(staff -> staff != null
                        && staff.getFacility() != null
                        && facilityId.equals(staff.getFacility().getFacilityId()))
                .findFirst()
                .orElse(null);
    }

    private Facility facilityOf(Unit unit) {
        if (unit == null || unit.getZone() == null) {
            return null;
        }
        return unit.getZone().getFacility();
    }

    private Integer facilityIdOf(Unit unit) {
        if (unit == null || unit.getZone() == null || unit.getZone().getFacility() == null) {
            return null;
        }
        return unit.getZone().getFacility().getFacilityId();
    }

    private void releaseUnitAfterCleaning(User actor, Task task) {
        if (task.getRefCode() == null) {
            return;
        }
        Unit unit = unitRepository.findByCode(task.getRefCode()).orElse(null);
        if (unit == null || unit.getStatus() != Unit.Status.PREPARING) {
            return;
        }
        boolean stillCleaning = taskRepository.existsByTypeAndRefCodeAndStatusIn(
                Task.Type.CLEANING,
                unit.getCode(),
                List.of(Task.Status.TODO, Task.Status.IN_PROGRESS));
        if (stillCleaning) {
            return;
        }
        boolean hasActiveReservation = !reservationRepository.findActiveReservationsForUnit(
                unit.getUnitId(),
                List.of(Reservation.Status.RESERVED,
                        Reservation.Status.CHECKED_IN,
                        Reservation.Status.CHECKOUT_REQUESTED)).isEmpty();
        if (hasActiveReservation) {
            return;
        }
        unit.setStatus(Unit.Status.AVAILABLE);
        unitRepository.save(unit);
        logService.log(actor, "UNIT", unit.getUnitId(), "STATUS_CHANGED",
                "PREPARING", "AVAILABLE",
                "Cleaning hoàn tất — kho " + unit.getCode() + " sẵn sàng");
    }

    private void validateSnapBackRule(Task task) {
        String ref = task.getRefCode();

        switch (task.getType()) {
            case CHECK_IN -> {
                if (ref != null && ref.startsWith("BK-")) {
                    Reservation res = reservationRepository.findByCode(ref).orElse(null);
                    if (res != null) {
                        boolean rentCollected = paymentRepository
                                .findByReservation_ReservationIdOrderByCreatedAtAsc(res.getReservationId())
                                .stream()
                                .anyMatch(p -> p.getPurpose() == Payment.Purpose.RENT && p.getStatus() == Payment.Status.SUCCEEDED)
                                || res.getStatus() == Reservation.Status.CHECKED_IN;
                        if (!rentCollected) {
                            throw new TaskSnapBackException(
                                    "Chặn Done ảo: Chưa thu 100% tiền thuê kho tại quầy!",
                                    "RENT_NOT_COLLECTED"
                            );
                        }

                        boolean contractSigned = contractRepository
                                .findByReservation_ReservationId(res.getReservationId())
                                .stream()
                                .anyMatch(c -> c.getStatus() == Contract.Status.SIGNED ||
                                        c.getStatus() == Contract.Status.ACTIVE ||
                                        c.getSignedPhotoUrl() != null);
                        if (!contractSigned) {
                            throw new TaskSnapBackException(
                                    "Chặn Done ảo: Chưa hoàn tất ký hợp đồng và đính kèm ảnh bản ký!",
                                    "CONTRACT_NOT_SIGNED"
                            );
                        }

                        if (res.getAccessCode() == null || res.getStatus() != Reservation.Status.CHECKED_IN) {
                            throw new TaskSnapBackException(
                                    "Chặn Done ảo: Chưa cấp phát mã truy cập (Access Code) cho khách!",
                                    "ACCESS_CODE_NOT_HANDED"
                            );
                        }
                    }
                }
            }
            case CHECKOUT -> {
                if (ref != null && ref.startsWith("BK-")) {
                    Reservation res = reservationRepository.findByCode(ref).orElse(null);
                    if (res != null && res.getStatus() != Reservation.Status.CLOSED) {
                        throw new TaskSnapBackException(
                                "Chặn Done ảo: Chưa hoàn tất đối soát tất toán cọc và phụ phí!",
                                "SETTLEMENT_NOT_CONFIRMED"
                        );
                    }
                }
            }
            case CONTRACT -> {
                if (ref != null) {
                    // Addendum codes live in contract_addendums, not contracts.
                    var addendum = contractAddendumRepository.findByCode(ref).orElse(null);
                    if (addendum != null) {
                        if (addendum.getStatus() != ContractAddendum.Status.SIGNED
                                || addendum.getSignedPhotoUrl() == null
                                || addendum.getSignedPhotoUrl().isBlank()) {
                            throw new TaskSnapBackException(
                                    "Chặn Done ảo: Thiếu ảnh chụp phụ lục đã ký tại quầy!",
                                    "CONTRACT_NOT_SIGNED"
                            );
                        }
                        return;
                    }
                    Contract ct = contractRepository.findByCode(ref).orElse(null);
                    if (ct != null && ct.getStatus() != Contract.Status.SIGNED && ct.getSignedPhotoUrl() == null) {
                        throw new TaskSnapBackException(
                                "Chặn Done ảo: Thiếu ảnh chụp bản hợp đồng đã ký tên!",
                                "CONTRACT_NOT_SIGNED"
                        );
                    }
                }
            }
            case SUPPORT -> {
                if (ref != null && ref.startsWith("SR-")) {
                    SupportTicket ticket = supportTicketRepository.findByCode(ref).orElse(null);
                    if (ticket != null && ticket.getStatus() != SupportTicket.Status.RESOLVED) {
                        throw new TaskSnapBackException(
                                "Chặn Done ảo: Sự cố chưa được xử lý và ghi chú kết quả!",
                                "TICKET_NOT_RESOLVED"
                        );
                    }
                }
            }
            case CLEANING -> {
                // Cleaning hoàn tất ngay trên card khi kiểm tra buffer
            }
        }
    }

    private TaskResponse toTaskResponse(
            Task task,
            StaffAssignment.Shift shift,
            String customDueTime,
            String customPriority,
            String customAlertNote,
            String customIssueDesc
    ) {
        return toTaskResponse(task, shift, customDueTime, customPriority, customAlertNote, customIssueDesc, false);
    }

    private TaskResponse toTaskResponse(
            Task task,
            StaffAssignment.Shift shift,
            String customDueTime,
            String customPriority,
            String customAlertNote,
            String customIssueDesc,
            boolean includePhotos
    ) {
        String refCode = task.getRefCode();
        String unitCode = "Unit S-3";
        String customerName = "Nguyễn Thị Lan";
        String customerPhone = "0901 234 567";
        String dueTime = customDueTime != null ? customDueTime : "09:00";
        String accessPin = null;
        Long rentAmount = null;
        Long depositPaid = null;
        Boolean paymentRequired = Boolean.FALSE;
        Long extensionRent = null;
        String priority = customPriority;
        String issueDesc = customIssueDesc;
        String alertNote = customAlertNote;

        TaskRitualDto ritual = null;
        Long checkoutUnitId = null;
        com.storagehub.dto.checkout.LateCheckoutInfo lateInfo = null;
        boolean isDone = (task.getStatus() == Task.Status.DONE);

        switch (task.getType()) {
            case CHECK_IN -> {
                dueTime = customDueTime != null ? customDueTime : "09:00";
                if (refCode != null && refCode.startsWith("BK-")) {
                    Reservation res = reservationRepository.findByCode(refCode).orElse(null);
                    if (res != null) {
                        unitCode = "Unit " + res.getUnit().getCode();
                        customerName = res.getCustomer().getFullName();
                        customerPhone = res.getCustomer().getPhone();
                        accessPin = res.getAccessCode() != null ? res.getAccessCode() + "-Active" : "8842-Active";
                        depositPaid = res.getDepositAmount() != null ? res.getDepositAmount().longValue() : 180000L;
                        rentAmount = depositPaid * 10;
                    }
                }
                ritual = new TaskRitualDto(
                        true,
                        isDone,
                        isDone,
                        isDone ? "/placeholder.svg" : null,
                        isDone,
                        null, null, null, null, null, null
                );
            }
            case CHECKOUT -> {
                dueTime = customDueTime != null ? customDueTime : "14:00";
                unitCode = "Unit M-2";
                customerName = "Hoàng Nam";
                customerPhone = "0933 555 777";
                depositPaid = 360000L;
                if (refCode != null && refCode.startsWith("BK-")) {
                    Reservation res = reservationRepository.findByCode(refCode).orElse(null);
                    if (res != null) {
                        unitCode = "Unit " + res.getUnit().getCode();
                        customerName = res.getCustomer().getFullName();
                        customerPhone = res.getCustomer().getPhone();
                        depositPaid = res.getDepositAmount() != null ? res.getDepositAmount().longValue() : 360000L;
                        checkoutUnitId = res.getUnit().getUnitId();
                        lateCheckoutService.evaluate(res);
                        lateInfo = lateCheckoutService.info(res);
                    }
                }
                ritual = new TaskRitualDto(
                        null, null, null, null, null,
                        isDone,
                        isDone,
                        null, null, null, null
                );
            }
            case CLEANING -> {
                dueTime = customDueTime != null ? customDueTime : "16:00";
                unitCode = refCode != null ? (refCode.startsWith("Unit ") ? refCode : "Unit " + refCode) : "Unit S-1";
                customerName = "Hệ thống";
                customerPhone = null;
                alertNote = customAlertNote != null ? customAlertNote : "Khách kế tiếp nhận lúc 16:30";
                ritual = new TaskRitualDto(
                        null, null, null, null, null, null, null,
                        isDone,
                        null, null, null
                );
            }
            case SUPPORT -> {
                dueTime = customDueTime != null ? customDueTime : "11:30";
                unitCode = "Unit S-4";
                customerName = "Lê Minh Trí";
                customerPhone = "0912 888 999";
                priority = customPriority != null ? customPriority : "Medium";
                issueDesc = customIssueDesc != null ? customIssueDesc : "Cửa cuốn bị kẹt rãnh dưới góc phải, khó kéo hết hành trình.";
                String resolvedNote = "";
                boolean escalated = false;
                String escalationReason = "";
                if (refCode != null && refCode.startsWith("SR-")) {
                    SupportTicket ticket = supportTicketRepository.findByCode(refCode).orElse(null);
                    if (ticket != null) {
                        unitCode = "Unit " + ticket.getUnit().getCode();
                        customerName = ticket.getCustomer().getFullName();
                        customerPhone = ticket.getCustomer().getPhone();
                        issueDesc = ticket.getIncidentType() != null ? ticket.getIncidentType().name() : issueDesc;
                        resolvedNote = ticket.getResolutionNote() != null ? ticket.getResolutionNote() : "";
                        escalated = ticket.getStatus() == SupportTicket.Status.ESCALATED;
                        escalationReason = ticket.getEscalationReason() != null ? ticket.getEscalationReason() : "";
                    }
                }
                ritual = new TaskRitualDto(
                        null, null, null, null, null, null, null, null,
                        resolvedNote.isEmpty() && isDone ? "Đã xử lý sự cố" : resolvedNote,
                        escalated,
                        escalationReason
                );
            }
            case CONTRACT -> {
                dueTime = customDueTime != null ? customDueTime : "10:15";
                unitCode = "Unit S-2";
                customerName = "Phạm Tuấn";
                customerPhone = "0944 111 222";
                if (refCode != null && refCode.startsWith("CT-")) {
                    // CT-...-A1 là ADDENDUM, không nằm trong contracts — phải tra
                    // bảng contract_addendums trước, nếu không sẽ fallback S-2.
                    Contract ct = null;
                    var addendum = contractAddendumRepository.findByCode(refCode).orElse(null);
                    if (addendum != null) {
                        ct = addendum.getContract();
                    } else {
                        ct = contractRepository.findByCode(refCode).orElse(null);
                    }
                    if (ct != null) {
                        unitCode = "Unit " + ct.getReservation().getUnit().getCode();
                        customerName = ct.getReservation().getCustomer().getFullName();
                        customerPhone = ct.getReservation().getCustomer().getPhone();
                    }
                    if (addendum != null && addendum.getExtension() != null) {
                        var ext = addendum.getExtension();
                        rentAmount = ext.getExtensionFee() != null
                                ? ext.getExtensionFee().longValueExact() : null;
                        extensionRent = rentAmount;
                        depositPaid = ext.getNewDeposit() != null
                                ? ext.getNewDeposit().longValueExact() : null;
                        paymentRequired = ext.getStatus() == Extension.Status.PENDING_CONTRACT;
                        alertNote = "Thu 100% rent kỳ gia hạn tại quầy khi ký phụ lục";
                    }
                }
                ritual = new TaskRitualDto(
                        null, null,
                        isDone,
                        isDone ? "/placeholder.svg" : null,
                        null, null, null, null, null, null, null
                );
            }
        }

        AssignedStaffDto assignedStaffDto = task.getAssignedStaff() == null
                ? null
                : new AssignedStaffDto(
                        task.getAssignedStaff().getUserId(),
                        task.getAssignedStaff().getFullName());

        String effectiveAlertNote = alertNote != null ? alertNote : task.getNote();
        java.util.List<TaskAssetDto> assets = checkoutUnitId == null ? null : loadTaskAssets(checkoutUnitId);
        return new TaskResponse(
                task.getTaskId(),
                task.getType(),
                task.getRefCode(),
                unitCode,
                customerName,
                customerPhone,
                dueTime,
                task.getStatus(),
                task.getWorkDate(),
                task.getShift() != null ? task.getShift() : (shift != null ? shift : getCurrentShift()),
                accessPin,
                rentAmount,
                depositPaid,
                priority,
                issueDesc,
                effectiveAlertNote,
                assignedStaffDto,
                ritual,
                includePhotos ? task.getPaymentProofPhoto() : null,
                includePhotos ? task.getContractPhoto() : null,
                includePhotos ? task.getSettlementPhoto() : null,
                assets,
                paymentRequired,
                extensionRent,
                lateInfo
        );
    }

    @Override
    public Task createContractTask(User actor, com.storagehub.entity.ContractAddendum addendum) {
        if (addendum == null || addendum.getCode() == null || addendum.getCode().isBlank()) {
            throw new IllegalArgumentException("Không thể tạo task CONTRACT thiếu phụ lục.");
        }

        Task existing = taskRepository
                .findFirstByTypeAndRefCodeOrderByCreatedAtDesc(
                        Task.Type.CONTRACT, addendum.getCode())
                .orElse(null);
        if (existing != null) {
            return existing;
        }

        Reservation reservation = addendum.getContract().getReservation();
        Unit unit = reservation.getUnit();
        LocalDate workDate = getToday();
        StaffAssignment.Shift shift = getCurrentShift();
        User assignee = autoAssignStaff(unit, workDate, shift);

        Task task = new Task();
        task.setType(Task.Type.CONTRACT);
        task.setRefCode(addendum.getCode());
        task.setAssignedStaff(assignee);
        task.setShift(shift);
        task.setUnitType(unit != null ? unit.getType() : null);
        task.setFacility(facilityOf(unit));
        task.setWorkDate(workDate);
        task.setStatus(Task.Status.TODO);
        LocalDate extensionStart = addendum.getExtension() != null
                ? addendum.getExtension().getOldEndDate().plusDays(1)
                : workDate;
        int extensionGrace = pricingEngine.ruleInt(
                unit,
                addendum.getPolicy(),
                PolicyRule.RuleType.EXTENSION_GRACE_DAYS,
                3);
        task.setExpiresOn(extensionStart.plusDays(extensionGrace));
        task.setNote("Hạn ký phụ lục: " + addendum.getSignatureDueDate());
        Task saved = taskRepository.save(task);

        User logActor = actor != null ? actor : assignee;
        logService.log(logActor != null ? logActor : reservation.getCustomer(),
                "TASK", saved.getTaskId(),
                "CREATED", null, Task.Status.TODO.name(),
                "Auto contract-signature task cho " + addendum.getCode()
                        + (assignee != null ? " — " + assignee.getFullName() : " — chưa phân công"));
        return saved;
    }

    @Override
    public Task createCheckInTask(User actor, Reservation reservation) {
        Task existing = taskRepository
                .findFirstByTypeAndRefCodeOrderByCreatedAtDesc(
                        Task.Type.CHECK_IN, reservation.getCode())
                .orElse(null);
        if (existing != null) {
            return existing;
        }

        StaffAssignment.Shift shift = getCurrentShift();
        User assignee = autoAssignStaff(reservation.getUnit(), reservation.getStartDate(), shift);

        Task task = new Task();
        task.setType(Task.Type.CHECK_IN);
        task.setRefCode(reservation.getCode());
        task.setAssignedStaff(assignee);
        task.setShift(shift);
        task.setUnitType(reservation.getUnit().getType());
        task.setFacility(facilityOf(reservation.getUnit()));
        task.setWorkDate(reservation.getStartDate());
        task.setStatus(Task.Status.TODO);
        int checkinGrace = pricingEngine.ruleInt(
                reservation.getUnit(),
                reservation.getPolicy(),
                PolicyRule.RuleType.CHECKIN_GRACE_DAYS,
                3);
        task.setExpiresOn(reservation.getStartDate().plusDays(checkinGrace));
        Task saved = taskRepository.save(task);

        logService.log(actor != null ? actor : assignee,
                "TASK", saved.getTaskId(),
                "CREATED", null, "TODO",
                "Auto check-in task cho " + reservation.getCode());
        return saved;
    }

    /** Gắn trách nhiệm resolve ticket cho TaskServiceImpl (tránh vòng phụ thuộc TicketService). */
    private void resolveSupportTicketByTask(User staff, String ticketCode) {
        supportTicketRepository.findByCode(ticketCode).ifPresent(ticket -> {
            if (ticket.getStatus() == com.storagehub.entity.SupportTicket.Status.RESOLVED) {
                return; // idempotent
            }
            String oldStatus = ticket.getStatus().name();
            ticket.setStatus(com.storagehub.entity.SupportTicket.Status.RESOLVED);
            if (ticket.getAssignedStaff() == null) {
                ticket.setAssignedStaff(staff);
            }
            if (ticket.getResolutionNote() == null || ticket.getResolutionNote().isBlank()) {
                ticket.setResolutionNote("Đã xử lý xong bởi " + staff.getFullName()
                        + " qua Task Board (" + ticketCode + ").");
            }
            ticket.setResolvedAt(java.time.LocalDateTime.now());
            supportTicketRepository.save(ticket);
            notificationService.notifyTicketStatusChanged(ticket, oldStatus);
        });
    }

    @Override
    @org.springframework.transaction.annotation.Transactional
    public com.storagehub.dto.task.TaskResponse completeContractRitual(
            String currentUserEmail,
            Long taskId,
            com.storagehub.dto.task.ContractRitualRequest request
    ) {
        User staff = userRepository.findByEmailIgnoreCase(currentUserEmail)
                .orElseThrow(() -> new org.springframework.security.access.AccessDeniedException("Người dùng không tồn tại"));
        if (staff.getRole().getName() == Role.Name.CUSTOMER) {
            throw new org.springframework.security.access.AccessDeniedException("Chỉ nhân viên mới được ký phụ lục tại quầy.");
        }
        if (request == null || request.contractPhotoUrl() == null || request.contractPhotoUrl().isBlank()) {
            throw new com.storagehub.exception.BusinessRuleException(
                    "Ảnh chụp bản ký hợp đồng/phụ lục là bắt buộc.");
        }

        Task task = taskRepository.findWithStaffById(taskId)
                .orElseThrow(() -> new TaskNotFoundException(taskId));
        if (task.getType() != Task.Type.CONTRACT) {
            throw new com.storagehub.exception.BusinessRuleException("Task không phải loại CONTRACT.");
        }
        if (task.getStatus() == Task.Status.DONE) {
            return toTaskResponse(task, getCurrentShift(), null, null, null, null, true);
        }

        String ref = task.getRefCode();
        if (ref == null || ref.isBlank()) {
            throw new com.storagehub.exception.BusinessRuleException("Task thiếu mã hợp đồng/phụ lục.");
        }

        var addendum = contractAddendumRepository.findByCode(ref).orElse(null);
        if (addendum != null) {
            var extension = addendum.getExtension();
            if (extension != null && extension.getStatus() == Extension.Status.PENDING_CONTRACT) {
                if (request.paymentMethod() == null || request.paymentMethod().isBlank()
                        || request.paymentProofPhoto() == null || request.paymentProofPhoto().isBlank()) {
                    throw new com.storagehub.exception.BusinessRuleException(
                            "Gia hạn cần thu 100% rent và ảnh chứng từ tại quầy.");
                }
                com.storagehub.entity.Payment.Method method = switch (request.paymentMethod().toUpperCase()) {
                    case "CASH" -> com.storagehub.entity.Payment.Method.CASH;
                    case "QR" -> com.storagehub.entity.Payment.Method.BANK;
                    case "POS" -> com.storagehub.entity.Payment.Method.POS;
                    default -> throw new com.storagehub.exception.BusinessRuleException(
                            "Phương thức thu tiền không hợp lệ: " + request.paymentMethod());
                };
                boolean rentCollected = paymentRepository.findByExtension_ExtensionId(extension.getExtensionId())
                        .stream()
                        .anyMatch(p -> p.getPurpose() == com.storagehub.entity.Payment.Purpose.EXTENSION_RENT
                                && p.getStatus() == com.storagehub.entity.Payment.Status.SUCCEEDED);
                if (!rentCollected) {
                    com.storagehub.entity.Payment rent = new com.storagehub.entity.Payment();
                    rent.setPayer(extension.getReservation().getCustomer());
                    rent.setExtension(extension);
                    rent.setPurpose(com.storagehub.entity.Payment.Purpose.EXTENSION_RENT);
                    rent.setMethod(method);
                    rent.setAmount(extension.getExtensionFee());
                    rent.setStatus(com.storagehub.entity.Payment.Status.SUCCEEDED);
                    rent.setReceiptCode("RT-ER-" + System.currentTimeMillis());
                    paymentRepository.saveAndFlush(rent);
                    logService.log(staff, "PAYMENT", rent.getPaymentId(), "PAYMENT_SUCCEEDED",
                            null, "SUCCEEDED", "Thu 100% rent gia hạn " + extension.getExtensionFee() + " ₫");
                }
            }
            contractService.signAddendum(
                    currentUserEmail,
                    addendum.getAddendumId(),
                    new com.storagehub.dto.contract.ContractAddendumSignRequest(
                            request.contractPhotoUrl(), request.notes()));
            if (extension != null) {
                extension.setStatus(Extension.Status.APPLIED);
                extensionRepository.save(extension);
            }
        } else {
            com.storagehub.entity.Contract contract = contractRepository.findByCode(ref)
                    .orElseThrow(() -> new com.storagehub.exception.BusinessRuleException(
                            "Không tìm thấy hợp đồng/phụ lục " + ref + "."));
            contractService.signContractAtCheckIn(
                    staff, contract.getReservation(), request.contractPhotoUrl());
        }

        task.setStatus(Task.Status.DONE);
        task.setContractPhoto(request.contractPhotoUrl());
        if (request.paymentProofPhoto() != null) {
            task.setPaymentProofPhoto(request.paymentProofPhoto());
        }
        Task saved = taskRepository.save(task);
        logService.log(staff, "TASK", saved.getTaskId(), "STATUS_CHANGED",
                "IN_PROGRESS", "DONE",
                "Ký hợp đồng/phụ lục " + ref + " tại quầy");
        return toTaskResponse(saved, getCurrentShift(), null, null, null, null, true);
    }

    @Override
    @org.springframework.transaction.annotation.Transactional
    public com.storagehub.dto.task.TaskResponse completeCheckoutRitual(
            String currentUserEmail,
            Long taskId,
            com.storagehub.dto.task.CheckoutRitualRequest request
    ) {
        User staff = userRepository.findByEmailIgnoreCase(currentUserEmail)
                .orElseThrow(() -> new org.springframework.security.access.AccessDeniedException("Người dùng không tồn tại"));
        if (staff.getRole().getName() == Role.Name.CUSTOMER) {
            throw new org.springframework.security.access.AccessDeniedException("Chỉ nhân viên mới được tất toán trả kho.");
        }

        Task task = taskRepository.findWithStaffById(taskId)
                .orElseThrow(() -> new TaskNotFoundException(taskId));
        if (task.getType() != Task.Type.CHECKOUT) {
            throw new com.storagehub.exception.BusinessRuleException("Task không phải loại CHECKOUT.");
        }
        if (task.getStatus() == Task.Status.DONE) {
            return toTaskResponse(task, getCurrentShift(), null, null, null, null);
        }
        Reservation reservation = reservationRepository.findByCode(task.getRefCode())
                .orElseThrow(() -> new com.storagehub.exception.BusinessRuleException(
                        "Không tìm thấy đặt chỗ " + task.getRefCode() + "."));
        if (reservation.getStatus() != Reservation.Status.CHECKED_IN
                && reservation.getStatus() != Reservation.Status.CHECKOUT_REQUESTED) {
            throw new com.storagehub.exception.BusinessRuleException(
                    "Chỉ đơn CHECKED_IN / CHECKOUT_REQUESTED mới tất toán được.");
        }
        Contract contract = contractRepository
                .findByReservation_ReservationIdAndIsLatestTrue(reservation.getReservationId())
                .orElseThrow(() -> new com.storagehub.exception.BusinessRuleException(
                        "Đơn chưa có hợp đồng — không thể lập biên bản thanh lý."));

        lateCheckoutService.evaluate(reservation);
        com.storagehub.dto.checkout.LateCheckoutInfo lateInfo = lateCheckoutService.info(reservation);
        if (!lateInfo.canSettle()) {
            throw new com.storagehub.exception.BusinessRuleException(
                    lateInfo.blockMessage() != null
                            ? lateInfo.blockMessage()
                            : "Đơn chưa được phép tất toán.");
        }

        // 1. Bảng nghiệm thu (Inspection)
        java.util.List<com.storagehub.entity.Inspection> inspections = new java.util.ArrayList<>();
        for (var ci : request.checklist()) {
            // FE gửi accessCard/padlock/... hoặc ACCESS_CARD — chuẩn hoá về enum.
            String itemKey = ci.item()
                    .replaceAll("([a-z0-9])([A-Z])", "$1_$2")
                    .replace('-', '_')
                    .replace(' ', '_')
                    .toUpperCase(java.util.Locale.ROOT);
            var item = com.storagehub.entity.Inspection.Item.valueOf(itemKey);
            var result = com.storagehub.entity.Inspection.Result.valueOf(ci.result().toUpperCase(java.util.Locale.ROOT));
            com.storagehub.entity.Inspection ins = new com.storagehub.entity.Inspection();
            ins.setSettlement(null);
            ins.setItem(item);
            ins.setResult(result);
            inspections.add(ins);
        }

        // 2. Phí hư hại — lý do bắt buộc khi > 0 (DB CHECK constraint)
        long damageFee = request.damageCharges() == null ? 0L
                : request.damageCharges().stream().mapToLong(c -> c.amount() == null ? 0L : c.amount()).sum();
        String damageReason = null;
        if (damageFee > 0) {
            damageReason = request.damageCharges().stream()
                    .filter(c -> c.amount() != null && c.amount() > 0)
                    .map(c -> c.item() + ": " + c.reason())
                    .reduce((a, b) -> a + "; " + b)
                    .orElse("Phí hư hại ghi nhận tại quầy");
        }

        long depositHeld = reservation.getDepositAmount() != null
                ? reservation.getDepositAmount().longValue()
                : 0L;
        long lateDays = lateInfo.daysLate();
        long lateFee = lateInfo.lateFee();
        long refundAmount = Math.max(0, depositHeld - damageFee - lateFee);
        long extraCharged = Math.max(0, damageFee + lateFee - depositHeld);

        // 3. Settlement — biên bản tất toán (server-authoritative amounts)
        var method = switch (request.settlementMethod().toUpperCase()) {
            case "CASH" -> com.storagehub.entity.Payment.Method.CASH;
            case "QR", "TRANSFER", "BANK" -> com.storagehub.entity.Payment.Method.BANK;
            case "POS" -> com.storagehub.entity.Payment.Method.POS;
            default -> throw new com.storagehub.exception.BusinessRuleException(
                    "Phương thức tất toán không hợp lệ: " + request.settlementMethod());
        };
        com.storagehub.entity.Settlement settlement = new com.storagehub.entity.Settlement();
        settlement.setReservation(reservation);
        settlement.setContract(contract);
        settlement.setStaff(staff);
        settlement.setDamageFee(java.math.BigDecimal.valueOf(damageFee));
        settlement.setDamageReason(damageReason);
        settlement.setLateDays((int) lateDays);
        settlement.setLateFee(java.math.BigDecimal.valueOf(lateFee));
        settlement.setSettlementType("NORMAL");
        settlement.setRefundAmount(java.math.BigDecimal.valueOf(refundAmount));
        settlement.setReceiptCode("TL-" + System.currentTimeMillis());
        settlement.setNote("Cọc " + depositHeld + " ₫; hư hại " + damageFee
                + " ₫; trễ " + lateDays + " ngày × " + lateInfo.lateFeePercent() + "% = " + lateFee
                + " ₫; hoàn " + refundAmount + " ₫; thu thêm " + extraCharged + " ₫");
        settlementRepository.save(settlement);

        // 4. Tiền thu thêm (vượt cọc) — một payment EXTRA_FEE, breakdown nằm trên settlement.
        if (extraCharged > 0) {
            saveSettlementPayment(reservation, settlement, staff,
                    com.storagehub.entity.Payment.Purpose.EXTRA_FEE, method, extraCharged,
                    "Phí hư hại + phạt trễ vượt cọc thu tại quầy");
        }

        // 5. Inspection với FK settlement
        for (com.storagehub.entity.Inspection ins : inspections) {
            ins.setSettlement(settlement);
            inspectionRepository.save(ins);
        }

        // 5b. Thiết bị trong kho (unit_assets) — chỉ nhận asset thuộc đúng kho.
        if (request.assetChecks() != null && !request.assetChecks().isEmpty()) {
            if (unitAssetRepository == null || inspectionAssetRepository == null) {
                throw new com.storagehub.exception.BusinessRuleException(
                        "Chưa cấu hình kho thiết bị để nghiệm thu.");
            }
            for (var check : request.assetChecks()) {
                if (check.assetId() == null) continue;
                UnitAsset asset = unitAssetRepository.findById(check.assetId())
                        .orElseThrow(() -> new com.storagehub.exception.BusinessRuleException(
                                "Thiết bị không tồn tại: " + check.assetId()));
                if (!asset.getUnit().getUnitId().equals(reservation.getUnit().getUnitId())) {
                    throw new com.storagehub.exception.BusinessRuleException(
                            "Thiết bị không thuộc kho " + reservation.getUnit().getCode());
                }
                String result = check.result() == null ? "OK" : check.result().toUpperCase(java.util.Locale.ROOT);
                if (!result.equals("OK") && !result.equals("MINOR") && !result.equals("MAJOR")) {
                    throw new com.storagehub.exception.BusinessRuleException(
                            "Kết quả thiết bị không hợp lệ: " + check.result());
                }
                com.storagehub.entity.InspectionAsset ia = new com.storagehub.entity.InspectionAsset();
                ia.setSettlement(settlement);
                ia.setUnitAsset(asset);
                ia.setResult(result);
                ia.setNote(check.note());
                inspectionAssetRepository.save(ia);
                asset.setStatus(result.equals("OK") ? "OK" : "NEEDS_SERVICE");
                unitAssetRepository.save(asset);
            }
        }

        // 6. Đóng vòng thuê: reservation CLOSED, contract CLOSED, kho về PREPARING
        String oldResStatus = reservation.getStatus().name();
        reservation.setStatus(Reservation.Status.CLOSED);
        reservation.setClosedAt(java.time.LocalDateTime.now(ICT_ZONE));
        reservationRepository.save(reservation);
        contract.setStatus(Contract.Status.CLOSED);
        contractRepository.save(contract);
        Unit unit = reservation.getUnit();
        unit.setStatus(Unit.Status.PREPARING);
        unitRepository.save(unit);
        checkoutRequestRepository.findByReservation_ReservationIdOrderByCreatedAtDesc(
                        reservation.getReservationId()).stream()
                .filter(cr -> cr.getStatus() == com.storagehub.entity.CheckoutRequest.Status.PENDING)
                .forEach(cr -> {
                    cr.setStatus(com.storagehub.entity.CheckoutRequest.Status.DONE);
                    checkoutRequestRepository.save(cr);
                });

        logService.log(staff, "RESERVATION", reservation.getReservationId(),
                "STATUS_CHANGED", oldResStatus, "CLOSED",
                "Tất toán " + settlement.getReceiptCode() + " — hoàn cọc " + refundAmount
                        + " ₫, phí hư hại " + damageFee + " ₫, phạt trễ " + lateFee
                        + " ₫ (" + lateDays + " ngày)"
                        + (extraCharged > 0 ? ", thu thêm " + extraCharged + " ₫" : ""));
        lateCheckoutService.markResolved(reservation);

        // 7. Task DONE + báo khách
        task.setStatus(Task.Status.DONE);
        task.setSettlementPhoto(request.settlementPhotoUrl());
        Task saved = taskRepository.save(task);
        notificationService.notifySettlementCompleted(reservation, refundAmount);

        return toTaskResponse(saved, getCurrentShift(), null, null, null, null);
    }

    private void saveSettlementPayment(
            Reservation reservation,
            com.storagehub.entity.Settlement settlement,
            User staff,
            com.storagehub.entity.Payment.Purpose purpose,
            com.storagehub.entity.Payment.Method method,
            long amount,
            String note
    ) {
        com.storagehub.entity.Payment p = new com.storagehub.entity.Payment();
        p.setPayer(reservation.getCustomer());
        // CHECK đúng-một-nguồn: settlement payment chỉ gắn settlement_id,
        // reservation được suy ra qua settlement khi đọc.
        p.setSettlement(settlement);
        p.setPurpose(purpose);
        p.setMethod(method);
        p.setAmount(java.math.BigDecimal.valueOf(amount));
        p.setStatus(com.storagehub.entity.Payment.Status.SUCCEEDED);
        p.setReceiptCode("RT-TT-" + System.currentTimeMillis());
        paymentRepository.save(p);
        logService.log(staff, "PAYMENT", p.getPaymentId(), "PAYMENT_SUCCEEDED",
                null, "SUCCEEDED", note + " — " + amount + " ₫");
    }

    @Override
    @org.springframework.transaction.annotation.Transactional(
            propagation = org.springframework.transaction.annotation.Propagation.NOT_SUPPORTED)
    public com.storagehub.dto.task.TaskResponse completeCheckinRitual(
            String currentUserEmail,
            Long taskId,
            com.storagehub.dto.task.CheckinRitualRequest request
    ) {
        User staff = userRepository.findByEmailIgnoreCase(currentUserEmail)
                .orElseThrow(() -> new org.springframework.security.access.AccessDeniedException("Người dùng không tồn tại"));
        if (staff.getRole().getName() == Role.Name.CUSTOMER) {
            throw new org.springframework.security.access.AccessDeniedException("Chỉ nhân viên mới được hoàn tất nhận kho.");
        }

        Task task = taskRepository.findWithStaffById(taskId)
                .orElseThrow(() -> new TaskNotFoundException(taskId));
        if (task.getType() != Task.Type.CHECK_IN) {
            throw new com.storagehub.exception.BusinessRuleException("Task không phải loại CHECK_IN.");
        }
        if (task.getStatus() == Task.Status.DONE) {
            return toTaskResponse(task, getCurrentShift(), null, null, null, null);
        }
        Reservation reservation = reservationRepository.findByCode(task.getRefCode())
                .orElseThrow(() -> new com.storagehub.exception.BusinessRuleException(
                        "Không tìm thấy đặt chỗ " + task.getRefCode() + "."));
        if (reservation.getStatus() != Reservation.Status.RESERVED) {
            throw new com.storagehub.exception.BusinessRuleException(
                    "Đơn " + reservation.getCode() + " không ở trạng thái RESERVED.");
        }

        com.storagehub.entity.Payment.Method method = switch (request.paymentMethod().toUpperCase()) {
            case "CASH" -> com.storagehub.entity.Payment.Method.CASH;
            case "QR" -> com.storagehub.entity.Payment.Method.BANK;
            case "POS" -> com.storagehub.entity.Payment.Method.POS;
            default -> throw new com.storagehub.exception.BusinessRuleException(
                    "Phương thức thu tiền không hợp lệ: " + request.paymentMethod());
        };

        // Không bọc cả ritual trong 1 transaction: payment RENT insert giữ S-lock
        // FK reservations, còn checkIn cần FOR UPDATE cùng row → deadlock nếu
        // dùng 2 transaction chồng nhau. Tách: ghi payment (commit) → checkIn →
        // DONE task. Retry sẽ tái dùng payment RENT đã có.
        boolean rentCollected = paymentRepository
                .findByReservation_ReservationId(reservation.getReservationId()).stream()
                .anyMatch(p -> p.getPurpose() == com.storagehub.entity.Payment.Purpose.RENT
                        && p.getStatus() == com.storagehub.entity.Payment.Status.SUCCEEDED);
        if (!rentCollected) {
            Unit unit = unitRepository.findWithDetailsById(reservation.getUnit().getUnitId())
                    .orElseThrow(() -> new com.storagehub.exception.BusinessRuleException("Không tìm thấy kho."));
            var quote = pricingEngine.calculateQuote(
                    unit, reservation.getStartDate(), reservation.getEndDate());
            transactionTemplate.executeWithoutResult(tx -> {
                com.storagehub.entity.Payment rent = new com.storagehub.entity.Payment();
                rent.setPayer(reservation.getCustomer());
                rent.setReservation(reservation);
                rent.setPurpose(com.storagehub.entity.Payment.Purpose.RENT);
                rent.setMethod(method);
                rent.setAmount(java.math.BigDecimal.valueOf(quote.totalRent()));
                rent.setStatus(com.storagehub.entity.Payment.Status.SUCCEEDED);
                rent.setReceiptCode("RT-CT-" + System.currentTimeMillis());
                paymentRepository.saveAndFlush(rent);
                logService.log(staff, "PAYMENT", rent.getPaymentId(), "PAYMENT_SUCCEEDED",
                        null, "SUCCEEDED",
                        "Thu tại quầy " + request.paymentMethod() + " — " + quote.totalRent()
                                + " ₫, có ảnh chứng từ (check-in " + reservation.getCode() + ")");
            });
        }

        long lateFee = reservationService.checkinLateFee(
                reservation, java.time.LocalDate.now(clock.withZone(ICT_ZONE)));
        boolean lateFeeCollected = paymentRepository
                .findByReservation_ReservationIdOrderByCreatedAtAsc(reservation.getReservationId())
                .stream()
                .anyMatch(p -> p.getPurpose() == com.storagehub.entity.Payment.Purpose.CHECKIN_LATE_FEE
                        && p.getStatus() == com.storagehub.entity.Payment.Status.SUCCEEDED);
        if (lateFee > 0 && !lateFeeCollected) {
            transactionTemplate.executeWithoutResult(tx -> {
                com.storagehub.entity.Payment late = new com.storagehub.entity.Payment();
                late.setPayer(reservation.getCustomer());
                late.setReservation(reservation);
                late.setPurpose(com.storagehub.entity.Payment.Purpose.CHECKIN_LATE_FEE);
                late.setMethod(method);
                late.setAmount(java.math.BigDecimal.valueOf(lateFee));
                late.setStatus(com.storagehub.entity.Payment.Status.SUCCEEDED);
                late.setReceiptCode("RT-LF-" + System.currentTimeMillis());
                paymentRepository.saveAndFlush(late);
                logService.log(staff, "PAYMENT", late.getPaymentId(), "PAYMENT_SUCCEEDED",
                        null, "SUCCEEDED",
                        "Phí check-in trễ " + lateFee + " ₫ — " + reservation.getCode());
            });
        }

        // CheckIn mở transaction riêng, không còn outer transaction giữ FK lock.
        reservationService.checkIn(currentUserEmail, reservation.getReservationId(),
                request.contractPhotoUrl());

        Task saved = transactionTemplate.execute(tx -> {
            Task current = taskRepository.findWithStaffById(taskId)
                    .orElseThrow(() -> new TaskNotFoundException(taskId));
            String oldStatus = current.getStatus().name();
            current.setStatus(Task.Status.DONE);
            current.setPaymentProofPhoto(request.paymentProofPhoto());
            current.setContractPhoto(request.contractPhotoUrl());
            Task done = taskRepository.save(current);
            logService.log(staff, "TASK", done.getTaskId(),
                    "STATUS_CHANGED", oldStatus, "DONE",
                    "Check-in ritual hoàn tất — " + reservation.getCode());
            return done;
        });

        return toTaskResponse(saved, getCurrentShift(), null, null, null, null);
    }

    @Override
    @org.springframework.transaction.annotation.Transactional
    public Task createSupportTask(com.storagehub.entity.SupportTicket ticket) {
        Task existing = taskRepository
                .findFirstByTypeAndRefCodeOrderByCreatedAtDesc(
                        Task.Type.SUPPORT, ticket.getCode())
                .orElse(null);
        User assignee = ticket.getAssignedStaff();
        if (assignee == null) {
            assignee = autoAssignStaff(ticket.getUnit(), java.time.LocalDate.now(), getCurrentShift());
        }

        if (existing != null) {
            existing.setAssignedStaff(assignee);
            existing.setStatus(Task.Status.TODO);
            existing.setWorkDate(java.time.LocalDate.now());
            existing.setShift(getCurrentShift());
            existing.setUnitType(ticket.getUnit().getType());
            existing.setFacility(facilityOf(ticket.getUnit()));
            existing.setClaimedAt(null);
            existing.setNote(ticket.getManagerPlan());
            Task reopened = taskRepository.save(existing);
            logService.log(ticket.getCustomer(), "TASK", reopened.getTaskId(),
                    "REOPENED", "DONE", Task.Status.TODO.name(),
                    "Manager trả ticket " + ticket.getCode() + " cho "
                            + (assignee != null ? assignee.getFullName() : "chưa phân công"));
            return reopened;
        }

        Task task = new Task();
        task.setType(Task.Type.SUPPORT);
        task.setRefCode(ticket.getCode());
        task.setAssignedStaff(assignee);
        task.setShift(getCurrentShift());
        task.setUnitType(ticket.getUnit().getType());
        task.setFacility(facilityOf(ticket.getUnit()));
        task.setWorkDate(java.time.LocalDate.now());
        task.setStatus(Task.Status.TODO);
        task.setNote(ticket.getManagerPlan());
        Task saved = taskRepository.save(task);

        logService.log(ticket.getCustomer(), "TASK", saved.getTaskId(),
                "CREATED", null, Task.Status.TODO.name(),
                "Auto support task cho ticket " + ticket.getCode());
        return saved;
    }

    @Override
    public Task completeCheckInTask(User actor, String reservationCode) {
        Task task = taskRepository
                .findFirstByTypeAndRefCodeAndStatusIn(
                        Task.Type.CHECK_IN,
                        reservationCode,
                        List.of(Task.Status.TODO, Task.Status.IN_PROGRESS))
                .orElse(null);
        if (task == null) {
            return null;
        }

        String fromStatus = task.getStatus().name();
        task.setStatus(Task.Status.DONE);
        Task saved = taskRepository.save(task);

        logService.log(actor, "TASK", saved.getTaskId(),
                "STATUS_CHANGED", fromStatus, "DONE",
                "Check-in completed — " + reservationCode);
        return saved;
    }

    @Override
    public Task createOrUpdateCheckoutTask(
            User actor,
            Reservation reservation,
            LocalDate requestedDate,
            String timeSlot,
            String reason
    ) {
        StaffAssignment.Shift shift;
        if ("MORNING".equalsIgnoreCase(timeSlot)) {
            shift = StaffAssignment.Shift.MORNING;
        } else if ("AFTERNOON".equalsIgnoreCase(timeSlot)) {
            shift = StaffAssignment.Shift.AFTERNOON;
        } else if ("EVENING".equalsIgnoreCase(timeSlot)) {
            shift = StaffAssignment.Shift.EVENING;
        } else {
            shift = getCurrentShift();
        }

        Task existing = taskRepository
                .findFirstByTypeAndRefCodeAndStatusIn(
                        Task.Type.CHECKOUT,
                        reservation.getCode(),
                        List.of(Task.Status.TODO, Task.Status.IN_PROGRESS))
                .orElse(null);

        if (existing != null) {
            existing.setWorkDate(requestedDate);
            existing.setShift(shift);
            existing.setUnitType(reservation.getUnit().getType());
            existing.setFacility(facilityOf(reservation.getUnit()));
            try {
                User assignee = autoAssignStaff(reservation.getUnit(), requestedDate, shift);
                if (assignee != null) existing.setAssignedStaff(assignee);
            } catch (Exception ignored) {
            }
            Task saved = taskRepository.save(existing);
            logService.log(actor, "TASK", saved.getTaskId(),
                    "STATUS_CHANGED", saved.getStatus().name(), saved.getStatus().name(),
                    "Cập nhật ngày hẹn trả kho: " + requestedDate + (reason != null ? " (" + reason + ")" : ""));
            return saved;
        }

        User assignee;
        try {
            assignee = autoAssignStaff(reservation.getUnit(), requestedDate, shift);
        } catch (Exception e) {
            assignee = actor;
        }

        Task task = new Task();
        task.setType(Task.Type.CHECKOUT);
        task.setRefCode(reservation.getCode());
        task.setAssignedStaff(assignee);
        task.setShift(shift);
        task.setUnitType(reservation.getUnit().getType());
        task.setFacility(facilityOf(reservation.getUnit()));
        task.setWorkDate(requestedDate);
        task.setStatus(Task.Status.TODO);
        Task saved = taskRepository.save(task);

        logService.log(actor != null ? actor : assignee,
                "TASK", saved.getTaskId(),
                "CREATED", null, Task.Status.TODO.name(),
                "Auto checkout task cho " + reservation.getCode() + " ngày " + requestedDate);
        return saved;
    }

    @Override
    public void cancelCheckoutTask(User actor, String reservationCode) {
        Task task = taskRepository
                .findFirstByTypeAndRefCodeAndStatusIn(
                        Task.Type.CHECKOUT,
                        reservationCode,
                        List.of(Task.Status.TODO, Task.Status.IN_PROGRESS))
                .orElse(null);
        if (task != null) {
            Long taskId = task.getTaskId();
            String fromStatus = task.getStatus().name();
            taskRepository.delete(task);
            logService.log(actor, "TASK", taskId,
                    "DELETED", fromStatus, null,
                    "Hủy checkout task cho " + reservationCode);
        }
    }

    @Override
    public Task createCleaningTask(User actor, Reservation reservation, String note, LocalDate workDate) {
        Unit unit = reservation.getUnit();
        if (unit == null) {
            throw new com.storagehub.exception.BusinessRuleException("Đơn không có kho để dọn.");
        }
        LocalDate date = workDate != null ? workDate : getToday();
        StaffAssignment.Shift shift = getCurrentShift();
        String cleanNote = note != null && note.length() > 500 ? note.substring(0, 500) : note;

        Task existing = taskRepository
                .findFirstByTypeAndRefCodeAndStatusIn(
                        Task.Type.CLEANING,
                        unit.getCode(),
                        List.of(Task.Status.TODO, Task.Status.IN_PROGRESS))
                .orElse(null);
        if (existing != null) {
            existing.setWorkDate(date);
            existing.setShift(shift);
            existing.setUnitType(unit.getType());
            existing.setNote(cleanNote);
            try {
                existing.setAssignedStaff(autoAssignStaff(unit, date, shift));
            } catch (Exception ignored) {
            }
            Task saved = taskRepository.save(existing);
            logService.log(actor, "TASK", saved.getTaskId(), "UPDATED",
                    saved.getStatus().name(), saved.getStatus().name(),
                    "Cập nhật cleaning task thanh lý kho " + unit.getCode());
            return saved;
        }

        User assignee;
        try {
            assignee = autoAssignStaff(unit, date, shift);
        } catch (Exception e) {
            assignee = actor;
        }
        Task task = new Task();
        task.setType(Task.Type.CLEANING);
        task.setRefCode(unit.getCode());
        task.setAssignedStaff(assignee);
        task.setShift(shift);
        task.setUnitType(unit.getType());
        task.setWorkDate(date);
        task.setStatus(Task.Status.TODO);
        task.setNote(cleanNote);
        Task saved = taskRepository.save(task);
        logService.log(actor, "TASK", saved.getTaskId(), "CREATED", null, Task.Status.TODO.name(),
                "Cleaning task thanh lý kho " + unit.getCode() + " — " + reservation.getCode());
        return saved;
    }

    @Override
    @Transactional(readOnly = true)
    public boolean hasActiveCleaningTask(String unitCode) {
        if (unitCode == null) {
            return false;
        }
        return taskRepository.existsByTypeAndRefCodeAndStatusIn(
                Task.Type.CLEANING,
                unitCode,
                List.of(Task.Status.TODO, Task.Status.IN_PROGRESS));
    }

    private java.util.List<TaskAssetDto> loadTaskAssets(Long unitId) {
        if (unitAssetRepository == null) return java.util.List.of();
        return unitAssetRepository.findByUnit_UnitIdOrderByUnitAssetIdAsc(unitId).stream()
                .map(a -> new TaskAssetDto(
                        a.getUnitAssetId(),
                        a.getAssetType() != null ? a.getAssetType().getCode() : null,
                        a.getAssetType() != null ? a.getAssetType().getName() : null,
                        a.getSerialNo(),
                        a.getStatus(),
                        a.getLastServiceAt(),
                        a.getNote()))
                .toList();
    }

    /** Manager chỉ được xem task thuộc facility của mình. */
    private void assertTaskFacility(User currentUser, Task task) {
        if (currentUser.getRole().getName() != Role.Name.FACILITY_MANAGER
                || currentUser.getFacility() == null) {
            return;
        }
        Integer taskFacilityId = task.getFacility() != null
                ? task.getFacility().getFacilityId()
                : task.getAssignedStaff() != null && task.getAssignedStaff().getFacility() != null
                    ? task.getAssignedStaff().getFacility().getFacilityId()
                    : null;
        if (taskFacilityId != null
                && !currentUser.getFacility().getFacilityId().equals(taskFacilityId)) {
            throw new org.springframework.security.access.AccessDeniedException(
                    "Nhiệm vụ thuộc cơ sở khác.");
        }
    }
}
