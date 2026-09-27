package com.storagehub.service;

import com.storagehub.dto.contract.ContractChainItemResponse;
import com.storagehub.dto.payment.PaymentRecordResponse;
import com.storagehub.dto.quote.QuoteResponse;
import com.storagehub.dto.reservation.CheckInPassResponse;
import com.storagehub.dto.reservation.CreateReservationRequest;
import com.storagehub.dto.reservation.ReservationDetailResponse;
import com.storagehub.dto.reservation.ReservationPageResponse;
import com.storagehub.dto.reservation.ReservationSummaryResponse;
import com.storagehub.dto.reservation.ReservationUnitSummaryResponse;
import com.storagehub.dto.unit.UnitAvailabilityResponse;
import com.storagehub.dto.unit.UnitSummaryResponse;
import com.storagehub.entity.Contract;
import com.storagehub.entity.PolicyRule;
import com.storagehub.entity.RentalPolicy;
import com.storagehub.entity.Reservation;
import com.storagehub.entity.Role;
import com.storagehub.entity.Unit;
import com.storagehub.entity.User;
import com.storagehub.exception.BookingUnitTakenException;
import com.storagehub.exception.InvalidCredentialsException;
import com.storagehub.exception.ReservationInvalidStateException;
import com.storagehub.exception.ReservationNotFoundException;
import com.storagehub.exception.UnitNotFoundException;
import com.storagehub.repository.ActivityLogRepository;
import com.storagehub.repository.ContractAddendumRepository;
import com.storagehub.repository.ContractRepository;
import com.storagehub.repository.PaymentRepository;
import com.storagehub.repository.PolicyRuleRepository;
import com.storagehub.repository.RentalPolicyRepository;
import com.storagehub.repository.ReservationRepository;
import com.storagehub.repository.UnitRepository;
import com.storagehub.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.TransactionDefinition;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionTemplate;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ReservationService {

    private final ReservationRepository reservationRepository;
    private final UserRepository userRepository;
    private final PolicyRuleRepository policyRuleRepository;
    private final RentalPolicyRepository rentalPolicyRepository;
    private final UnitRepository unitRepository;
    private final PricingEngine pricingEngine;
    private final PaymentRepository paymentRepository;
    private final ContractRepository contractRepository;
    private final ContractService contractService;
    private final UnitService unitService;
    private final NotificationService notificationService;
    private final LogService logService;
    private final ActivityLogRepository activityLogRepository;
    private final PlatformTransactionManager transactionManager;
    private final ContractAddendumRepository contractAddendumRepository;

    private static final ZoneId ICT_ZONE = ZoneId.of("Asia/Ho_Chi_Minh");

    @Transactional(readOnly = true)
    public ReservationPageResponse listMyReservations(
            String email,
            String group,
            int page,
            int pageSize
    ) {
        User user = userRepository.findByEmailIgnoreCase(email)
                .orElseThrow(InvalidCredentialsException::new);

        int pageIndex = Math.max(0, page - 1);
        int size = Math.max(1, Math.min(pageSize, 100));
        Pageable pageable = PageRequest.of(pageIndex, size, Sort.by(Sort.Direction.DESC, "createdAt"));

        LocalDate today = LocalDate.now(ICT_ZONE);
        Page<Reservation> reservationPage;

        if (group != null && group.equalsIgnoreCase("history")) {
            reservationPage = reservationRepository.findHistoryReservations(user.getUserId(), today, pageable);
        } else {
            reservationPage = reservationRepository.findActiveReservations(user.getUserId(), today, pageable);
        }

        List<ReservationSummaryResponse> items = reservationPage.getContent().stream()
                .map(r -> {
                    Reservation.Status effectiveStatus = resolveEffectiveStatus(r, today);
                    String depositStatus = resolveDepositStatus(effectiveStatus);

                    Unit unit = r.getUnit();
                    ReservationUnitSummaryResponse unitSummary = new ReservationUnitSummaryResponse(
                            unit.getCode(),
                            unit.getSizeM2(),
                            unit.getType() != null ? unit.getType().getName() : null
                    );

                    Long depositAmount = r.getDepositAmount() != null ? r.getDepositAmount().longValue() : 0L;

                    return new ReservationSummaryResponse(
                            r.getReservationId(),
                            r.getCode(),
                            effectiveStatus,
                            unitSummary,
                            r.getStartDate(),
                            r.getEndDate(),
                            depositAmount,
                            depositStatus
                    );
                })
                .toList();

        return new ReservationPageResponse(
                items,
                page,
                size,
                reservationPage.getTotalElements()
        );
    }

    @Transactional(readOnly = true)
    public CheckInPassResponse getCheckInPass(String email, Long reservationId) {
        User user = userRepository.findByEmailIgnoreCase(email)
                .orElseThrow(InvalidCredentialsException::new);

        Reservation reservation = reservationRepository.findWithDetailsById(reservationId)
                .orElseThrow(() -> new ReservationNotFoundException("Reservation not found."));

        // Chỉ chủ đặt chỗ hoặc nhân viên quản lý mới được xem
        boolean isOwner = reservation.getCustomer().getUserId().equals(user.getUserId());
        boolean isStaffOrAdmin = user.getRole().getName() != Role.Name.CUSTOMER;

        if (!isOwner && !isStaffOrAdmin) {
            throw new ReservationNotFoundException("Reservation not found.");
        }

        LocalDate today = LocalDate.now(ICT_ZONE);
        Reservation.Status effectiveStatus = resolveEffectiveStatus(reservation, today);

        // Guard: Check-in pass chỉ mở khi đặt chỗ đã xác nhận cọc và chưa check-in
        if (effectiveStatus != Reservation.Status.RESERVED) {
            throw new ReservationInvalidStateException("Check-in pass is only available for confirmed reservations.");
        }

        Unit unit = reservation.getUnit();
        Long baseMonthlyRent = policyRuleRepository.findActivePolicyRule(
                unit.getType(),
                PolicyRule.RuleType.RENT_RATE
        ).map(pr -> pr.getValue().longValue()).orElse(null);

        UnitAvailabilityResponse availability = new UnitAvailabilityResponse(
                "AVAILABLE",
                reservation.getStartDate()
        );

        String facilityName = (unit.getZone() != null && unit.getZone().getFacility() != null)
                ? unit.getZone().getFacility().getName()
                : null;

        String zoneCode = (unit.getZone() != null) ? unit.getZone().getCode() : null;

        UnitSummaryResponse unitSummary = new UnitSummaryResponse(
                unit.getUnitId(),
                unit.getCode(),
                unit.getType() != null ? unit.getType().getName() : null,
                unit.getSizeM2(),
                unit.getFloor(),
                zoneCode,
                facilityName,
                unit.getAccessType(),
                baseMonthlyRent,
                availability,
                "/units/" + unit.getCode() + ".jpg"
        );

        List<String> instructions = List.of(
                "Show this code at the Tân Bình depot desk upon arrival.",
                "Bring your valid national ID card (CCCD) or Passport to sign the contract.",
                "Pay the remaining rent balance at the front operational desk prior to access activation."
        );

        return new CheckInPassResponse(
                reservation.getCode(),
                unitSummary,
                reservation.getStartDate(),
                reservation.getStartDate(),
                instructions
        );
    }

    /**
     * AD-4: Suy diễn EXPIRED on-read nếu đã qua ngày bắt đầu nhận kho mà chưa check-in.
     */
    public Reservation.Status resolveEffectiveStatus(Reservation reservation, LocalDate today) {
        if (reservation.getStatus() == Reservation.Status.RESERVED) {
            if (today.isAfter(reservation.getStartDate())) {
                return Reservation.Status.EXPIRED;
            }
        }
        return reservation.getStatus();
    }

    /**
     * Suy diễn trạng thái tiền cọc (DepositStatus) từ trạng thái đặt chỗ.
     */
    public String resolveDepositStatus(Reservation.Status effectiveStatus) {
        return switch (effectiveStatus) {
            case RESERVED, CHECKED_IN, CHECKOUT_REQUESTED -> "HELD";
            case CLOSED -> "SETTLED";
            case EXPIRED -> "FORFEITED";
            case PENDING_PAYMENT, CANCELLED -> null;
        };
    }

    /**
     * Reserve — re-check availability chống stale (FR-5).
     * Tạo reservation ở trạng thái PENDING_PAYMENT kèm quote snapshot.
     */
    @Transactional
    public ReservationDetailResponse createReservation(String email, CreateReservationRequest request) {
        User user = userRepository.findByEmailIgnoreCase(email)
                .orElseThrow(InvalidCredentialsException::new);

        Long unitId = request.unitId();
        LocalDate startDate = request.startDate();
        Integer durationMonths = request.durationMonths();

        // 1. Kiểm tra tồn tại của unit
        Unit unit = unitRepository.findWithDetailsById(unitId)
                .orElseThrow(() -> new UnitNotFoundException("Unit này không tồn tại."));

        // Lấy policy active để đọc turnover buffer
        RentalPolicy activePolicy = rentalPolicyRepository.findByStatus(1)
                .orElseThrow(() -> new IllegalStateException("Hệ thống chưa có chính sách giá hiệu lực"));
        List<PolicyRule> rules = policyRuleRepository.findByPolicy_PolicyId(activePolicy.getPolicyId());

        int bufferDays = 1;
        for (PolicyRule r : rules) {
            if (r.getType().getTypeId().equals(unit.getType().getTypeId())
                    && r.getRuleType() == PolicyRule.RuleType.TURNOVER_BUFFER) {
                bufferDays = r.getValue().intValue();
                break;
            }
        }

        LocalDate today = LocalDate.now(ICT_ZONE);

        // 2. Re-check availability của unit
        boolean isTaken = false;

        // A. Trạng thái vật lý trong DB phải là AVAILABLE hoặc PREPARING
        if (unit.getStatus() != Unit.Status.AVAILABLE && unit.getStatus() != Unit.Status.PREPARING) {
            isTaken = true;
        }

        // B. Nếu PREPARING: kiểm tra ngày readyDate
        if (!isTaken && unit.getStatus() == Unit.Status.PREPARING) {
            List<Reservation> closedList = reservationRepository.findLatestClosedReservations(unit.getUnitId());
            LocalDate readyDate = !closedList.isEmpty()
                    ? closedList.get(0).getEndDate().plusDays(bufferDays)
                    : today.plusDays(bufferDays);
            if (startDate.isBefore(readyDate)) {
                isTaken = true;
            }
        }

        // C. Kiểm tra Anti-Overlap với các reservations đã xác nhận / đang thuê (RESERVED, CHECKED_IN, CHECKOUT_REQUESTED)
        LocalDate endDate = startDate.plusMonths(durationMonths).minusDays(1);
        if (!isTaken) {
            List<Reservation> activeReservations = reservationRepository.findActiveReservationsForUnit(
                    unit.getUnitId(),
                    List.of(Reservation.Status.RESERVED, Reservation.Status.CHECKED_IN, Reservation.Status.CHECKOUT_REQUESTED)
            );

            LocalDate reqOccupiedEnd = endDate.plusDays(bufferDays);
            for (Reservation res : activeReservations) {
                LocalDate resOccupiedEnd = res.getEndDate().plusDays(bufferDays);
                if (!startDate.isAfter(resOccupiedEnd) && !res.getStartDate().isAfter(reqOccupiedEnd)) {
                    isTaken = true;
                    break;
                }
            }
        }

        // 3. Nếu bị chiếm giữa chừng: đếm unit tương tự và ném 409
        if (isTaken) {
            int similarCount = countSimilarAvailableUnits(unit, startDate, durationMonths, bufferDays, today);
            String message = similarCount > 0
                    ? String.format("%s vừa được đặt. %d unit tương tự còn trống.", unit.getCode(), similarCount)
                    : String.format("%s vừa được đặt. Không còn unit tương tự trống trong thời gian này.", unit.getCode());
            throw new BookingUnitTakenException(message);
        }

        // 4. Tính toán bảng giá minh bạch snapshot theo AD-11
        QuoteResponse quote = pricingEngine.calculateQuote(unit, startDate, durationMonths);

        // 5. Sinh mã đặt chỗ duy nhất BK-YYYY-NNNN
        String code = generateReservationCode();

        // 6. Lưu Reservation vào DB ở trạng thái PENDING_PAYMENT
        Reservation reservation = new Reservation();
        reservation.setCode(code);
        reservation.setCustomer(user);
        reservation.setUnit(unit);
        reservation.setStartDate(startDate);
        reservation.setEndDate(quote.endDate());
        reservation.setDepositAmount(BigDecimal.valueOf(quote.depositAmount()));
        reservation.setStatus(Reservation.Status.PENDING_PAYMENT);

        Reservation savedReservation = reservationRepository.save(reservation);

        // 7. Tạo DTO trả về ReservationDetailResponse
        ReservationUnitSummaryResponse unitSummary = new ReservationUnitSummaryResponse(
                unit.getCode(),
                unit.getSizeM2(),
                unit.getType() != null ? unit.getType().getName() : null
        );

        return new ReservationDetailResponse(
                savedReservation.getReservationId(),
                savedReservation.getCode(),
                savedReservation.getStatus(),
                unitSummary,
                savedReservation.getStartDate(),
                savedReservation.getEndDate(),
                savedReservation.getDepositAmount().longValue(),
                null,
                durationMonths,
                quote,
                savedReservation.getStartDate(),
                null,
                null,
                List.of(),
                List.of()
        );
    }

    /**
     * Chi tiết reservation — Rental Detail (FR-35) + kích hoạt EXPIRED on-read (FR-36, AD-4).
     */
    @Transactional
    public ReservationDetailResponse getReservationDetail(String email, Long reservationId) {
        User user = userRepository.findByEmailIgnoreCase(email)
                .orElseThrow(InvalidCredentialsException::new);

        Reservation reservation = reservationRepository.findWithDetailsById(reservationId)
                .orElseThrow(() -> new ReservationNotFoundException("Reservation not found."));

        boolean isOwner = reservation.getCustomer().getUserId().equals(user.getUserId());
        boolean isStaffOrAdmin = user.getRole().getName() != Role.Name.CUSTOMER;

        if (!isOwner && !isStaffOrAdmin) {
            throw new ReservationNotFoundException("Reservation not found.");
        }

        LocalDate today = LocalDate.now(ICT_ZONE);
        Reservation.Status effectiveStatus = resolveEffectiveStatus(reservation, today);
        String depositStatus = resolveDepositStatus(effectiveStatus);

        Unit unit = reservation.getUnit();

        // AD-4: Exactly-once on-read expiry side effect (FR-36)
        if (effectiveStatus == Reservation.Status.EXPIRED && reservation.getStatus() == Reservation.Status.RESERVED) {
            // 1. Giải phóng Unit về AVAILABLE nếu unit đang RESERVED
            if (unit.getStatus() == Unit.Status.RESERVED) {
                unit.setStatus(Unit.Status.AVAILABLE);
                unitRepository.save(unit);
            }
            // 2. Chuyển các bản Contract DRAFT/PRINTED sang CLOSED
            List<Contract> activeContracts = contractRepository.findByReservation_ReservationId(reservationId);
            for (Contract c : activeContracts) {
                if (c.getStatus() == Contract.Status.DRAFT || c.getStatus() == Contract.Status.PRINTED) {
                    c.setStatus(Contract.Status.CLOSED);
                    contractRepository.save(c);
                }
            }
        }

        int durationMonths = (int) ChronoUnit.MONTHS.between(
                reservation.getStartDate().withDayOfMonth(1),
                reservation.getEndDate().plusDays(1).withDayOfMonth(1)
        );
        if (durationMonths < 1) {
            durationMonths = 1;
        }

        QuoteResponse quote = pricingEngine.calculateQuote(unit, reservation.getStartDate(), durationMonths);

        Long baseMonthlyRent = (quote != null && quote.durationMonths() > 0)
                ? (quote.totalRent() / quote.durationMonths())
                : policyRuleRepository.findActivePolicyRule(
                        unit.getType(),
                        PolicyRule.RuleType.RENT_RATE
                ).map(r -> r.getValue().longValue()).orElse(0L);

        UnitAvailabilityResponse availability = new UnitAvailabilityResponse(
                unit.getStatus() == Unit.Status.AVAILABLE ? "AVAILABLE" : unit.getStatus().name(),
                reservation.getStartDate()
        );

        ReservationUnitSummaryResponse unitSummary = new ReservationUnitSummaryResponse(
                unit.getUnitId(),
                unit.getCode(),
                unit.getType() != null ? unit.getType().getName() : null,
                unit.getSizeM2(),
                unit.getFloor(),
                unit.getZone() != null ? unit.getZone().getCode() : null,
                (unit.getZone() != null && unit.getZone().getFacility() != null) ? unit.getZone().getFacility().getName() : null,
                unit.getAccessType(),
                baseMonthlyRent,
                availability,
                "/units/" + unit.getCode() + ".jpg"
        );

        List<PaymentRecordResponse> payments = paymentRepository.findByReservation_ReservationIdOrderByCreatedAtAsc(reservationId).stream()
                .map(PaymentRecordResponse::from) // ẩn receiptCode khi chưa SUCCEEDED (AD-9)
                .toList();

        List<ContractChainItemResponse> contracts = new java.util.ArrayList<>(
                contractRepository.findByReservation_ReservationIdOrderByCreatedAtAsc(reservationId).stream()
                        .map(c -> new ContractChainItemResponse(
                                c.getContractId(),
                                c.getCode(),
                                "ORIGINAL",
                                c.getStatus().name(),
                                Boolean.TRUE.equals(c.getIsLatest()),
                                c.getSignedPhotoUrl(),
                                null
                        ))
                        .toList()
        );

        if (contractAddendumRepository != null) {
            contractAddendumRepository.findByContract_Reservation_ReservationIdOrderByCreatedAtAsc(reservationId).forEach(a -> {
                contracts.add(new ContractChainItemResponse(
                        a.getAddendumId(),
                        a.getCode(),
                        "ADDENDUM",
                        a.getStatus() != null ? a.getStatus().name() : "AWAITING_SIGNATURE",
                        false,
                        a.getSignedPhotoUrl(),
                        a.getSignatureDueDate()
                ));
            });
        }

        String depositForfeitReason = effectiveStatus == Reservation.Status.EXPIRED ? "Deposit forfeited — no-show" : null;

        // AD-5 SensitiveValue: accessCode chỉ trả trong detail của chủ reservation, chỉ sau khi contract có ảnh ký (hoặc đã ký/active)
        boolean hasSignedContract = contracts.stream().anyMatch(c ->
                c.signedPhotoUrl() != null
                || "SIGNED".equalsIgnoreCase(c.status())
                || "ACTIVE".equalsIgnoreCase(c.status())
        );

        String accessCode = (isOwner && hasSignedContract && (effectiveStatus == Reservation.Status.CHECKED_IN || effectiveStatus == Reservation.Status.CHECKOUT_REQUESTED))
                ? reservation.getAccessCode()
                : null;

        return new ReservationDetailResponse(
                reservation.getReservationId(),
                reservation.getCode(),
                effectiveStatus,
                unitSummary,
                reservation.getStartDate(),
                reservation.getEndDate(),
                reservation.getDepositAmount() != null ? reservation.getDepositAmount().longValue() : 0L,
                depositStatus,
                durationMonths,
                quote,
                reservation.getStartDate(),
                depositForfeitReason,
                accessCode,
                payments,
                contracts
        );
    }

    private int countSimilarAvailableUnits(Unit currentUnit, LocalDate startDate, int durationMonths, int bufferDays, LocalDate today) {
        List<Unit> similarCandidates = unitRepository.findSimilarCandidateUnits(
                currentUnit.getType().getTypeId(),
                currentUnit.getUnitId(),
                List.of(Unit.Status.AVAILABLE, Unit.Status.PREPARING)
        );

        if (similarCandidates.isEmpty()) {
            return 0;
        }

        List<Long> candidateIds = similarCandidates.stream().map(Unit::getUnitId).toList();
        List<Reservation> activeReservations = reservationRepository.findActiveReservationsForUnits(
                candidateIds,
                List.of(Reservation.Status.RESERVED, Reservation.Status.CHECKED_IN, Reservation.Status.CHECKOUT_REQUESTED)
        );

        Map<Long, List<Reservation>> reservationsByUnit = activeReservations.stream()
                .collect(Collectors.groupingBy(r -> r.getUnit().getUnitId()));

        LocalDate endDate = startDate.plusMonths(durationMonths).minusDays(1);
        LocalDate reqOccupiedEnd = endDate.plusDays(bufferDays);

        int count = 0;
        for (Unit candidate : similarCandidates) {
            LocalDate readyDate = today;
            if (candidate.getStatus() == Unit.Status.PREPARING) {
                List<Reservation> closedList = reservationRepository.findLatestClosedReservations(candidate.getUnitId());
                readyDate = !closedList.isEmpty()
                        ? closedList.get(0).getEndDate().plusDays(bufferDays)
                        : today.plusDays(bufferDays);
            }

            if (startDate.isBefore(readyDate)) {
                continue;
            }

            List<Reservation> unitResList = reservationsByUnit.getOrDefault(candidate.getUnitId(), List.of());
            boolean hasOverlap = false;
            for (Reservation res : unitResList) {
                LocalDate resOccupiedEnd = res.getEndDate().plusDays(bufferDays);
                if (!startDate.isAfter(resOccupiedEnd) && !res.getStartDate().isAfter(reqOccupiedEnd)) {
                    hasOverlap = true;
                    break;
                }
            }

            if (!hasOverlap) {
                count++;
            }
        }
        return count;
    }

    /**
     * US-8 (FR-5): Deposit thành công — flip PENDING_PAYMENT → RESERVED.
     * ReservationService là owner của bảng reservations; chỉ được gọi từ
     * DepositPaymentSuccessHandler trong cùng transaction với resolve payment.
     */
    @Transactional
    public void markDepositPaid(Reservation reservation) {
        if (reservation.getStatus() != Reservation.Status.PENDING_PAYMENT) {
            throw new ReservationInvalidStateException(
                    "Đặt chỗ " + reservation.getCode()
                            + " không ở trạng thái chờ thanh toán.");
        }
        reservation.setStatus(Reservation.Status.RESERVED);
        reservationRepository.save(reservation);
    }

    /**
     * US-10 (FR-36, AD-4): no-show — hết hạn nhận kho (startDate) mà chưa check-in.
     * Cột status gốc VẪN RESERVED (EXPIRED là derived on-read); phương thức này áp
     * side-effect exactly-once tại lần đọc/đụng đầu tiên: mất toàn bộ cọc,
     * Unit mở lại, Contract Draft/Printed → Closed, ActivityLog + notification.
     * Gọi ở controller TRƯỚC method đọc readOnly — transaction đọc bắt đầu
     * sau khi side-effect commit nên thấy state mới (MySQL REPEATABLE_READ).
     */
    public void expireNoShowIfDue(String email, Long reservationId) {
        User user = userRepository.findByEmailIgnoreCase(email)
                .orElseThrow(InvalidCredentialsException::new);

        Reservation reservation = reservationRepository.findById(reservationId).orElse(null);
        if (reservation == null) {
            return; // để method đọc chính ném 404 đúng quy ước
        }

        // Chỉ chủ đặt chỗ hoặc staff/admin mới kích hoạt — người ngoài
        // không được tiết lộ tồn tại (404 do method đọc xử lý).
        boolean isOwner = reservation.getCustomer().getUserId().equals(user.getUserId());
        boolean isStaffOrAdmin = user.getRole().getName() != Role.Name.CUSTOMER;
        if (!isOwner && !isStaffOrAdmin) {
            return;
        }

        LocalDate today = LocalDate.now(ICT_ZONE);
        if (reservation.getStatus() != Reservation.Status.RESERVED
                || !today.isAfter(reservation.getStartDate())) {
            return; // không due — không đụng gì
        }

        // Exactly-once (AD-4): tx REQUIRES_NEW + lock dòng reservation +
        // marker ActivityLog — 2 request đua nhau thì bên sau thấy marker bỏ qua.
        TransactionTemplate expiryTx = new TransactionTemplate(transactionManager);
        expiryTx.setPropagationBehavior(TransactionDefinition.PROPAGATION_REQUIRES_NEW);
        expiryTx.executeWithoutResult(tx -> {
            Reservation locked = reservationRepository.findByIdForUpdate(reservationId)
                    .orElseThrow();
            if (locked.getStatus() != Reservation.Status.RESERVED) {
                return; // request khác đã áp trong tx vừa commit
            }
            if (activityLogRepository.existsByEntityTypeAndEntityIdAndAction(
                    "RESERVATION", reservationId, "RESERVATION_EXPIRED")) {
                return; // đã áp (marker) — idempotent
            }
            applyNoShowExpiry(locked);
        });
    }

    /** Side-effect FR-36 — chỉ gọi khi đã giữ lock + xác nhận chưa áp. */
    private void applyNoShowExpiry(Reservation reservation) {
        // AD-6: mỗi owner service tự ghi bảng mình trong cùng transaction này.
        User actor = reservation.getCustomer();
        contractService.closeForNoShow(actor, reservation);
        unitService.releaseHoldAfterNoShow(actor, reservation.getUnit());
        notificationService.notifyReservationExpired(reservation);

        // Marker exactly-once: sự tồn tại của dòng này = transition đã áp.
        logService.log(actor, "RESERVATION", reservation.getReservationId(),
                "RESERVATION_EXPIRED", "RESERVED", "EXPIRED",
                "Deposit forfeited — no-show");
    }

    private synchronized String generateReservationCode() {
        int year = LocalDate.now(ICT_ZONE).getYear();
        long count = reservationRepository.count() + 1;
        String code = String.format("BK-%d-%04d", year, count);
        while (reservationRepository.existsByCode(code)) {
            count++;
            code = String.format("BK-%d-%04d", year, count);
        }
        return code;
    }
}
