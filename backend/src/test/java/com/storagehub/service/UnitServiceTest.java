package com.storagehub.service;

import com.storagehub.dto.quote.QuoteResponse;
import com.storagehub.dto.unit.UnitDetailResponse;
import com.storagehub.dto.unit.UnitFilterOptionsResponse;
import com.storagehub.dto.unit.UnitPageResponse;
import com.storagehub.dto.unit.UnitSummaryResponse;
import com.storagehub.entity.Facility;
import com.storagehub.entity.PolicyRule;
import com.storagehub.entity.RentalPolicy;
import com.storagehub.entity.Reservation;
import com.storagehub.entity.Unit;
import com.storagehub.entity.UnitType;
import com.storagehub.entity.Zone;
import com.storagehub.exception.UnitNotFoundException;
import com.storagehub.repository.PolicyRuleRepository;
import com.storagehub.repository.RentalPolicyRepository;
import com.storagehub.repository.ReservationRepository;
import com.storagehub.repository.UnitRepository;
import com.storagehub.repository.UnitTypeRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyCollection;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class UnitServiceTest {

    @Mock
    private UnitRepository unitRepository;

    @Mock
    private UnitTypeRepository unitTypeRepository;

    @Mock
    private RentalPolicyRepository rentalPolicyRepository;

    @Mock
    private PolicyRuleRepository policyRuleRepository;

    @Mock
    private ReservationRepository reservationRepository;

    @Mock
    private PricingEngine pricingEngine;

    @InjectMocks
    private UnitService unitService;

    private Facility facility;
    private Zone zone;
    private UnitType typeS;
    private UnitType typeM;
    private RentalPolicy activePolicy;

    @BeforeEach
    void setUp() {
        facility = new Facility();
        facility.setFacilityId(1);
        facility.setName("Tân Bình Depot");

        zone = new Zone();
        zone.setZoneId(1);
        zone.setCode("A");
        zone.setFacility(facility);

        typeS = new UnitType();
        typeS.setTypeId(2);
        typeS.setName("S");

        typeM = new UnitType();
        typeM.setTypeId(3);
        typeM.setName("M");

        activePolicy = new RentalPolicy();
        activePolicy.setPolicyId(2);
        activePolicy.setVersion("v3");
        activePolicy.setStatus(1);
    }

    @Test
    @DisplayName("getFilterOptions trả về danh mục loại unit và các kích thước m² có sẵn")
    void testGetFilterOptions() {
        when(unitTypeRepository.findAll()).thenReturn(List.of(typeS, typeM));
        when(unitRepository.findDistinctSizesM2()).thenReturn(List.of(new BigDecimal("5.00"), new BigDecimal("8.00")));

        UnitFilterOptionsResponse response = unitService.getFilterOptions();

        assertThat(response.getTypes()).hasSize(2);
        assertThat(response.getTypes().get(0).getName()).isEqualTo("S");
        assertThat(response.getSizesM2()).containsExactly(new BigDecimal("5.00"), new BigDecimal("8.00"));
    }

    @Test
    @DisplayName("searchUnits tính trạng thái AVAILABLE cho kho trống và không dính buffer")
    void testSearchUnits_Available() {
        Unit unit1 = createUnit(1L, "S-1", typeS, new BigDecimal("5.00"), Unit.Status.AVAILABLE);

        when(rentalPolicyRepository.findByStatus(1)).thenReturn(Optional.of(activePolicy));

        PolicyRule rentRule = new PolicyRule();
        rentRule.setType(typeS);
        rentRule.setRuleType(PolicyRule.RuleType.RENT_RATE);
        rentRule.setValue(new BigDecimal("345000"));

        PolicyRule bufferRule = new PolicyRule();
        bufferRule.setType(typeS);
        bufferRule.setRuleType(PolicyRule.RuleType.TURNOVER_BUFFER);
        bufferRule.setValue(new BigDecimal("1"));

        when(policyRuleRepository.findByPolicy_PolicyId(2)).thenReturn(List.of(rentRule, bufferRule));
        when(unitRepository.findCandidateUnits(anyCollection())).thenReturn(List.of(unit1));
        when(reservationRepository.findActiveReservationsForUnits(anyCollection(), anyCollection())).thenReturn(List.of());

        UnitPageResponse response = unitService.searchUnits(
                null,
                null,
                LocalDate.of(2026, 10, 3),
                3,
                "price-asc",
                1,
                25
        );

        assertThat(response.getTotal()).isEqualTo(1);
        UnitSummaryResponse item = response.getItems().get(0);
        assertThat(item.code()).isEqualTo("S-1");
        assertThat(item.baseMonthlyRent()).isEqualTo(345000L);
        assertThat(item.availability().status()).isEqualTo("AVAILABLE");
        assertThat(item.availability().availableFromDate()).isNull();
    }

    @Test
    @DisplayName("searchUnits tính trạng thái AVAILABLE_SOON khi kho đang PREPARING (turnover buffer)")
    void testSearchUnits_AvailableSoon_Preparing() {
        Unit unitM4 = createUnit(8L, "M-4", typeM, new BigDecimal("8.00"), Unit.Status.PREPARING);

        when(rentalPolicyRepository.findByStatus(1)).thenReturn(Optional.of(activePolicy));

        PolicyRule rentRule = new PolicyRule();
        rentRule.setType(typeM);
        rentRule.setRuleType(PolicyRule.RuleType.RENT_RATE);
        rentRule.setValue(new BigDecimal("380000"));

        PolicyRule bufferRule = new PolicyRule();
        bufferRule.setType(typeM);
        bufferRule.setRuleType(PolicyRule.RuleType.TURNOVER_BUFFER);
        bufferRule.setValue(new BigDecimal("1"));

        when(policyRuleRepository.findByPolicy_PolicyId(2)).thenReturn(List.of(rentRule, bufferRule));
        when(unitRepository.findCandidateUnits(anyCollection())).thenReturn(List.of(unitM4));
        when(reservationRepository.findActiveReservationsForUnits(anyCollection(), anyCollection())).thenReturn(List.of());

        Reservation closedReservation = new Reservation();
        closedReservation.setEndDate(LocalDate.of(2026, 10, 19));
        when(reservationRepository.findLatestClosedReservations(8L)).thenReturn(List.of(closedReservation));

        // Khách tìm ngày 2026-10-18, nhưng buffer kết thúc ngày 2026-10-20 (19 + 1)
        UnitPageResponse response = unitService.searchUnits(
                null,
                null,
                LocalDate.of(2026, 10, 18),
                1,
                "price-asc",
                1,
                25
        );

        assertThat(response.getTotal()).isEqualTo(1);
        UnitSummaryResponse item = response.getItems().get(0);
        assertThat(item.code()).isEqualTo("M-4");
        assertThat(item.availability().status()).isEqualTo("AVAILABLE_SOON");
        assertThat(item.availability().availableFromDate()).isEqualTo(LocalDate.of(2026, 10, 20));
    }

    @Test
    @DisplayName("searchUnits loại trừ kho có reservation trùng lặp (Anti-Overlap)")
    void testSearchUnits_ExcludeOverlappingReservation() {
        Unit unitS3 = createUnit(3L, "S-3", typeS, new BigDecimal("5.00"), Unit.Status.AVAILABLE);

        when(rentalPolicyRepository.findByStatus(1)).thenReturn(Optional.of(activePolicy));

        PolicyRule rentRule = new PolicyRule();
        rentRule.setType(typeS);
        rentRule.setRuleType(PolicyRule.RuleType.RENT_RATE);
        rentRule.setValue(new BigDecimal("345000"));

        PolicyRule bufferRule = new PolicyRule();
        bufferRule.setType(typeS);
        bufferRule.setRuleType(PolicyRule.RuleType.TURNOVER_BUFFER);
        bufferRule.setValue(new BigDecimal("1"));

        when(policyRuleRepository.findByPolicy_PolicyId(2)).thenReturn(List.of(rentRule, bufferRule));
        when(unitRepository.findCandidateUnits(anyCollection())).thenReturn(List.of(unitS3));

        // Đã có reservation BK-1044 từ 2026-10-19 đến 2026-12-19
        Reservation activeRes = new Reservation();
        activeRes.setUnit(unitS3);
        activeRes.setStartDate(LocalDate.of(2026, 10, 19));
        activeRes.setEndDate(LocalDate.of(2026, 12, 19));
        activeRes.setStatus(Reservation.Status.RESERVED);

        when(reservationRepository.findActiveReservationsForUnits(anyCollection(), anyCollection()))
                .thenReturn(List.of(activeRes));

        // Khách muốn thuê từ 2026-10-01 thời hạn 3 tháng (đến 2026-12-31) -> trùng lặp với BK-1044
        UnitPageResponse response = unitService.searchUnits(
                null,
                null,
                LocalDate.of(2026, 10, 1),
                3,
                "price-asc",
                1,
                25
        );

        assertThat(response.getTotal()).isEqualTo(0);
        assertThat(response.getItems()).isEmpty();
    }

    @Test
    @DisplayName("getUnitDetail trả về spec đầy đủ khi unit tồn tại")
    void testGetUnitDetail_Success() {
        Unit unit1 = createUnit(1L, "S-1", typeS, new BigDecimal("5.00"), Unit.Status.AVAILABLE);

        when(unitRepository.findWithDetailsById(1L)).thenReturn(Optional.of(unit1));
        when(rentalPolicyRepository.findByStatus(1)).thenReturn(Optional.of(activePolicy));

        PolicyRule rentRule = new PolicyRule();
        rentRule.setType(typeS);
        rentRule.setRuleType(PolicyRule.RuleType.RENT_RATE);
        rentRule.setValue(new BigDecimal("345000"));

        when(policyRuleRepository.findByPolicy_PolicyId(2)).thenReturn(List.of(rentRule));

        UnitDetailResponse detail = unitService.getUnitDetail(1L);

        assertThat(detail.id()).isEqualTo(1L);
        assertThat(detail.code()).isEqualTo("S-1");
        assertThat(detail.typeName()).isEqualTo("S");
        assertThat(detail.sizeM2()).isEqualTo(new BigDecimal("5.00"));
        assertThat(detail.baseMonthlyRent()).isEqualTo(345000L);
        assertThat(detail.dimensions()).isEqualTo("2.0 × 2.5 × 2.2 m");
        assertThat(detail.security()).isEqualTo("24/7 PIN + CCTV + Motion sensors");
        assertThat(detail.photoUrls()).hasSize(2);
        assertThat(detail.availability().status()).isEqualTo("AVAILABLE");
    }

    @Test
    @DisplayName("getUnitDetail ném UnitNotFoundException khi không tìm thấy unit")
    void testGetUnitDetail_NotFound() {
        when(unitRepository.findWithDetailsById(999L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> unitService.getUnitDetail(999L))
                .isInstanceOf(UnitNotFoundException.class)
                .hasMessage("Unit này không tồn tại.");
    }

    @Test
    @DisplayName("getUnitQuote ủy quyền cho PricingEngine tính toán bảng giá")
    void testGetUnitQuote_Success() {
        Unit unit1 = createUnit(1L, "S-1", typeS, new BigDecimal("5.00"), Unit.Status.AVAILABLE);
        LocalDate start = LocalDate.of(2026, 10, 3);
        LocalDate end = LocalDate.of(2027, 1, 2);

        QuoteResponse mockQuote = new QuoteResponse(
                1L,
                start,
                end,
                3,
                List.of(),
                1035000L,
                103500L,
                103500L,
                "v3"
        );

        when(unitRepository.findById(1L)).thenReturn(Optional.of(unit1));
        when(pricingEngine.calculateQuote(unit1, start, 3)).thenReturn(mockQuote);

        QuoteResponse result = unitService.getUnitQuote(1L, start, 3);

        assertThat(result.unitId()).isEqualTo(1L);
        assertThat(result.totalRent()).isEqualTo(1035000L);
        assertThat(result.depositAmount()).isEqualTo(103500L);
        assertThat(result.policyVersion()).isEqualTo("v3");
    }

    @Test
    @DisplayName("getUnitQuote ném UnitNotFoundException khi không tìm thấy unit")
    void testGetUnitQuote_NotFound() {
        when(unitRepository.findById(999L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> unitService.getUnitQuote(999L, LocalDate.of(2026, 10, 3), 3))
                .isInstanceOf(UnitNotFoundException.class)
                .hasMessage("Unit này không tồn tại.");
    }

    private Unit createUnit(Long id, String code, UnitType type, BigDecimal size, Unit.Status status) {
        Unit unit = new Unit();
        unit.setUnitId(id);
        unit.setCode(code);
        unit.setType(type);
        unit.setSizeM2(size);
        unit.setFloor(1);
        unit.setZone(zone);
        unit.setAccessType("PIN");
        unit.setStatus(status);
        return unit;
    }
}
