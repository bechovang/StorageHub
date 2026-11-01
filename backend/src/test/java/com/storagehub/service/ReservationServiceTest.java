package com.storagehub.service;

import com.storagehub.dto.quote.QuoteResponse;
import com.storagehub.dto.reservation.CreateReservationRequest;
import com.storagehub.dto.reservation.ReservationDetailResponse;
import com.storagehub.entity.Contract;
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
import com.storagehub.repository.ContractAddendumRepository;
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
import java.time.ZoneId;
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

    @Mock
    private ContractAddendumRepository contractAddendumRepository;

    @Mock
    private ExtensionService extensionService;

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
    @DisplayName("getReservationDetail trả về chi tiết đầy đủ khi người dùng là chủ đơn")
    void testGetReservationDetail_Success() {
        Reservation reservation = new Reservation();
        LocalDate futureStart = LocalDate.now(ZoneId.of("Asia/Ho_Chi_Minh")).plusDays(5);
        reservation.setReservationId(1042L);
        reservation.setCode("BK-1042");
        reservation.setCustomer(customerUser);
        reservation.setUnit(unitS3);
        reservation.setStartDate(futureStart);
        reservation.setEndDate(futureStart.plusMonths(3).minusDays(1));
        reservation.setDepositAmount(new BigDecimal("103500"));
        reservation.setStatus(Reservation.Status.RESERVED);

        when(userRepository.findByEmailIgnoreCase("lan@demo.vn")).thenReturn(Optional.of(customerUser));
        when(reservationRepository.findWithDetailsById(1042L)).thenReturn(Optional.of(reservation));

        QuoteResponse quote = new QuoteResponse(
                3L,
                futureStart,
                futureStart.plusMonths(3).minusDays(1),
                3,
                List.of(),
                1035000L,
                103500L,
                103500L,
                "v3"
        );
        when(pricingEngine.calculateQuote(eq(unitS3), eq(futureStart), any()))
                .thenReturn(quote);
        when(paymentRepository.findByReservation_ReservationIdOrderByCreatedAtAsc(1042L)).thenReturn(List.of());
        when(contractRepository.findByReservation_ReservationIdOrderByCreatedAtAsc(1042L)).thenReturn(List.of());
        when(contractAddendumRepository.findByContract_Reservation_ReservationIdOrderByCreatedAtAsc(1042L)).thenReturn(List.of());

        ReservationDetailResponse detail = reservationService.getReservationDetail("lan@demo.vn", 1042L);

        assertThat(detail.id()).isEqualTo(1042L);
        assertThat(detail.code()).isEqualTo("BK-1042");
        assertThat(detail.status()).isEqualTo(Reservation.Status.RESERVED);
        assertThat(detail.depositAmount()).isEqualTo(103500L);
        assertThat(detail.depositStatus()).isEqualTo("HELD");
        assertThat(detail.unit().code()).isEqualTo("S-3");
        assertThat(detail.unit().sizeM2()).isEqualTo(new BigDecimal("5.00"));
        assertThat(detail.unit().facilityName()).isEqualTo("Tân Bình Depot");
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

    @Test
    @DisplayName("getReservationDetail kích hoạt side-effects khi quá hạn no-show: Unit -> AVAILABLE, Contract -> CLOSED (AD-4)")
    void testGetReservationDetail_Expired_TriggersSideEffects() {
        unitS3.setStatus(Unit.Status.RESERVED);

        Reservation reservation = new Reservation();
        reservation.setReservationId(1042L);
        reservation.setCode("BK-1042");
        reservation.setCustomer(customerUser);
        reservation.setUnit(unitS3);
        // Ngày bắt đầu đã qua trong quá khứ
        reservation.setStartDate(LocalDate.of(2026, 8, 1));
        reservation.setEndDate(LocalDate.of(2026, 11, 1));
        reservation.setDepositAmount(new BigDecimal("103500"));
        reservation.setStatus(Reservation.Status.RESERVED);

        Contract draftContract = new Contract();
        draftContract.setContractId(201L);
        draftContract.setStatus(Contract.Status.DRAFT);
        draftContract.setCode("CT-1042");

        when(userRepository.findByEmailIgnoreCase("lan@demo.vn")).thenReturn(Optional.of(customerUser));
        when(reservationRepository.findWithDetailsById(1042L)).thenReturn(Optional.of(reservation));
        when(contractRepository.findByReservation_ReservationId(1042L)).thenReturn(List.of(draftContract));

        QuoteResponse quote = new QuoteResponse(
                3L,
                LocalDate.of(2026, 8, 1),
                LocalDate.of(2026, 11, 1),
                3,
                List.of(),
                1035000L,
                103500L,
                103500L,
                "v3"
        );
        when(pricingEngine.calculateQuote(eq(unitS3), eq(LocalDate.of(2026, 8, 1)), any()))
                .thenReturn(quote);
        when(paymentRepository.findByReservation_ReservationIdOrderByCreatedAtAsc(1042L)).thenReturn(List.of());
        when(contractRepository.findByReservation_ReservationIdOrderByCreatedAtAsc(1042L)).thenReturn(List.of(draftContract));
        when(contractAddendumRepository.findByContract_Reservation_ReservationIdOrderByCreatedAtAsc(1042L)).thenReturn(List.of());

        ReservationDetailResponse detail = reservationService.getReservationDetail("lan@demo.vn", 1042L);

        // Verify DTO state phái sinh
        assertThat(detail.status()).isEqualTo(Reservation.Status.EXPIRED);
        assertThat(detail.depositStatus()).isEqualTo("FORFEITED");
        assertThat(detail.depositForfeitReason()).isEqualTo("Deposit forfeited — no-show");

        // Verify side-effects đã thực thi vào database
        assertThat(unitS3.getStatus()).isEqualTo(Unit.Status.AVAILABLE);
        org.mockito.Mockito.verify(unitRepository).save(unitS3);

        assertThat(draftContract.getStatus()).isEqualTo(Contract.Status.CLOSED);
        org.mockito.Mockito.verify(contractRepository).save(draftContract);
    }

    @Test
    @DisplayName("getReservationDetail bảo mật accessCode theo AD-5: chỉ tiết lộ khi hợp đồng đã có ảnh ký")
    void testGetReservationDetail_AccessCode_SecurityGuard() {
        unitS3.setStatus(Unit.Status.RENTED);

        Reservation reservation = new Reservation();
        reservation.setReservationId(1042L);
        reservation.setCode("BK-1042");
        reservation.setCustomer(customerUser);
        reservation.setUnit(unitS3);
        reservation.setStartDate(LocalDate.of(2026, 10, 3));
        reservation.setEndDate(LocalDate.of(2027, 1, 2));
        reservation.setStatus(Reservation.Status.CHECKED_IN);
        reservation.setAccessCode("PIN-8842");

        when(userRepository.findByEmailIgnoreCase("lan@demo.vn")).thenReturn(Optional.of(customerUser));
        when(reservationRepository.findWithDetailsById(1042L)).thenReturn(Optional.of(reservation));

        QuoteResponse quote = new QuoteResponse(
                3L,
                LocalDate.of(2026, 10, 3),
                LocalDate.of(2027, 1, 2),
                92,
                List.of(),
                1035000L,
                103500L,
                103500L,
                "v3"
        );
        when(pricingEngine.calculateQuote(eq(unitS3), eq(LocalDate.of(2026, 10, 3)), any()))
                .thenReturn(quote);
        when(paymentRepository.findByReservation_ReservationIdOrderByCreatedAtAsc(1042L)).thenReturn(List.of());

        // Trường hợp 1: Hợp đồng chưa có ảnh ký -> accessCode = null
        Contract unsignedContract = new Contract();
        unsignedContract.setContractId(201L);
        unsignedContract.setCode("CT-1042");
        unsignedContract.setStatus(Contract.Status.DRAFT);
        unsignedContract.setSignedPhotoUrl(null);

        when(contractRepository.findByReservation_ReservationIdOrderByCreatedAtAsc(1042L)).thenReturn(List.of(unsignedContract));
        when(contractAddendumRepository.findByContract_Reservation_ReservationIdOrderByCreatedAtAsc(1042L)).thenReturn(List.of());

        ReservationDetailResponse detailUnsigned = reservationService.getReservationDetail("lan@demo.vn", 1042L);
        assertThat(detailUnsigned.accessCode()).isNull();

        // Trường hợp 2: Hợp đồng đã có ảnh ký -> accessCode được tiết lộ
        Contract signedContract = new Contract();
        signedContract.setContractId(201L);
        signedContract.setCode("CT-1042");
        signedContract.setStatus(Contract.Status.SIGNED);
        signedContract.setSignedPhotoUrl("/storage/contracts/CT-1042-signed.jpg");

        when(contractRepository.findByReservation_ReservationIdOrderByCreatedAtAsc(1042L)).thenReturn(List.of(signedContract));

        ReservationDetailResponse detailSigned = reservationService.getReservationDetail("lan@demo.vn", 1042L);
        assertThat(detailSigned.accessCode()).isEqualTo("PIN-8842");
    }


}
