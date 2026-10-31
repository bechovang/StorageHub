package com.storagehub.service.impl;

import com.storagehub.dto.task.AssignedStaffDto;
import com.storagehub.dto.task.CreateTaskRequest;
import com.storagehub.dto.task.TaskResponse;
import com.storagehub.dto.task.TaskRitualDto;
import com.storagehub.entity.*;
import com.storagehub.exception.TaskNotFoundException;
import com.storagehub.exception.TaskSnapBackException;
import com.storagehub.repository.*;
import com.storagehub.service.LogService;
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
    @Transactional(readOnly = true)
    public List<TaskResponse> getTasks(
            String currentUserEmail,
            LocalDate workDate,
            StaffAssignment.Shift shift,
            Task.Type type,
            Task.Status status
    ) {
        User currentUser = userRepository.findByEmailIgnoreCase(currentUserEmail)
                .orElseThrow(() -> new AccessDeniedException("Người dùng không tồn tại"));

        Role.Name roleName = currentUser.getRole().getName();
        if (roleName != Role.Name.STAFF &&
                roleName != Role.Name.FACILITY_MANAGER &&
                roleName != Role.Name.SYSTEM_ADMIN) {
            throw new AccessDeniedException("Chỉ Staff hoặc Quản lý mới có quyền truy cập Task Board");
        }

        boolean isDefaultDate = (workDate == null);
        LocalDate targetDate = isDefaultDate ? getToday() : workDate;
        StaffAssignment.Shift targetShift = (shift != null) ? shift : getCurrentShift();

        List<Task> tasks;
        if (roleName == Role.Name.STAFF) {
            tasks = taskRepository.findFilteredTasks(currentUser.getUserId(), targetDate, type, status);
            // Fallback khi xem mặc định ngày hôm nay mà DB chưa có task hôm nay -> lấy task gần nhất của staff
            if (tasks.isEmpty() && isDefaultDate) {
                tasks = taskRepository.findStaffTasks(currentUser.getUserId(), type, status);
            }
        } else {
            tasks = taskRepository.findFilteredTasks(null, targetDate, type, status);
            if (tasks.isEmpty() && isDefaultDate) {
                tasks = taskRepository.findFilteredTasks(null, null, type, status);
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

        return toTaskResponse(task, getCurrentShift(), null, null, null, null);
    }

    @Override
    public TaskResponse updateTaskStatus(String currentUserEmail, Long taskId, Task.Status newStatus) {
        User currentUser = userRepository.findByEmailIgnoreCase(currentUserEmail)
                .orElseThrow(() -> new AccessDeniedException("Người dùng không tồn tại"));

        Task task = taskRepository.findWithStaffById(taskId)
                .orElseThrow(() -> new TaskNotFoundException(taskId));

        Role.Name roleName = currentUser.getRole().getName();
        if (roleName == Role.Name.STAFF && !currentUser.getUserId().equals(task.getAssignedStaff().getUserId())) {
            throw new AccessDeniedException("Bạn không được phân công xử lý nhiệm vụ này.");
        }

        // Kiểm tra Snap-back chống Done ảo (FR-22 / AD-8)
        if (newStatus == Task.Status.DONE) {
            validateSnapBackRule(task);
        }

        Task.Status oldStatus = task.getStatus();
        task.setStatus(newStatus);
        Task saved = taskRepository.save(task);

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
    public TaskResponse autoCreateTask(CreateTaskRequest request) {
        // 1. Xác định Unit liên kết
        Unit unit = resolveUnit(request);

        // 2. Xác định ngày làm việc và ca trực
        LocalDate workDate = (request.workDate() != null) ? request.workDate() : getToday();
        StaffAssignment.Shift shift = (request.shift() != null) ? request.shift() : getCurrentShift();

        // 3. Tự động phân công staff trực ca phụ trách Zone chứa Unit
        User assignedStaff = autoAssignStaff(unit, workDate, shift);

        // 4. Tạo thực thể Task
        Task task = new Task();
        task.setType(request.type());
        task.setRefCode(request.refCode());
        task.setAssignedStaff(assignedStaff);
        task.setWorkDate(workDate);
        task.setStatus(Task.Status.TODO);

        Task saved = taskRepository.save(task);

        String zoneCode = (unit != null && unit.getZone() != null) ? unit.getZone().getCode() : "Chung";
        logService.log(
                assignedStaff,
                "TASK",
                saved.getTaskId(),
                "TASK_CREATED",
                null,
                Task.Status.TODO.name(),
                "Tự động phân cho staff " + assignedStaff.getFullName() + " phụ trách Zone " + zoneCode + " ca " + shift
        );

        return toTaskResponse(saved, shift, request.dueTime(), request.priority(), request.alertNote(), request.issueDescription());
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

    private User autoAssignStaff(Unit unit, LocalDate workDate, StaffAssignment.Shift shift) {
        if (unit != null && unit.getZone() != null) {
            Integer zoneId = unit.getZone().getZoneId();
            Optional<StaffAssignment> assignment = staffAssignmentRepository
                    .findByZone_ZoneIdAndWorkDateAndShift(zoneId, workDate, shift);
            if (assignment.isPresent()) {
                return assignment.get().getStaff();
            }

            // Fallback 1: Staff cùng facility trực cùng ca
            if (unit.getZone().getFacility() != null) {
                Integer facilityId = unit.getZone().getFacility().getFacilityId();
                List<StaffAssignment> facilityAssignments = staffAssignmentRepository
                        .findByFacilityAndWorkDateAndShift(facilityId, workDate, shift);
                if (!facilityAssignments.isEmpty()) {
                    return facilityAssignments.get(0).getStaff();
                }
            }
        }

        // Fallback 2: Bất kỳ staff nào trực cùng ca
        List<StaffAssignment> shiftAssignments = staffAssignmentRepository.findByWorkDateAndShift(workDate, shift);
        if (!shiftAssignments.isEmpty()) {
            return shiftAssignments.get(0).getStaff();
        }

        // Fallback 3: Staff đầu tiên đang active trong hệ thống
        return userRepository.findFirstByRole_NameAndStatus(Role.Name.STAFF, 1)
                .orElseThrow(() -> new IllegalStateException("Không tìm thấy nhân viên trực ca để tự động phân công nhiệm vụ."));
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
        String refCode = task.getRefCode();
        String unitCode = "Unit S-3";
        String customerName = "Nguyễn Thị Lan";
        String customerPhone = "0901 234 567";
        String dueTime = customDueTime != null ? customDueTime : "09:00";
        String accessPin = null;
        Long rentAmount = null;
        Long depositPaid = null;
        String priority = customPriority;
        String issueDesc = customIssueDesc;
        String alertNote = customAlertNote;

        TaskRitualDto ritual = null;
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
                if (refCode != null && refCode.startsWith("SR-")) {
                    SupportTicket ticket = supportTicketRepository.findByCode(refCode).orElse(null);
                    if (ticket != null) {
                        unitCode = "Unit " + ticket.getUnit().getCode();
                        customerName = ticket.getCustomer().getFullName();
                        customerPhone = ticket.getCustomer().getPhone();
                        issueDesc = ticket.getIncidentType() != null ? ticket.getIncidentType().name() : issueDesc;
                    }
                }
                ritual = new TaskRitualDto(
                        null, null, null, null, null, null, null, null,
                        isDone ? "Đã xử lý sự cố" : "",
                        false,
                        ""
                );
            }
            case CONTRACT -> {
                dueTime = customDueTime != null ? customDueTime : "10:15";
                unitCode = "Unit S-2";
                customerName = "Phạm Tuấn";
                customerPhone = "0944 111 222";
                if (refCode != null && refCode.startsWith("CT-")) {
                    Contract ct = contractRepository.findByCode(refCode).orElse(null);
                    if (ct != null) {
                        unitCode = "Unit " + ct.getReservation().getUnit().getCode();
                        customerName = ct.getReservation().getCustomer().getFullName();
                        customerPhone = ct.getReservation().getCustomer().getPhone();
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

        AssignedStaffDto assignedStaffDto = new AssignedStaffDto(
                task.getAssignedStaff().getUserId(),
                task.getAssignedStaff().getFullName()
        );

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
                shift != null ? shift : getCurrentShift(),
                accessPin,
                rentAmount,
                depositPaid,
                priority,
                issueDesc,
                alertNote,
                assignedStaffDto,
                ritual
        );
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
        User assignee;
        try {
            assignee = autoAssignStaff(reservation.getUnit(), reservation.getStartDate(), shift);
        } catch (Exception e) {
            assignee = userRepository.findFirstByRole_NameAndStatus(Role.Name.STAFF, 1).orElse(null);
        }

        if (assignee == null) {
            return null;
        }

        Task task = new Task();
        task.setType(Task.Type.CHECK_IN);
        task.setRefCode(reservation.getCode());
        task.setAssignedStaff(assignee);
        task.setWorkDate(reservation.getStartDate());
        task.setStatus(Task.Status.TODO);
        Task saved = taskRepository.save(task);

        logService.log(actor != null ? actor : assignee, "TASK", saved.getTaskId(),
                "CREATED", null, "TODO",
                "Auto check-in task for " + reservation.getCode());
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
            try {
                User assignee = autoAssignStaff(reservation.getUnit(), requestedDate, shift);
                if (assignee != null) {
                    existing.setAssignedStaff(assignee);
                }
            } catch (Exception ignored) {
            }
            Task saved = taskRepository.save(existing);
            logService.log(actor != null ? actor : existing.getAssignedStaff(), "TASK", saved.getTaskId(),
                    "STATUS_CHANGED", saved.getStatus().name(), saved.getStatus().name(),
                    "Cập nhật ngày hẹn trả kho: " + requestedDate + (reason != null ? " (" + reason + ")" : ""));
            return saved;
        }

        User assignee;
        try {
            assignee = autoAssignStaff(reservation.getUnit(), requestedDate, shift);
        } catch (Exception e) {
            assignee = userRepository.findFirstByRole_NameAndStatus(Role.Name.STAFF, 1).orElse(null);
        }

        if (assignee == null) {
            assignee = actor;
        }

        Task task = new Task();
        task.setType(Task.Type.CHECKOUT);
        task.setRefCode(reservation.getCode());
        task.setAssignedStaff(assignee);
        task.setWorkDate(requestedDate);
        task.setStatus(Task.Status.TODO);
        Task saved = taskRepository.save(task);

        logService.log(actor != null ? actor : assignee, "TASK", saved.getTaskId(),
                "CREATED", null, Task.Status.TODO.name(),
                "Auto checkout task for " + reservation.getCode() + " on " + requestedDate);
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
}
