package com.storagehub.service;

import com.storagehub.dto.contract.ContractChainItemResponse;
import com.storagehub.dto.contract.ContractDetailResponse;
import com.storagehub.dto.quote.QuoteResponse;
import com.storagehub.entity.Contract;
import com.storagehub.entity.Facility;
import com.storagehub.entity.RentalPolicy;
import com.storagehub.entity.Reservation;
import com.storagehub.entity.Role;
import com.storagehub.entity.Unit;
import com.storagehub.entity.UnitType;
import com.storagehub.entity.User;
import com.storagehub.entity.Zone;
import com.storagehub.exception.ContractNotFoundException;
import com.storagehub.exception.ReservationNotFoundException;
import com.storagehub.repository.ContractAddendumRepository;
import com.storagehub.repository.ContractRepository;
import com.storagehub.repository.RentalPolicyRepository;
import com.storagehub.repository.ReservationRepository;
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
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ContractServiceTest {

    @Mock
    private ContractRepository contractRepository;

    @Mock
    private ReservationRepository reservationRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private RentalPolicyRepository rentalPolicyRepository;

    @Mock
    private PricingEngine pricingEngine;

    @Mock
    private ContractAddendumRepository contractAddendumRepository;

    @InjectMocks
    private ContractService contractService;

    private User customerUser;
    private Role customerRole;
    private User staffUser;
    private Role staffRole;

    private Unit unit;
    private UnitType unitType;
    private Zone zone;
    private Facility facility;

    private Reservation reservation;
    private RentalPolicy activePolicy;
    private QuoteResponse quoteResponse;

    @BeforeEach
    void setUp() {
        customerRole = new Role();
        customerRole.setName(Role.Name.CUSTOMER);

        customerUser = new User();
        customerUser.setUserId(10L);
        customerUser.setEmail("lan@demo.vn");
        customerUser.setFullName("Nguyễn Thị Lan");
        customerUser.setPhone("0901234567");
        customerUser.setRole(customerRole);

        staffRole = new Role();
        staffRole.setName(Role.Name.STAFF);

        staffUser = new User();
        staffUser.setUserId(2L);
        staffUser.setEmail("staff@demo.vn");
        staffUser.setFullName("Trần Văn Staff");
        staffUser.setRole(staffRole);

        facility = new Facility();
        facility.setFacilityId(1);
        facility.setName("Tân Bình Depot");

        zone = new Zone();
        zone.setZoneId(1);
        zone.setCode("A");
        zone.setFacility(facility);

        unitType = new UnitType();
        unitType.setTypeId(1);
        unitType.setName("Indoor");

        unit = new Unit();
        unit.setUnitId(3L);
        unit.setCode("S-3");
        unit.setFloor(1);
        unit.setSizeM2(BigDecimal.valueOf(5.0));
        unit.setType(unitType);
        unit.setZone(zone);
        unit.setAccessType("PIN 24/7");

        reservation = new Reservation();
        reservation.setReservationId(1042L);
        reservation.setCode("BK-1042");
        reservation.setCustomer(customerUser);
        reservation.setUnit(unit);
        reservation.setStartDate(LocalDate.of(2026, 10, 3));
        reservation.setEndDate(LocalDate.of(2027, 1, 2));
        reservation.setStatus(Reservation.Status.RESERVED);

        activePolicy = new RentalPolicy();
        activePolicy.setPolicyId(3);
        activePolicy.setVersion("v3");
        activePolicy.setStatus(1);

        quoteResponse = new QuoteResponse(
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
    }

    @Test
    @DisplayName("autoDraftContract sinh hợp đồng DRAFT, isLatest=true, snapshot nội dung đầy đủ khi lần đầu sinh")
    void testAutoDraftContract_FirstContract_Success() {
        when(rentalPolicyRepository.findByStatus(1)).thenReturn(Optional.of(activePolicy));
        when(pricingEngine.calculateQuote(eq(unit), eq(reservation.getStartDate()), eq(3)))
                .thenReturn(quoteResponse);
        when(contractRepository.findByReservation_ReservationIdAndIsLatestTrue(1042L))
                .thenReturn(Optional.empty());
        when(contractRepository.count()).thenReturn(0L);
        when(contractRepository.existsByCode(any())).thenReturn(false);

        when(contractRepository.save(any(Contract.class))).thenAnswer(invocation -> {
            Contract c = invocation.getArgument(0);
            c.setContractId(101L);
            c.setCreatedAt(LocalDateTime.of(2026, 9, 27, 10, 0));
            return c;
        });

        Contract result = contractService.autoDraftContract(reservation);

        assertThat(result).isNotNull();
        assertThat(result.getContractId()).isEqualTo(101L);
        assertThat(result.getCode()).startsWith("CT-2026-");
        assertThat(result.getStatus()).isEqualTo(Contract.Status.DRAFT);
        assertThat(result.getIsLatest()).isTrue();
        assertThat(result.getSupersedes()).isNull();
        assertThat(result.getPolicy()).isEqualTo(activePolicy);
        assertThat(result.getReservation()).isEqualTo(reservation);

        // Kiểm tra snapshot hợp đồng
        assertThat(result.getContentSnapshot()).isNotNull();
        assertThat(result.getContentSnapshot()).contains("HỢP ĐỒNG THUÊ KHO LƯU TRỮ TỰ QUẢN (STORAGEHUB)");
        assertThat(result.getContentSnapshot()).contains("BK-1042");
        assertThat(result.getContentSnapshot()).contains("Nguyễn Thị Lan");
        assertThat(result.getContentSnapshot()).contains("0901234567");
        assertThat(result.getContentSnapshot()).contains("Tân Bình Depot");
        assertThat(result.getContentSnapshot()).contains("S-3");
        assertThat(result.getContentSnapshot()).contains("1.035.000 ₫");
        assertThat(result.getContentSnapshot()).contains("103.500 ₫");
        assertThat(result.getContentSnapshot()).contains("read-only");
    }

    @Test
    @DisplayName("autoDraftContract chuyển bản hợp đồng cũ thành SUPERSEDED và isLatest=false khi re-draft")
    void testAutoDraftContract_ReDraft_MarksPreviousContractSuperseded() {
        Contract previousContract = new Contract();
        previousContract.setContractId(101L);
        previousContract.setCode("CT-2026-0001");
        previousContract.setReservation(reservation);
        previousContract.setPolicy(activePolicy);
        previousContract.setStatus(Contract.Status.DRAFT);
        previousContract.setIsLatest(true);

        when(rentalPolicyRepository.findByStatus(1)).thenReturn(Optional.of(activePolicy));
        when(pricingEngine.calculateQuote(eq(unit), eq(reservation.getStartDate()), eq(3)))
                .thenReturn(quoteResponse);
        when(contractRepository.findByReservation_ReservationIdAndIsLatestTrue(1042L))
                .thenReturn(Optional.of(previousContract));
        when(contractRepository.count()).thenReturn(1L);
        when(contractRepository.existsByCode(any())).thenReturn(false);

        when(contractRepository.save(any(Contract.class))).thenAnswer(invocation -> {
            Contract c = invocation.getArgument(0);
            if (c.getContractId() == null) {
                c.setContractId(102L);
                c.setCreatedAt(LocalDateTime.of(2026, 9, 27, 11, 0));
            }
            return c;
        });

        Contract newContract = contractService.autoDraftContract(reservation);

        // Bản cũ bị SUPERSEDED và isLatest = false
        assertThat(previousContract.getStatus()).isEqualTo(Contract.Status.SUPERSEDED);
        assertThat(previousContract.getIsLatest()).isFalse();
        verify(contractRepository).save(previousContract);

        // Bản mới có supersedes trỏ về bản cũ
        assertThat(newContract.getContractId()).isEqualTo(102L);
        assertThat(newContract.getStatus()).isEqualTo(Contract.Status.DRAFT);
        assertThat(newContract.getIsLatest()).isTrue();
        assertThat(newContract.getSupersedes()).isEqualTo(previousContract);
    }

    @Test
    @DisplayName("reDraftContract thành công cho chủ sở hữu reservation")
    void testReDraftContract_CustomerOwner_Success() {
        when(userRepository.findByEmailIgnoreCase("lan@demo.vn")).thenReturn(Optional.of(customerUser));
        when(reservationRepository.findWithDetailsById(1042L)).thenReturn(Optional.of(reservation));
        when(rentalPolicyRepository.findByStatus(1)).thenReturn(Optional.of(activePolicy));
        when(pricingEngine.calculateQuote(any(), any(), anyInt())).thenReturn(quoteResponse);
        when(contractRepository.findByReservation_ReservationIdAndIsLatestTrue(1042L)).thenReturn(Optional.empty());
        when(contractRepository.count()).thenReturn(0L);
        when(contractRepository.existsByCode(any())).thenReturn(false);

        when(contractRepository.save(any(Contract.class))).thenAnswer(invocation -> {
            Contract c = invocation.getArgument(0);
            c.setContractId(103L);
            c.setCreatedAt(LocalDateTime.now());
            return c;
        });

        ContractDetailResponse response = contractService.reDraftContract("lan@demo.vn", 1042L);

        assertThat(response).isNotNull();
        assertThat(response.id()).isEqualTo(103L);
        assertThat(response.status()).isEqualTo("DRAFT");
        assertThat(response.isLatest()).isTrue();
        assertThat(response.reservationId()).isEqualTo(1042L);
    }

    @Test
    @DisplayName("reDraftContract ném ReservationNotFoundException khi khách hàng khác cố re-draft")
    void testReDraftContract_UnauthorizedOtherCustomer_ThrowsReservationNotFound() {
        User otherCustomer = new User();
        otherCustomer.setUserId(99L);
        otherCustomer.setEmail("hacker@demo.vn");
        otherCustomer.setRole(customerRole);

        when(userRepository.findByEmailIgnoreCase("hacker@demo.vn")).thenReturn(Optional.of(otherCustomer));
        when(reservationRepository.findWithDetailsById(1042L)).thenReturn(Optional.of(reservation));

        assertThatThrownBy(() -> contractService.reDraftContract("hacker@demo.vn", 1042L))
                .isInstanceOf(ReservationNotFoundException.class);
    }

    @Test
    @DisplayName("listContractsByReservation trả về chuỗi hợp đồng theo thứ tự createdAt")
    void testListContractsByReservation_Success() {
        Contract c1 = new Contract();
        c1.setContractId(101L);
        c1.setCode("CT-2026-0001");
        c1.setStatus(Contract.Status.SUPERSEDED);
        c1.setIsLatest(false);

        Contract c2 = new Contract();
        c2.setContractId(102L);
        c2.setCode("CT-2026-0002");
        c2.setStatus(Contract.Status.DRAFT);
        c2.setIsLatest(true);

        when(userRepository.findByEmailIgnoreCase("lan@demo.vn")).thenReturn(Optional.of(customerUser));
        when(reservationRepository.findWithDetailsById(1042L)).thenReturn(Optional.of(reservation));
        when(contractRepository.findByReservation_ReservationIdOrderByCreatedAtAsc(1042L))
                .thenReturn(List.of(c1, c2));
        when(contractAddendumRepository.findByContract_Reservation_ReservationIdOrderByCreatedAtAsc(1042L))
                .thenReturn(List.of());

        List<ContractChainItemResponse> chain = contractService.listContractsByReservation("lan@demo.vn", 1042L);

        assertThat(chain).hasSize(2);
        assertThat(chain.get(0).id()).isEqualTo(101L);
        assertThat(chain.get(0).status()).isEqualTo("SUPERSEDED");
        assertThat(chain.get(0).isLatest()).isFalse();

        assertThat(chain.get(1).id()).isEqualTo(102L);
        assertThat(chain.get(1).status()).isEqualTo("DRAFT");
        assertThat(chain.get(1).isLatest()).isTrue();
    }

    @Test
    @DisplayName("getContract trả về chi tiết hợp đồng gồm cả contentSnapshot")
    void testGetContract_Success() {
        Contract contract = new Contract();
        contract.setContractId(101L);
        contract.setCode("CT-2026-0001");
        contract.setStatus(Contract.Status.DRAFT);
        contract.setIsLatest(true);
        contract.setReservation(reservation);
        contract.setPolicy(activePolicy);
        contract.setContentSnapshot("Nội dung hợp đồng...");
        contract.setCreatedAt(LocalDateTime.of(2026, 9, 27, 10, 0));

        when(userRepository.findByEmailIgnoreCase("lan@demo.vn")).thenReturn(Optional.of(customerUser));
        when(contractRepository.findWithDetailsById(101L)).thenReturn(Optional.of(contract));

        ContractDetailResponse detail = contractService.getContract("lan@demo.vn", 101L);

        assertThat(detail).isNotNull();
        assertThat(detail.id()).isEqualTo(101L);
        assertThat(detail.code()).isEqualTo("CT-2026-0001");
        assertThat(detail.status()).isEqualTo("DRAFT");
        assertThat(detail.isLatest()).isTrue();
        assertThat(detail.reservationId()).isEqualTo(1042L);
        assertThat(detail.policyVersion()).isEqualTo("v3");
        assertThat(detail.contentSnapshot()).isEqualTo("Nội dung hợp đồng...");
    }

    @Test
    @DisplayName("getContract ném ContractNotFoundException khi hợp đồng không tồn tại")
    void testGetContract_NotFound_ThrowsContractNotFoundException() {
        when(userRepository.findByEmailIgnoreCase("lan@demo.vn")).thenReturn(Optional.of(customerUser));
        when(contractRepository.findWithDetailsById(999L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> contractService.getContract("lan@demo.vn", 999L))
                .isInstanceOf(ContractNotFoundException.class)
                .hasMessageContaining("Không tìm thấy hợp đồng này.");
    }

    @Test
    @DisplayName("getContract ném ContractNotFoundException khi khách hàng khác cố đọc trộm hợp đồng")
    void testGetContract_UnauthorizedCustomer_ThrowsContractNotFoundException() {
        User otherCustomer = new User();
        otherCustomer.setUserId(99L);
        otherCustomer.setEmail("other@demo.vn");
        otherCustomer.setRole(customerRole);

        Contract contract = new Contract();
        contract.setContractId(101L);
        contract.setReservation(reservation); // reservation thuộc customerUser (id=10)

        when(userRepository.findByEmailIgnoreCase("other@demo.vn")).thenReturn(Optional.of(otherCustomer));
        when(contractRepository.findWithDetailsById(101L)).thenReturn(Optional.of(contract));

        assertThatThrownBy(() -> contractService.getContract("other@demo.vn", 101L))
                .isInstanceOf(ContractNotFoundException.class);
    }
}
