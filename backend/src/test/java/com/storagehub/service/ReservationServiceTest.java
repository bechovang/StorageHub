package com.storagehub.service;

import com.storagehub.dto.quote.QuoteResponse;
import com.storagehub.dto.reservation.CreateReservationRequest;
import com.storagehub.dto.reservation.ReservationDetailResponse;
import com.storagehub.entity.Facility;
import com.storagehub.entity.PolicyRule;
import com.storagehub.entity.RentalPolicy;
import com.storagehub.entity.Reservation;
import com.storagehub.entity.Role;
import com.storagehub.entity.Unit;
import com.storagehub.entity.UnitType;
import com.storagehub.entity.User;
import com.storagehub.entity.Zone;
import com.storagehub.exception.BookingUnitTakenException;
import com.storagehub.exception.ReservationNotFoundException;
import com.storagehub.exception.UnitNotFoundException;
import com.storagehub.repository.ContractRepository;
import com.storagehub.repository.PaymentRepository;
import com.storagehub.repository.PolicyRuleRepository;
import com.storagehub.repository.RentalPolicyRepository;
import com.storagehub.repository.ReservationRepository;
import com.storagehub.repository.UnitRepository;
import com.storagehub.repository.UserRepository;
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
class ReservationServiceTest {

    @Mock
    private ReservationRepository reservationRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private PolicyRuleRepository policyRuleRepository;

    @Mock
    private RentalPolicyRepository rentalPolicyRepository;

    @Mock
    private UnitRepository unitRepository;

    @Mock
    private PricingEngine pricingEngine;

    @Mock
    private PaymentRepository paymentRepository;

    @Mock
    private ContractRepository contractRepository;

    @InjectMocks
    private ReservationService reservationService;

    private User customerUser;
    private Role customerRole;
    private Unit unitS3;
    private UnitType typeS;
    private Zone zone;
    private Facility facility;
    private RentalPolicy activePolicy;

    @BeforeEach
    void setUp() {
        customerRole = new Role();
        customerRole.setName(Role.Name.CUSTOMER);

        customerUser = new User();
        customerUser.setUserId(10L);
        customerUser.setEmail("lan@demo.vn");
        customerUser.setFullName("Lan Nguyen");
        customerUser.setRole(customerRole);

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

        unitS3 = new Unit();
        unitS3.setUnitId(3L);
        unitS3.setCode("S-3");
        unitS3.setType(typeS);
        unitS3.setSizeM2(new BigDecimal("5.00"));
        unitS3.setFloor(1);
        unitS3.setZone(zone);
        unitS3.setStatus(Unit.Status.AVAILABLE);

        activePolicy = new RentalPolicy();
        activePolicy.setPolicyId(2);
        activePolicy.setVersion("v3");
        activePolicy.setStatus(1);
    }

    @Test
    @DisplayName("createReservation thành công tạo reservation PENDING_PAYMENT kèm quote snapshot")
    void testCreateReservation_Success() {
        CreateReservationRequest request = new CreateReservationRequest(
                3L,
                LocalDate.of(2026, 10, 3),
                3
        );

        when(userRepository.findByEmailIgnoreCase("lan@demo.vn")).thenReturn(Optional.of(customerUser));
        when(unitRepository.findWithDetailsById(3L)).thenReturn(Optional.of(unitS3));
        when(rentalPolicyRepository.findByStatus(1)).thenReturn(Optional.of(activePolicy));

        PolicyRule bufferRule = new PolicyRule();
        bufferRule.setType(typeS);
        bufferRule.setRuleType(PolicyRule.RuleType.TURNOVER_BUFFER);
        bufferRule.setValue(new BigDecimal("1"));

        when(policyRuleRepository.findByPolicy_PolicyId(2)).thenReturn(List.of(bufferRule));
        when(reservationRepository.findActiveReservationsForUnit(eq(3L), anyCollection())).thenReturn(List.of());

        QuoteResponse quote = new QuoteResponse(
                3L,
                LocalDate.of(2026, 10, 3),
                LocalDate.of(2027, 1, 2),
                3,
                List.of(),
                1035000L,
                103500L,
                103500L,
                "v3"
        );
        when(pricingEngine.calculateQuote(unitS3, LocalDate.of(2026, 10, 3), 3)).thenReturn(quote);
        when(reservationRepository.count()).thenReturn(0L);
        when(reservationRepository.existsByCode(any())).thenReturn(false);

        when(reservationRepository.save(any(Reservation.class))).thenAnswer(invocation -> {
            Reservation r = invocation.getArgument(0);
            r.setReservationId(1042L);
            return r;
        });

        ReservationDetailResponse response = reservationService.createReservation("lan@demo.vn", request);

        assertThat(response.id()).isEqualTo(1042L);
        assertThat(response.status()).isEqualTo(Reservation.Status.PENDING_PAYMENT);
        assertThat(response.unit().code()).isEqualTo("S-3");
        assertThat(response.depositAmount()).isEqualTo(103500L);
        assertThat(response.depositStatus()).isNull();
        assertThat(response.quote().totalRent()).isEqualTo(1035000L);
        assertThat(response.quote().dueNow()).isEqualTo(103500L);
    }

    @Test
    @DisplayName("createReservation ném UnitNotFoundException khi kho không tồn tại")
    void testCreateReservation_UnitNotFound() {
        CreateReservationRequest request = new CreateReservationRequest(
                999L,
                LocalDate.of(2026, 10, 3),
                3
        );

        when(userRepository.findByEmailIgnoreCase("lan@demo.vn")).thenReturn(Optional.of(customerUser));
        when(unitRepository.findWithDetailsById(999L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> reservationService.createReservation("lan@demo.vn", request))
                .isInstanceOf(UnitNotFoundException.class)
                .hasMessage("Unit này không tồn tại.");
    }

    @Test
    @DisplayName("createReservation ném BookingUnitTakenException khi unit đã RENTED và báo số unit tương tự còn trống")
    void testCreateReservation_UnitTaken_StatusRented() {
        unitS3.setStatus(Unit.Status.RENTED);
        CreateReservationRequest request = new CreateReservationRequest(
                3L,
                LocalDate.of(2026, 10, 3),
                3
        );

        when(userRepository.findByEmailIgnoreCase("lan@demo.vn")).thenReturn(Optional.of(customerUser));
        when(unitRepository.findWithDetailsById(3L)).thenReturn(Optional.of(unitS3));
        when(rentalPolicyRepository.findByStatus(1)).thenReturn(Optional.of(activePolicy));

        PolicyRule bufferRule = new PolicyRule();
        bufferRule.setType(typeS);
        bufferRule.setRuleType(PolicyRule.RuleType.TURNOVER_BUFFER);
        bufferRule.setValue(new BigDecimal("1"));
        when(policyRuleRepository.findByPolicy_PolicyId(2)).thenReturn(List.of(bufferRule));

        Unit similarUnit1 = new Unit();
        similarUnit1.setUnitId(4L);
        similarUnit1.setCode("S-4");
        similarUnit1.setType(typeS);
        similarUnit1.setStatus(Unit.Status.AVAILABLE);

        when(unitRepository.findSimilarCandidateUnits(eq(2), eq(3L), anyCollection()))
                .thenReturn(List.of(similarUnit1));
        when(reservationRepository.findActiveReservationsForUnits(anyCollection(), anyCollection()))
                .thenReturn(List.of());

        assertThatThrownBy(() -> reservationService.createReservation("lan@demo.vn", request))
                .isInstanceOf(BookingUnitTakenException.class)
                .hasMessage("S-3 vừa được đặt. 1 unit tương tự còn trống.");
    }

    @Test
    @DisplayName("createReservation ném BookingUnitTakenException khi có reservation khác trùng lặp")
    void testCreateReservation_UnitTaken_OverlappingReservation() {
        CreateReservationRequest request = new CreateReservationRequest(
                3L,
                LocalDate.of(2026, 10, 3),
                3
        );

        when(userRepository.findByEmailIgnoreCase("lan@demo.vn")).thenReturn(Optional.of(customerUser));
        when(unitRepository.findWithDetailsById(3L)).thenReturn(Optional.of(unitS3));
        when(rentalPolicyRepository.findByStatus(1)).thenReturn(Optional.of(activePolicy));

        PolicyRule bufferRule = new PolicyRule();
        bufferRule.setType(typeS);
        bufferRule.setRuleType(PolicyRule.RuleType.TURNOVER_BUFFER);
        bufferRule.setValue(new BigDecimal("1"));
        when(policyRuleRepository.findByPolicy_PolicyId(2)).thenReturn(List.of(bufferRule));

        Reservation activeRes = new Reservation();
        activeRes.setStartDate(LocalDate.of(2026, 10, 1));
        activeRes.setEndDate(LocalDate.of(2026, 11, 1));

        when(reservationRepository.findActiveReservationsForUnit(eq(3L), anyCollection()))
                .thenReturn(List.of(activeRes));
        when(unitRepository.findSimilarCandidateUnits(eq(2), eq(3L), anyCollection()))
                .thenReturn(List.of());

        assertThatThrownBy(() -> reservationService.createReservation("lan@demo.vn", request))
                .isInstanceOf(BookingUnitTakenException.class)
                .hasMessage("S-3 vừa được đặt. Không còn unit tương tự trống trong thời gian này.");
    }

    @Test
    @DisplayName("getReservationDetail trả về chi tiết đầy đủ khi người dùng là chủ đơn")
    void testGetReservationDetail_Success() {
        Reservation reservation = new Reservation();
        reservation.setReservationId(1042L);
        reservation.setCode("BK-1042");
        reservation.setCustomer(customerUser);
        reservation.setUnit(unitS3);
        reservation.setStartDate(LocalDate.of(2026, 10, 3));
        reservation.setEndDate(LocalDate.of(2027, 1, 2));
        reservation.setDepositAmount(new BigDecimal("103500"));
        reservation.setStatus(Reservation.Status.RESERVED);

        when(userRepository.findByEmailIgnoreCase("lan@demo.vn")).thenReturn(Optional.of(customerUser));
        when(reservationRepository.findWithDetailsById(1042L)).thenReturn(Optional.of(reservation));

        QuoteResponse quote = new QuoteResponse(
                3L,
                LocalDate.of(2026, 10, 3),
                LocalDate.of(2027, 1, 2),
                3,
                List.of(),
                1035000L,
                103500L,
                103500L,
                "v3"
        );
        when(pricingEngine.calculateQuote(eq(unitS3), eq(LocalDate.of(2026, 10, 3)), eq(3)))
                .thenReturn(quote);
        when(paymentRepository.findByReservation_ReservationId(1042L)).thenReturn(List.of());
        when(contractRepository.findByReservation_ReservationId(1042L)).thenReturn(List.of());

        ReservationDetailResponse detail = reservationService.getReservationDetail("lan@demo.vn", 1042L);

        assertThat(detail.id()).isEqualTo(1042L);
        assertThat(detail.code()).isEqualTo("BK-1042");
        assertThat(detail.status()).isEqualTo(Reservation.Status.RESERVED);
        assertThat(detail.depositAmount()).isEqualTo(103500L);
        assertThat(detail.depositStatus()).isEqualTo("HELD");
    }

    @Test
    @DisplayName("getReservationDetail ném ReservationNotFoundException khi không phải chủ đơn")
    void testGetReservationDetail_NotOwner() {
        User otherUser = new User();
        otherUser.setUserId(99L);
        otherUser.setEmail("other@demo.vn");
        otherUser.setRole(customerRole);

        Reservation reservation = new Reservation();
        reservation.setReservationId(1042L);
        reservation.setCustomer(otherUser);

        when(userRepository.findByEmailIgnoreCase("lan@demo.vn")).thenReturn(Optional.of(customerUser));
        when(reservationRepository.findWithDetailsById(1042L)).thenReturn(Optional.of(reservation));

        assertThatThrownBy(() -> reservationService.getReservationDetail("lan@demo.vn", 1042L))
                .isInstanceOf(ReservationNotFoundException.class)
                .hasMessage("Reservation not found.");
    }
}
