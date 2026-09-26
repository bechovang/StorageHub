package com.storagehub.service;

import com.storagehub.dto.reservation.CheckInPassResponse;
import com.storagehub.dto.reservation.ReservationPageResponse;
import com.storagehub.dto.reservation.ReservationSummaryResponse;
import com.storagehub.dto.reservation.ReservationUnitSummaryResponse;
import com.storagehub.dto.unit.UnitAvailabilityResponse;
import com.storagehub.dto.unit.UnitSummaryResponse;
import com.storagehub.entity.PolicyRule;
import com.storagehub.entity.Reservation;
import com.storagehub.entity.Role;
import com.storagehub.entity.Unit;
import com.storagehub.entity.User;
import com.storagehub.exception.InvalidCredentialsException;
import com.storagehub.exception.ReservationInvalidStateException;
import com.storagehub.exception.ReservationNotFoundException;
import com.storagehub.repository.PolicyRuleRepository;
import com.storagehub.repository.ReservationRepository;
import com.storagehub.repository.UserRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Service
public class ReservationService {

    private final ReservationRepository reservationRepository;
    private final UserRepository userRepository;
    private final PolicyRuleRepository policyRuleRepository;

    public ReservationService(
            ReservationRepository reservationRepository,
            UserRepository userRepository,
            PolicyRuleRepository policyRuleRepository
    ) {
        this.reservationRepository = reservationRepository;
        this.userRepository = userRepository;
        this.policyRuleRepository = policyRuleRepository;
    }

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

        LocalDate today = LocalDate.now();
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

        LocalDate today = LocalDate.now();
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
}
