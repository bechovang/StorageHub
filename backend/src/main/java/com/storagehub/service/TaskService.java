package com.storagehub.service;

import com.storagehub.dto.quote.QuoteResponse;
import com.storagehub.dto.task.TaskResponse;
import com.storagehub.entity.Contract;
import com.storagehub.entity.Payment;
import com.storagehub.entity.Reservation;
import com.storagehub.entity.Role;
import com.storagehub.entity.Task;
import com.storagehub.entity.Unit;
import com.storagehub.entity.User;
import com.storagehub.repository.ContractRepository;
import com.storagehub.repository.PaymentRepository;
import com.storagehub.repository.ReservationRepository;
import com.storagehub.repository.StaffAssignmentRepository;
import com.storagehub.repository.TaskRepository;
import com.storagehub.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Set;

/**
 * US-15 (FR-11/14/15 + FR-25): owner duy nhất ghi bảng TASKS (AD-6).
 * Sinh task CHECK_IN tự động khi deposit thành công; ritual flags trên
 * GET /tasks là derive-on-read (AD-4) — không lưu trạng thái UI vào DB.
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class TaskService {

    private final TaskRepository taskRepository;
    private final StaffAssignmentRepository staffAssignmentRepository;
    private final UserRepository userRepository;
    private final ReservationRepository reservationRepository;
    private final PaymentRepository paymentRepository;
    private final ContractRepository contractRepository;
    private final PricingEngine pricingEngine;
    private final LogService logService;

    private static final Set<Payment.Status> SUCCEEDED_ONLY = Set.of(Payment.Status.SUCCEEDED);

    /**
     * Deposit thành công (FR-5) → task CHECK_IN cho ca trực ngày nhận kho.
     * Gọi từ ReservationService.markDepositPaid — idempotent để an toàn khi
     * re-draft; không có staff active thì bỏ qua, không làm hỏng flow deposit.
     */
    @Transactional
    public Task createCheckInTask(User actor, Reservation reservation) {
        Task existing = taskRepository
                .findFirstByTypeAndRefCodeOrderByCreatedAtDesc(
                        Task.Type.CHECK_IN, reservation.getCode())
                .orElse(null);
        if (existing != null) {
            return existing;
        }

        User assignee = resolveAssignee(reservation);
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

        logService.log(actor, "TASK", saved.getTaskId(),
                "CREATED", null, "TODO",
                "Auto check-in task for " + reservation.getCode());
        return saved;
    }

    /** Ưu tiên staff trực ca tại zone của unit đúng ngày nhận kho (FR-25). */
    private User resolveAssignee(Reservation reservation) {
        Unit unit = reservation.getUnit();
        if (unit != null && unit.getZone() != null) {
            User assigned = staffAssignmentRepository
                    .findFirstByZone_ZoneIdAndWorkDate(
                            unit.getZone().getZoneId(), reservation.getStartDate())
                    .map(sa -> sa.getStaff())
                    .orElse(null);
            if (assigned != null) {
                return assigned;
            }
        }
        return userRepository.findFirstByRole_NameAndStatusOrderByUserIdAsc(
                        Role.Name.STAFF, 1)
                .orElse(null);
    }

    /**
     * FR-15: task CHECK_IN hoàn tất cùng ritual check-in. Reservation seed cũ
     * có thể không có task — no-op để check-in vẫn hợp lệ.
     */
    @Transactional
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

    /** GET /api/v1/tasks?date= — task board theo ngày (mặc định hôm nay ICT). */
    public List<TaskResponse> listTasksForDate(LocalDate workDate) {
        return taskRepository.findByWorkDateOrderByCreatedAtAsc(workDate).stream()
                .map(this::toResponse)
                .toList();
    }

    private TaskResponse toResponse(Task task) {
        String unitCode = null;
        String customerName = null;
        String customerPhone = null;
        TaskResponse.CheckInRitualResponse ritual = null;

        // Ritual flags chỉ có nghĩa với task CHECK_IN — CL-/SR- trả phần chung.
        if (task.getType() == Task.Type.CHECK_IN && task.getRefCode() != null) {
            Reservation reservation = reservationRepository.findByCode(task.getRefCode())
                    .orElse(null);
            if (reservation != null) {
                Unit unit = reservation.getUnit();
                User customer = reservation.getCustomer();
                unitCode = unit != null ? unit.getCode() : null;
                customerName = customer != null ? customer.getFullName() : null;
                customerPhone = customer != null ? customer.getPhone() : null;
                ritual = deriveCheckInRitual(reservation);
            }
        }

        return new TaskResponse(
                task.getTaskId(),
                task.getType().name(),
                task.getRefCode(),
                unitCode,
                customerName,
                customerPhone,
                task.getWorkDate(),
                task.getStatus().name(),
                ritual
        );
    }

    /** AD-4: 4 bước ritual suy diễn từ dữ liệu gốc tại lúc đọc. */
    private TaskResponse.CheckInRitualResponse deriveCheckInRitual(Reservation reservation) {
        Reservation.Status status = reservation.getStatus();

        boolean depositVerified = status == Reservation.Status.RESERVED
                || status == Reservation.Status.CHECKED_IN
                || status == Reservation.Status.CHECKOUT_REQUESTED;

        boolean rentCollected = paymentRepository
                .existsByReservation_ReservationIdAndPurposeAndStatusIn(
                        reservation.getReservationId(),
                        Payment.Purpose.RENT,
                        SUCCEEDED_ONLY
                );

        Long depositPaid = reservation.getDepositAmount() != null
                ? reservation.getDepositAmount().longValue()
                : null;

        Long rentAmountDue = null;
        Unit unit = reservation.getUnit();
        if (unit != null && unit.getType() != null) {
            int months = durationMonthsOf(reservation);
            QuoteResponse quote = pricingEngine.calculateQuote(
                    unit, reservation.getStartDate(), months);
            rentAmountDue = quote.totalRent();
        }

        Contract latest = contractRepository
                .findByReservation_ReservationIdAndIsLatestTrue(
                        reservation.getReservationId())
                .orElse(null);
        boolean contractSigned = latest != null
                && (latest.getStatus() == Contract.Status.SIGNED
                    || latest.getStatus() == Contract.Status.ACTIVE);
        String contractPhotoUrl = latest != null ? latest.getSignedPhotoUrl() : null;

        boolean accessCodeHanded = status == Reservation.Status.CHECKED_IN
                || status == Reservation.Status.CHECKOUT_REQUESTED
                || status == Reservation.Status.CLOSED;

        return new TaskResponse.CheckInRitualResponse(
                depositVerified,
                rentCollected,
                rentAmountDue,
                depositPaid,
                contractSigned,
                contractPhotoUrl,
                accessCodeHanded
        );
    }

    /** Cùng công thức duration với Rental Detail (ReservationService). */
    private int durationMonthsOf(Reservation reservation) {
        int months = (int) ChronoUnit.MONTHS.between(
                reservation.getStartDate().withDayOfMonth(1),
                reservation.getEndDate().plusDays(1).withDayOfMonth(1)
        );
        return Math.max(months, 1);
    }
}
