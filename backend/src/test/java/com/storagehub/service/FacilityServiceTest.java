package com.storagehub.service;

import com.storagehub.dto.facility.FacilityDrilldownResponse;
import com.storagehub.dto.facility.FacilityOverviewResponse;
import com.storagehub.entity.*;
import com.storagehub.repository.*;
import com.storagehub.service.impl.FacilityServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class FacilityServiceTest {

    @Mock
    private UnitRepository unitRepository;

    @Mock
    private UnitTypeRepository unitTypeRepository;

    @Mock
    private ReservationRepository reservationRepository;

    @Mock
    private TaskRepository taskRepository;

    @Mock
    private SupportTicketRepository supportTicketRepository;

    @Mock
    private PolicyRuleRepository policyRuleRepository;

    private FacilityServiceImpl facilityService;

    private UnitType typeSmall;
    private UnitType typeMedium;
    private Zone zoneA;
    private Facility facility;

    @BeforeEach
    void setUp() {
        facilityService = new FacilityServiceImpl(
                unitRepository,
                unitTypeRepository,
                reservationRepository,
                taskRepository,
                supportTicketRepository,
                policyRuleRepository
        );

        facility = new Facility();
        facility.setFacilityId(1);
        facility.setName("Kho Tân Bình");

        zoneA = new Zone();
        zoneA.setZoneId(1);
        zoneA.setCode("Zone A");
        zoneA.setFacility(facility);
        zoneA.setFloor(1);

        typeSmall = new UnitType();
        typeSmall.setTypeId(1);
        typeSmall.setName("Small");

        typeMedium = new UnitType();
        typeMedium.setTypeId(2);
        typeMedium.setName("Medium");
    }

    private Unit createUnit(Long id, String code, UnitType type, Unit.Status status) {
        Unit u = new Unit();
        u.setUnitId(id);
        u.setCode(code);
        u.setType(type);
        u.setZone(zoneA);
        u.setFloor(1);
        u.setSizeM2(BigDecimal.valueOf(5.0));
        u.setStatus(status);
        return u;
    }

    @Test
    @DisplayName("getFacilityOverview tính toán chuẩn xác 4 KPI, biểu đồ phân bổ, cơ cấu doanh thu và turnover queue")
    void testGetFacilityOverview_Success() {
        Unit u1 = createUnit(1L, "S-1", typeSmall, Unit.Status.RENTED);
        Unit u2 = createUnit(2L, "S-2", typeSmall, Unit.Status.RENTED);
        Unit u3 = createUnit(3L, "S-3", typeSmall, Unit.Status.AVAILABLE);
        Unit u4 = createUnit(4L, "M-1", typeMedium, Unit.Status.PREPARING);
        Unit u5 = createUnit(5L, "M-2", typeMedium, Unit.Status.MAINTENANCE);
        Unit u6 = createUnit(6L, "M-3", typeMedium, Unit.Status.RETIRED);

        when(unitRepository.findAllWithDetails()).thenReturn(List.of(u1, u2, u3, u4, u5, u6));

        // Tasks today
        User staff = new User();
        staff.setUserId(10L);
        staff.setFullName("Nguyễn Văn Nhân Viên");

        Task t1 = new Task();
        t1.setTaskId(101L);
        t1.setType(Task.Type.CHECK_IN);
        t1.setStatus(Task.Status.DONE);
        t1.setAssignedStaff(staff);
        t1.setWorkDate(LocalDate.now());

        Task t2 = new Task();
        t2.setTaskId(102L);
        t2.setType(Task.Type.CLEANING);
        t2.setStatus(Task.Status.IN_PROGRESS);
        t2.setAssignedStaff(staff);
        t2.setWorkDate(LocalDate.now());
        t2.setRefCode("M-1");

        when(taskRepository.findByWorkDateWithStaff(any())).thenReturn(List.of(t1, t2));
        when(taskRepository.findActiveTasksByTypesWithStaff(any())).thenReturn(List.of(t2));

        // Escalations
        SupportTicket ticket = new SupportTicket();
        ticket.setTicketId(201L);
        ticket.setCode("SR-0032");
        ticket.setStatus(SupportTicket.Status.OPEN);
        ticket.setIncidentType(SupportTicket.IncidentType.LOST_ACCESS);
        ticket.setUnit(u1);
        when(supportTicketRepository.findByStatusInWithDetails(any())).thenReturn(List.of(ticket));

        // Policy rules
        PolicyRule ruleSmall = new PolicyRule();
        ruleSmall.setType(typeSmall);
        ruleSmall.setRuleType(PolicyRule.RuleType.RENT_RATE);
        ruleSmall.setValue(BigDecimal.valueOf(345000));

        PolicyRule ruleMedium = new PolicyRule();
        ruleMedium.setType(typeMedium);
        ruleMedium.setRuleType(PolicyRule.RuleType.RENT_RATE);
        ruleMedium.setValue(BigDecimal.valueOf(500000));

        when(policyRuleRepository.findActiveRulesByType(PolicyRule.RuleType.RENT_RATE))
                .thenReturn(List.of(ruleSmall, ruleMedium));
        when(unitTypeRepository.findAll()).thenReturn(List.of(typeSmall, typeMedium));

        FacilityOverviewResponse response = facilityService.getFacilityOverview();

        assertThat(response).isNotNull();

        // 1. Occupancy: 2 rented out of 5 active units = 40.0%
        assertThat(response.occupancy().rentedUnits()).isEqualTo(2);
        assertThat(response.occupancy().totalUnits()).isEqualTo(5);
        assertThat(response.occupancy().rate()).isEqualTo(new BigDecimal("40.0"));

        // 2. Units in service: 4 operational out of 5 active units = 80.0%, 1 maintenance
        assertThat(response.unitsInService().operationalUnits()).isEqualTo(4);
        assertThat(response.unitsInService().maintenanceUnits()).isEqualTo(1);
        assertThat(response.unitsInService().operationalRate()).isEqualTo(new BigDecimal("80.0"));

        // 3. Tasks today: 2 total, 1 completed, 1 inProgress, 0 pending
        assertThat(response.tasksToday().totalTasks()).isEqualTo(2);
        assertThat(response.tasksToday().completed()).isEqualTo(1);
        assertThat(response.tasksToday().inProgress()).isEqualTo(1);
        assertThat(response.tasksToday().pending()).isEqualTo(0);

        // 4. Escalations: 1 open, 1 high priority (LOST_ACCESS)
        assertThat(response.escalations().openCount()).isEqualTo(1);
        assertThat(response.escalations().highPriorityCount()).isEqualTo(1);
        assertThat(response.escalations().highlight()).contains("SR-0032");

        // 5. Status distribution
        assertThat(response.statusDistribution()).isNotEmpty();

        // 6. Revenue mix: Small has 2 rented (690,000 VND), Medium has 0 rented
        assertThat(response.revenueMix()).hasSize(2);
        FacilityOverviewResponse.RevenueMixItem smallMix = response.revenueMix().stream()
                .filter(m -> "Small".equals(m.category())).findFirst().orElseThrow();
        assertThat(smallMix.rentedCount()).isEqualTo(2);
        assertThat(smallMix.monthlyRevenue()).isEqualByComparingTo(BigDecimal.valueOf(690000));

        // 7. Turnover queue: M-1 task is in queue
        assertThat(response.turnoverQueue()).isNotEmpty();
        assertThat(response.turnoverQueue().stream().anyMatch(item -> "M-1".equals(item.unitCode()))).isTrue();
    }

    @Test
    @DisplayName("getFacilityDrilldown lọc danh sách phòng theo RENTED và gắn đúng thông tin khách thuê")
    void testGetFacilityDrilldown_RentedFilter() {
        Unit u1 = createUnit(1L, "S-1", typeSmall, Unit.Status.RENTED);
        Unit u2 = createUnit(2L, "S-2", typeSmall, Unit.Status.RENTED);

        when(unitRepository.findUnitsForDrilldown(eq(Unit.Status.RENTED), any()))
                .thenReturn(List.of(u1, u2));

        User customer = new User();
        customer.setUserId(20L);
        customer.setFullName("Nguyễn Thị Lan");

        Reservation reservation = new Reservation();
        reservation.setReservationId(1001L);
        reservation.setCode("BK-1042");
        reservation.setStatus(Reservation.Status.CHECKED_IN);
        reservation.setCustomer(customer);
        reservation.setUnit(u1);

        when(reservationRepository.findCurrentActiveReservations()).thenReturn(List.of(reservation));

        PolicyRule ruleSmall = new PolicyRule();
        ruleSmall.setType(typeSmall);
        ruleSmall.setValue(BigDecimal.valueOf(345000));
        when(policyRuleRepository.findActiveRulesByType(PolicyRule.RuleType.RENT_RATE))
                .thenReturn(List.of(ruleSmall));

        FacilityDrilldownResponse response = facilityService.getFacilityDrilldown("RENTED", null, 1, 25);

        assertThat(response).isNotNull();
        assertThat(response.items()).hasSize(2);
        assertThat(response.totalItems()).isEqualTo(2);
        assertThat(response.statusFilter()).isEqualTo("RENTED");

        // First item has reservation details
        assertThat(response.items().get(0).code()).isEqualTo("S-1");
        assertThat(response.items().get(0).tenantName()).isEqualTo("Nguyễn Thị Lan");
        assertThat(response.items().get(0).rentalCode()).isEqualTo("BK-1042");
        assertThat(response.items().get(0).rentPrice()).isEqualByComparingTo(BigDecimal.valueOf(345000));

        // Second item has no active reservation
        assertThat(response.items().get(1).code()).isEqualTo("S-2");
        assertThat(response.items().get(1).tenantName()).isNull();
        assertThat(response.items().get(1).rentalCode()).isNull();
    }

    @Test
    @DisplayName("getFacilityDrilldown ném IllegalArgumentException khi truyền status không hợp lệ")
    void testGetFacilityDrilldown_InvalidStatus() {
        assertThatThrownBy(() -> facilityService.getFacilityDrilldown("INVALID_STATUS", null, 1, 25))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Trạng thái phòng không hợp lệ");
    }
}
