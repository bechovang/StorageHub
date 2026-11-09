package com.storagehub.service;

import com.storagehub.dto.task.CreateTaskRequest;
import com.storagehub.dto.task.TaskResponse;
import com.storagehub.entity.*;
import com.storagehub.exception.TaskNotFoundException;
import com.storagehub.exception.TaskSnapBackException;
import com.storagehub.repository.*;
import com.storagehub.service.impl.TaskServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.access.AccessDeniedException;

import java.math.BigDecimal;
import java.time.*;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class TaskServiceTest {

    @Mock
    private TaskRepository taskRepository;

    @Mock
    private StaffAssignmentRepository staffAssignmentRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private UnitRepository unitRepository;

    @Mock
    private ReservationRepository reservationRepository;

    @Mock
    private ContractRepository contractRepository;

    @Mock
    private ContractAddendumRepository contractAddendumRepository;

    @Mock
    private ExtensionRepository extensionRepository;

    @Mock
    private SupportTicketRepository supportTicketRepository;

    @Mock
    private PaymentRepository paymentRepository;

    @Mock
    private SettlementRepository settlementRepository;

    @Mock
    private LogService logService;

    @Mock
    private NotificationService notificationService;

    @Mock
    private PricingEngine pricingEngine;

    @Mock
    private Clock clock;

    @InjectMocks
    private TaskServiceImpl taskService;

    private User staffUser;
    private User customerUser;
    private Role staffRole;
    private Role customerRole;
    private Zone zoneA;
    private Facility facility;
    private Unit unitS3;

    private final LocalDate today = LocalDate.of(2026, 10, 13);
    private final ZoneId ictZone = ZoneId.of("Asia/Ho_Chi_Minh");

    @BeforeEach
    void setUp() {
        staffRole = new Role();
        staffRole.setRoleId(2);
        staffRole.setName(Role.Name.STAFF);

        customerRole = new Role();
        customerRole.setRoleId(1);
        customerRole.setName(Role.Name.CUSTOMER);

        facility = new Facility();
        facility.setFacilityId(1);
        facility.setName("Tân Bình Depot");

        zoneA = new Zone();
        zoneA.setZoneId(1);
        zoneA.setCode("A");
        zoneA.setFacility(facility);

        staffUser = new User();
        staffUser.setUserId(2L);
        staffUser.setEmail("minh@demo.storagehub.vn");
        staffUser.setFullName("Trần Minh");
        staffUser.setRole(staffRole);
        staffUser.setStatus(1);

        customerUser = new User();
        customerUser.setUserId(1L);
        customerUser.setEmail("lan@demo.storagehub.vn");
        customerUser.setFullName("Nguyễn Thị Lan");
        customerUser.setRole(customerRole);
        customerUser.setStatus(1);

        unitS3 = new Unit();
        unitS3.setUnitId(3L);
        unitS3.setCode("S-3");
        unitS3.setZone(zoneA);
        UnitType typeS = new UnitType();
        typeS.setTypeId(2);
        typeS.setName("S");
        unitS3.setType(typeS);

        // Fixed clock at 10:00 AM ICT (Morning shift)
        Instant fixedInstant = today.atTime(10, 0).atZone(ictZone).toInstant();
        Clock fixedClock = Clock.fixed(fixedInstant, ictZone);
        lenient().when(clock.withZone(any())).thenReturn(fixedClock);
        lenient().when(clock.instant()).thenReturn(fixedInstant);
        lenient().when(clock.getZone()).thenReturn(ictZone);
    }

    @Test
    @DisplayName("getTasks trả về danh sách task đúng 3 cột và 5 loại cho Staff")
    void testGetTasks_Success() {
        Task task1 = new Task();
        task1.setTaskId(1L);
        task1.setType(Task.Type.CHECK_IN);
        task1.setRefCode("BK-1042");
        task1.setAssignedStaff(staffUser);
        task1.setWorkDate(today);
        task1.setStatus(Task.Status.TODO);

        Task task2 = new Task();
        task2.setTaskId(2L);
        task2.setType(Task.Type.CLEANING);
        task2.setRefCode("S-1");
        task2.setAssignedStaff(staffUser);
        task2.setWorkDate(today);
        task2.setStatus(Task.Status.IN_PROGRESS);

        when(userRepository.findByEmailIgnoreCase("minh@demo.storagehub.vn")).thenReturn(Optional.of(staffUser));
        when(taskRepository.findFilteredTasks(eq(2L), eq(today), eq(null), eq(null))).thenReturn(List.of(task1, task2));

        List<TaskResponse> result = taskService.getTasks("minh@demo.storagehub.vn", null, null, null, null, null);

        assertThat(result).hasSize(2);
        assertThat(result.get(0).taskId()).isEqualTo(1L);
        assertThat(result.get(0).type()).isEqualTo(Task.Type.CHECK_IN);
        assertThat(result.get(0).status()).isEqualTo(Task.Status.TODO);
        assertThat(result.get(1).taskId()).isEqualTo(2L);
        assertThat(result.get(1).type()).isEqualTo(Task.Type.CLEANING);
        assertThat(result.get(1).status()).isEqualTo(Task.Status.IN_PROGRESS);
    }

    @Test
    @DisplayName("getTasks cột Done dùng biên ngày ICT — task hoàn tất 17:30 vẫn hiện")
    void testGetTasks_DoneAfter17hStillVisible() {
        Task doneTask = new Task();
        doneTask.setTaskId(90L);
        doneTask.setType(Task.Type.CLEANING);
        doneTask.setRefCode("S-1");
        doneTask.setAssignedStaff(staffUser);
        doneTask.setWorkDate(today);
        doneTask.setStatus(Task.Status.DONE);
        doneTask.setCompletedAt(today.atTime(17, 30));
        doneTask.setCompletedBy(staffUser);

        when(userRepository.findByEmailIgnoreCase("minh@demo.storagehub.vn"))
                .thenReturn(Optional.of(staffUser));
        when(taskRepository.findDoneTasksCompletedBetween(
                eq(2L),
                eq(null),
                eq(today.atStartOfDay()),
                eq(today.plusDays(1).atStartOfDay()),
                eq(null)
        )).thenReturn(List.of(doneTask));

        List<TaskResponse> result = taskService.getTasks(
                "minh@demo.storagehub.vn", null, null, null, null, null);

        assertThat(result).extracting(TaskResponse::taskId).containsExactly(90L);
    }

    @Test
    @DisplayName("getTasks ném AccessDeniedException khi vai trò là Customer")
    void testGetTasks_AccessDeniedForCustomer() {
        when(userRepository.findByEmailIgnoreCase("lan@demo.storagehub.vn")).thenReturn(Optional.of(customerUser));

        assertThatThrownBy(() -> taskService.getTasks("lan@demo.storagehub.vn", null, null, null, null, null))
                .isInstanceOf(AccessDeniedException.class)
                .hasMessage("Chỉ Staff hoặc Quản lý mới có quyền truy cập Task Board");
    }

    @Test
    @DisplayName("autoCreateTask tạo task pool chưa giao người (FR-21)")
    void testAutoCreateTask_AutoAssignByZoneAndShift() {
        staffUser.setFacility(facility);
        StaffAssignment assignment = new StaffAssignment();
        assignment.setAssignmentId(10L);
        assignment.setStaff(staffUser);
        assignment.setShift(StaffAssignment.Shift.MORNING);
        assignment.setWorkDate(today);
        when(staffAssignmentRepository.findByFacilityAndUnitType_TypeIdAndWorkDateAndShift(
                1, 2, today, StaffAssignment.Shift.MORNING))
                .thenReturn(List.of(assignment));
        when(unitRepository.findWithDetailsById(3L)).thenReturn(Optional.of(unitS3));
        when(taskRepository.save(any(Task.class))).thenAnswer(invocation -> {
            Task t = invocation.getArgument(0);
            t.setTaskId(99L);
            return t;
        });

        CreateTaskRequest req = new CreateTaskRequest(
                Task.Type.CHECK_IN,
                3L,
                "BK-1042",
                today,
                StaffAssignment.Shift.MORNING,
                "09:00",
                null,
                null,
                null
        );

        TaskResponse res = taskService.autoCreateTask(req);

        assertThat(res.taskId()).isEqualTo(99L);
        assertThat(res.assignedStaff().staffId()).isEqualTo(2L);
        assertThat(res.shift()).isEqualTo(StaffAssignment.Shift.MORNING);
        assertThat(res.status()).isEqualTo(Task.Status.TODO);

        verify(logService).log(eq(staffUser), eq("TASK"), eq(99L), eq("TASK_CREATED"), eq(null), eq("TODO"), any());
    }

    @Test
    @DisplayName("autoCreateTask ưu tiên staff cùng facility khi cùng loại kho có ở nhiều cơ sở")
    void testAutoCreateTask_PrefersSameFacility() {
        staffUser.setFacility(facility);

        Facility otherFacility = new Facility();
        otherFacility.setFacilityId(2);
        otherFacility.setName("Thủ Đức Depot");

        User otherStaff = new User();
        otherStaff.setUserId(9L);
        otherStaff.setEmail("other@demo.storagehub.vn");
        otherStaff.setFullName("Võ Thành Đạt");
        otherStaff.setRole(staffRole);
        otherStaff.setStatus(1);
        otherStaff.setFacility(otherFacility);

        StaffAssignment otherFacilityAssignment = new StaffAssignment();
        otherFacilityAssignment.setAssignmentId(1L);
        otherFacilityAssignment.setStaff(otherStaff);
        otherFacilityAssignment.setShift(StaffAssignment.Shift.MORNING);
        otherFacilityAssignment.setWorkDate(today);

        StaffAssignment sameFacilityAssignment = new StaffAssignment();
        sameFacilityAssignment.setAssignmentId(2L);
        sameFacilityAssignment.setStaff(staffUser);
        sameFacilityAssignment.setShift(StaffAssignment.Shift.MORNING);
        sameFacilityAssignment.setWorkDate(today);

        when(unitRepository.findWithDetailsById(3L)).thenReturn(Optional.of(unitS3));
        when(staffAssignmentRepository.findByFacilityAndUnitType_TypeIdAndWorkDateAndShift(
                1, 2, today, StaffAssignment.Shift.MORNING))
                .thenReturn(List.of(otherFacilityAssignment, sameFacilityAssignment));
        when(taskRepository.save(any(Task.class))).thenAnswer(invocation -> {
            Task t = invocation.getArgument(0);
            t.setTaskId(101L);
            return t;
        });

        TaskResponse res = taskService.autoCreateTask(new CreateTaskRequest(
                Task.Type.CHECK_IN,
                3L,
                "BK-1043",
                today,
                StaffAssignment.Shift.MORNING,
                "09:00",
                null,
                null,
                null
        ));

        assertThat(res.assignedStaff().staffId()).isEqualTo(2L);
    }

    @Test
    @DisplayName("autoCreateTask không fallback gán người khi không có staff trực")
    void testAutoCreateTask_FallbackStaff() {
        when(unitRepository.findWithDetailsById(3L)).thenReturn(Optional.of(unitS3));
        when(taskRepository.save(any(Task.class))).thenAnswer(invocation -> {
            Task t = invocation.getArgument(0);
            t.setTaskId(100L);
            return t;
        });

        CreateTaskRequest req = new CreateTaskRequest(
                Task.Type.CLEANING,
                3L,
                "S-3",
                today,
                StaffAssignment.Shift.MORNING,
                "15:00",
                null,
                "Dọn sạch sau trả",
                null
        );

        TaskResponse res = taskService.autoCreateTask(req);

        assertThat(res.taskId()).isEqualTo(100L);
        assertThat(res.assignedStaff()).isNull();
    }

    @Test
    @DisplayName("createContractTask sinh task CONTRACT idempotent cho phụ lục gia hạn")
    void testCreateContractTask_ForAddendum() {
        Contract contract = new Contract();
        contract.setContractId(10L);
        contract.setCode("CT-2026-0002");
        contract.setStatus(Contract.Status.SIGNED);

        Reservation reservation = new Reservation();
        reservation.setReservationId(2L);
        reservation.setCode("BK-2026-0002");
        reservation.setUnit(unitS3);
        reservation.setCustomer(customerUser);
        reservation.setStartDate(today);
        reservation.setEndDate(today.plusDays(7));
        reservation.setStatus(Reservation.Status.CHECKED_IN);
        contract.setReservation(reservation);

        ContractAddendum addendum = new ContractAddendum();
        addendum.setAddendumId(20L);
        addendum.setCode("CT-2026-0002-A1");
        addendum.setContract(contract);
        addendum.setStatus(ContractAddendum.Status.AWAITING_SIGNATURE);
        addendum.setSignatureDueDate(today.plusDays(7));

        when(taskRepository
                .findFirstByTypeAndRefCodeOrderByCreatedAtDesc(
                        Task.Type.CONTRACT, "CT-2026-0002-A1"))
                .thenReturn(Optional.empty());
        when(staffAssignmentRepository
                .findByFacilityAndUnitType_TypeIdAndWorkDateAndShift(
                        1, 2, today, StaffAssignment.Shift.MORNING))
                .thenReturn(List.of());
        when(pricingEngine.ruleInt(
                any(), any(), eq(PolicyRule.RuleType.EXTENSION_GRACE_DAYS), anyInt()))
                .thenReturn(3);
        when(taskRepository.save(any(Task.class))).thenAnswer(inv -> {
            Task saved = inv.getArgument(0);
            saved.setTaskId(88L);
            return saved;
        });

        Task task = taskService.createContractTask(staffUser, addendum);

        assertThat(task.getType()).isEqualTo(Task.Type.CONTRACT);
        assertThat(task.getRefCode()).isEqualTo("CT-2026-0002-A1");
        assertThat(task.getFacility()).isSameAs(facility);
        assertThat(task.getAssignedStaff()).isNull();
        assertThat(task.getStatus()).isEqualTo(Task.Status.TODO);
    }

    @Test
    @DisplayName("updateTaskStatus chuyển To do sang In progress thành công")
    void testUpdateTaskStatus_ToInProgress() {
        Task task = new Task();
        task.setTaskId(50L);
        task.setType(Task.Type.SUPPORT);
        task.setRefCode("SR-0032");
        task.setAssignedStaff(staffUser);
        task.setStatus(Task.Status.TODO);
        task.setWorkDate(today.minusDays(2));
        task.setShift(StaffAssignment.Shift.AFTERNOON);

        when(userRepository.findByEmailIgnoreCase("minh@demo.storagehub.vn")).thenReturn(Optional.of(staffUser));
        when(taskRepository.findWithStaffById(50L)).thenReturn(Optional.of(task));
        when(taskRepository.save(any(Task.class))).thenAnswer(inv -> inv.getArgument(0));

        TaskResponse res = taskService.updateTaskStatus("minh@demo.storagehub.vn", 50L, Task.Status.IN_PROGRESS);

        assertThat(res.status()).isEqualTo(Task.Status.IN_PROGRESS);
        assertThat(task.getWorkDate()).isEqualTo(today);
        assertThat(task.getShift()).isEqualTo(StaffAssignment.Shift.MORNING);
        assertThat(task.getClaimedAt()).isNotNull();
        verify(logService).log(eq(staffUser), eq("TASK"), eq(50L), eq("TASK_CLAIMED"), eq("TODO"), eq("IN_PROGRESS"), any());
    }

    @Test
    @DisplayName("getShiftFinanceSummary chỉ cộng tiền thu tại quầy và chia đúng ca")
    void testGetShiftFinanceSummary_CounterOnlyByShift() {
        Role managerRole = new Role();
        managerRole.setRoleId(3);
        managerRole.setName(Role.Name.FACILITY_MANAGER);
        User manager = new User();
        manager.setUserId(9L);
        manager.setEmail("manager@demo.storagehub.vn");
        manager.setRole(managerRole);
        manager.setFacility(facility);
        manager.setStatus(1);

        Reservation reservation = new Reservation();
        reservation.setReservationId(20L);
        reservation.setUnit(unitS3);

        Payment rentCash = new Payment();
        rentCash.setMethod(Payment.Method.CASH);
        rentCash.setPurpose(Payment.Purpose.RENT);
        rentCash.setAmount(BigDecimal.valueOf(900000));
        rentCash.setStatus(Payment.Status.SUCCEEDED);
        rentCash.setCreatedAt(today.atTime(2, 0)); // 09:00 ICT
        rentCash.setReservation(reservation);

        Payment rentOnline = new Payment();
        rentOnline.setMethod(Payment.Method.PAYOS);
        rentOnline.setPurpose(Payment.Purpose.RENT);
        rentOnline.setAmount(BigDecimal.valueOf(900000));
        rentOnline.setStatus(Payment.Status.SUCCEEDED);
        rentOnline.setCreatedAt(today.atTime(2, 0));
        rentOnline.setReservation(reservation);

        Payment extraBank = new Payment();
        extraBank.setMethod(Payment.Method.BANK);
        extraBank.setPurpose(Payment.Purpose.EXTRA_FEE);
        extraBank.setAmount(BigDecimal.valueOf(50000));
        extraBank.setStatus(Payment.Status.SUCCEEDED);
        extraBank.setCreatedAt(today.atTime(9, 0)); // 16:00 ICT
        extraBank.setReservation(reservation);

        Settlement settlement = new Settlement();
        settlement.setReservation(reservation);
        settlement.setRefundAmount(BigDecimal.valueOf(100000));
        settlement.setCreatedAt(today.atTime(9, 30)); // 16:30 ICT

        when(userRepository.findByEmailIgnoreCase("manager@demo.storagehub.vn"))
                .thenReturn(Optional.of(manager));
        when(paymentRepository.findByStatusAndCreatedAtBetween(
                eq(Payment.Status.SUCCEEDED), any(), any()))
                .thenReturn(List.of(rentCash, rentOnline, extraBank));
        when(settlementRepository.findByCreatedAtBetween(any(), any()))
                .thenReturn(List.of(settlement));

        var summary = taskService.getShiftFinanceSummary("manager@demo.storagehub.vn", today);

        assertThat(summary.totalCollected()).isEqualTo(950000L);
        assertThat(summary.totalRefunded()).isEqualTo(100000L);
        var morning = summary.shifts().stream()
                .filter(s -> s.shift() == StaffAssignment.Shift.MORNING).findFirst().orElseThrow();
        var afternoon = summary.shifts().stream()
                .filter(s -> s.shift() == StaffAssignment.Shift.AFTERNOON).findFirst().orElseThrow();
        assertThat(morning.collected()).isEqualTo(900000L);
        assertThat(morning.refunded()).isZero();
        assertThat(afternoon.collected()).isEqualTo(50000L);
        assertThat(afternoon.refunded()).isEqualTo(100000L);
    }

    @Test
    @DisplayName("updateTaskStatus chặn Done ảo (Snap-back FR-22) khi Check-in chưa thu tiền thuê")
    void testUpdateTaskStatus_SnapBack_RentNotCollected() {
        Task task = new Task();
        task.setTaskId(51L);
        task.setType(Task.Type.CHECK_IN);
        task.setRefCode("BK-1042");
        task.setAssignedStaff(staffUser);
        task.setStatus(Task.Status.IN_PROGRESS);
        task.setWorkDate(today);

        Reservation res = new Reservation();
        res.setReservationId(1042L);
        res.setCode("BK-1042");
        res.setUnit(unitS3);
        res.setCustomer(customerUser);
        res.setStatus(Reservation.Status.RESERVED);

        when(userRepository.findByEmailIgnoreCase("minh@demo.storagehub.vn")).thenReturn(Optional.of(staffUser));
        when(taskRepository.findWithStaffById(51L)).thenReturn(Optional.of(task));
        when(reservationRepository.findByCode("BK-1042")).thenReturn(Optional.of(res));
        when(paymentRepository.findByReservation_ReservationIdOrderByCreatedAtAsc(1042L)).thenReturn(List.of());

        assertThatThrownBy(() -> taskService.updateTaskStatus("minh@demo.storagehub.vn", 51L, Task.Status.DONE))
                .isInstanceOf(TaskSnapBackException.class)
                .hasMessage("Chặn Done ảo: Chưa thu 100% tiền thuê kho tại quầy!");
    }

    @Test
    @DisplayName("updateTaskStatus chặn Done ảo khi Checkout chưa tất toán")
    void testUpdateTaskStatus_SnapBack_CheckoutNotSettled() {
        Task task = new Task();
        task.setTaskId(52L);
        task.setType(Task.Type.CHECKOUT);
        task.setRefCode("BK-1043");
        task.setAssignedStaff(staffUser);
        task.setStatus(Task.Status.IN_PROGRESS);
        task.setWorkDate(today);

        Reservation res = new Reservation();
        res.setReservationId(1043L);
        res.setCode("BK-1043");
        res.setUnit(unitS3);
        res.setCustomer(customerUser);
        res.setStatus(Reservation.Status.CHECKED_IN);

        when(userRepository.findByEmailIgnoreCase("minh@demo.storagehub.vn")).thenReturn(Optional.of(staffUser));
        when(taskRepository.findWithStaffById(52L)).thenReturn(Optional.of(task));
        when(reservationRepository.findByCode("BK-1043")).thenReturn(Optional.of(res));

        assertThatThrownBy(() -> taskService.updateTaskStatus("minh@demo.storagehub.vn", 52L, Task.Status.DONE))
                .isInstanceOf(TaskSnapBackException.class)
                .hasMessage("Chặn Done ảo: Chưa hoàn tất đối soát tất toán cọc và phụ phí!");
    }

    @Test
    @DisplayName("updateTaskStatus cho phép chuyển sang Done khi đáp ứng đủ closing steps")
    void testUpdateTaskStatus_SuccessWhenClosingStepsFulfilled() {
        Task task = new Task();
        task.setTaskId(53L);
        task.setType(Task.Type.CHECK_IN);
        task.setRefCode("BK-1044");
        task.setAssignedStaff(staffUser);
        task.setStatus(Task.Status.IN_PROGRESS);
        task.setWorkDate(today);

        Reservation res = new Reservation();
        res.setReservationId(1044L);
        res.setCode("BK-1044");
        res.setUnit(unitS3);
        res.setCustomer(customerUser);
        res.setStatus(Reservation.Status.CHECKED_IN);
        res.setAccessCode("1940-Active");

        Contract contract = new Contract();
        contract.setContractId(10L);
        contract.setStatus(Contract.Status.SIGNED);

        Payment rentPayment = new Payment();
        rentPayment.setPurpose(Payment.Purpose.RENT);
        rentPayment.setStatus(Payment.Status.SUCCEEDED);

        when(userRepository.findByEmailIgnoreCase("minh@demo.storagehub.vn")).thenReturn(Optional.of(staffUser));
        when(taskRepository.findWithStaffById(53L)).thenReturn(Optional.of(task));
        when(reservationRepository.findByCode("BK-1044")).thenReturn(Optional.of(res));
        when(paymentRepository.findByReservation_ReservationIdOrderByCreatedAtAsc(1044L)).thenReturn(List.of(rentPayment));
        when(contractRepository.findByReservation_ReservationId(1044L)).thenReturn(List.of(contract));
        when(taskRepository.save(any(Task.class))).thenAnswer(inv -> inv.getArgument(0));

        TaskResponse resDto = taskService.updateTaskStatus("minh@demo.storagehub.vn", 53L, Task.Status.DONE);

        assertThat(resDto.status()).isEqualTo(Task.Status.DONE);
    }

    @Test
    @DisplayName("updateTaskStatus ném TaskNotFoundException khi taskId không tồn tại")
    void testUpdateTaskStatus_NotFound() {
        when(userRepository.findByEmailIgnoreCase("minh@demo.storagehub.vn")).thenReturn(Optional.of(staffUser));
        when(taskRepository.findWithStaffById(999L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> taskService.updateTaskStatus("minh@demo.storagehub.vn", 999L, Task.Status.DONE))
                .isInstanceOf(TaskNotFoundException.class)
                .hasMessage("Không tìm thấy nhiệm vụ #999");
    }
}
