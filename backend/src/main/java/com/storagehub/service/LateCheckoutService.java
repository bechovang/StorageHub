package com.storagehub.service;

import com.storagehub.dto.checkout.LateCheckoutActiveRentalResponse;
import com.storagehub.dto.checkout.LateCheckoutCaseResponse;
import com.storagehub.dto.checkout.LateCheckoutInfo;
import com.storagehub.entity.CheckoutRequest;
import com.storagehub.entity.LateCheckoutCase;
import com.storagehub.entity.PolicyRule;
import com.storagehub.entity.Reservation;
import com.storagehub.entity.Role;
import com.storagehub.entity.Unit;
import com.storagehub.entity.User;
import com.storagehub.repository.CheckoutRequestRepository;
import com.storagehub.repository.LateCheckoutCaseRepository;
import com.storagehub.repository.ReservationRepository;
import com.storagehub.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.temporal.ChronoUnit;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;

/**
 * Owner của LATE_CHECKOUT_CASES (V42). Tính trễ on-read, mở case từ ngày trễ đầu tiên,
 * escalate khi daysLate > threshold, và ghi quyết định manager.
 * Không đổi Reservation.Status — lateness là derived state (AD-4).
 */
@Service
@RequiredArgsConstructor
public class LateCheckoutService {

    public static final int DEFAULT_LATE_FEE_PERCENT = 300;
    public static final int DEFAULT_ESCALATION_DAYS = 3;

    private static final ZoneId ICT_ZONE = ZoneId.of("Asia/Ho_Chi_Minh");

    private final LateCheckoutCaseRepository caseRepository;
    private final CheckoutRequestRepository checkoutRequestRepository;
    private final ReservationRepository reservationRepository;
    private final UserRepository userRepository;
    private final com.storagehub.repository.SettlementRepository settlementRepository;
    private final PricingEngine pricingEngine;
    private final NotificationService notificationService;
    private final LogService logService;

    /** Tính trạng thái trễ hiện tại; không ghi DB. */
    public LateCheckoutInfo info(Reservation reservation) {
        Unit unit = reservation.getUnit();
        LocalDate today = LocalDate.now(ICT_ZONE);
        LocalDate dueDate = effectiveDueDate(reservation);
        int daysLate = (int) Math.max(0, ChronoUnit.DAYS.between(dueDate, today));

        long dailyRent = 0L;
        if (unit != null) {
            try {
                var quote = pricingEngine.calculateQuote(
                        unit,
                        reservation.getStartDate(),
                        reservation.getEndDate(),
                        reservation.getPolicy()
                );
                if (quote.durationDays() > 0) {
                    dailyRent = quote.totalRent() / quote.durationDays();
                }
            } catch (Exception ignored) {
                dailyRent = 0L;
            }
        }

        int lateFeePercent = pricingEngine.ruleInt(
                unit, reservation.getPolicy(), PolicyRule.RuleType.LATE_FEE_PERCENT,
                DEFAULT_LATE_FEE_PERCENT);
        int threshold = pricingEngine.ruleInt(
                unit, reservation.getPolicy(), PolicyRule.RuleType.LATE_ESCALATION_DAYS,
                DEFAULT_ESCALATION_DAYS);

        long lateFee = BigDecimal.valueOf(dailyRent)
                .multiply(BigDecimal.valueOf(daysLate))
                .multiply(BigDecimal.valueOf(lateFeePercent))
                .divide(BigDecimal.valueOf(100), 0, RoundingMode.HALF_UP)
                .longValue();

        LateCheckoutCase current = caseRepository.findByReservation_ReservationId(
                reservation.getReservationId()).orElse(null);
        String caseStatus = current != null ? current.getStatus().name() : null;
        LocalDate extendedUntil = current != null ? current.getExtendedUntil() : null;

        boolean canSettle = true;
        String blockMessage = null;
        if (reservation.getStatus() == Reservation.Status.CLOSED
                || reservation.getStatus() == Reservation.Status.CANCELLED
                || reservation.getStatus() == Reservation.Status.EXPIRED) {
            canSettle = false;
            blockMessage = "Đơn đã đóng — không thể tất toán.";
        } else if (current != null
                && (current.getStatus() == LateCheckoutCase.Status.LIQUIDATED
                || current.getStatus() == LateCheckoutCase.Status.RESOLVED)) {
            canSettle = false;
            blockMessage = current.getStatus() == LateCheckoutCase.Status.LIQUIDATED
                    ? "Hợp đồng đã thanh lý — khách không thể thao tác."
                    : "Đơn đã tất toán.";
        } else if (current != null && current.getStatus() == LateCheckoutCase.Status.PENDING_MANAGER) {
            canSettle = false;
            blockMessage = "Đơn đã quá " + threshold + " ngày — chờ quản lý duyệt tất toán.";
        } else if (daysLate > threshold) {
            boolean extended = current != null
                    && current.getStatus() == LateCheckoutCase.Status.EXTENDED
                    && extendedUntil != null
                    && !today.isAfter(extendedUntil);
            if (!extended) {
                canSettle = false;
                blockMessage = "Đơn đã quá " + threshold + " ngày — chờ quản lý duyệt tất toán.";
            }
        }

        return new LateCheckoutInfo(
                daysLate,
                dailyRent,
                lateFeePercent,
                lateFee,
                threshold,
                dueDate,
                caseStatus,
                extendedUntil,
                canSettle,
                blockMessage
        );
    }

    /** Tạo/cập nhật case từ ngày trễ đầu tiên; idempotent theo reservation_id. */
    @Transactional
    public LateCheckoutCase evaluate(Reservation reservation) {
        if (reservation == null) {
            return null;
        }
        if (reservation.getStatus() != Reservation.Status.CHECKED_IN
                && reservation.getStatus() != Reservation.Status.CHECKOUT_REQUESTED) {
            return caseRepository.findByReservation_ReservationId(
                    reservation.getReservationId()).orElse(null);
        }

        LateCheckoutInfo info = info(reservation);
        if (info.daysLate() <= 0) {
            return caseRepository.findByReservation_ReservationId(
                    reservation.getReservationId()).orElse(null);
        }

        LateCheckoutCase current = caseRepository.findByReservation_ReservationId(
                reservation.getReservationId()).orElse(null);
        LocalDate today = LocalDate.now(ICT_ZONE);
        LocalDateTime now = LocalDateTime.now(ICT_ZONE);

        if (current == null) {
            current = new LateCheckoutCase();
            current.setReservation(reservation);
            current.setDaysLate(info.daysLate());
            current.setAccruedFee(BigDecimal.valueOf(info.lateFee()));
            current.setEscalationCount(info.daysLate() > info.escalationThresholdDays() ? 1 : 0);
            current.setStatus(info.daysLate() > info.escalationThresholdDays()
                    ? LateCheckoutCase.Status.PENDING_MANAGER
                    : LateCheckoutCase.Status.LATE);
            current.setUpdatedAt(now);
            LateCheckoutCase saved = caseRepository.save(current);
            if (saved.getStatus() == LateCheckoutCase.Status.PENDING_MANAGER) {
                notificationService.notifyLateCheckoutEscalated(
                        reservation, info.daysLate(), info.lateFee(), managersFor(reservation));
                logService.log(reservation.getCustomer(), "LATE_CHECKOUT_CASE", saved.getCaseId(),
                        "ESCALATED", null, "PENDING_MANAGER",
                        "Quá hạn " + info.daysLate() + " ngày — chuyển quản lý");
            } else {
                notificationService.notifyLateCheckoutStarted(
                        reservation, info.daysLate(), info.lateFee());
                logService.log(reservation.getCustomer(), "LATE_CHECKOUT_CASE", saved.getCaseId(),
                        "CREATED", null, "LATE",
                        "Bắt đầu trễ " + info.daysLate() + " ngày");
            }
            return saved;
        }

        if (current.getStatus() == LateCheckoutCase.Status.LIQUIDATED
                || current.getStatus() == LateCheckoutCase.Status.RESOLVED) {
            return current;
        }

        boolean changed = false;
        if (current.getStatus() == LateCheckoutCase.Status.EXTENDED) {
            if (current.getExtendedUntil() != null && !today.isAfter(current.getExtendedUntil())) {
                current.setDaysLate(info.daysLate());
                current.setAccruedFee(BigDecimal.valueOf(info.lateFee()));
                current.setUpdatedAt(now);
                return caseRepository.save(current);
            }
            current.setStatus(info.daysLate() > info.escalationThresholdDays()
                    ? LateCheckoutCase.Status.PENDING_MANAGER
                    : LateCheckoutCase.Status.LATE);
            current.setExtendedUntil(null);
            changed = true;
        } else if (current.getStatus() == LateCheckoutCase.Status.LATE
                && info.daysLate() > info.escalationThresholdDays()) {
            current.setStatus(LateCheckoutCase.Status.PENDING_MANAGER);
            current.setEscalationCount((current.getEscalationCount() == null ? 0 : current.getEscalationCount()) + 1);
            changed = true;
        }

        current.setDaysLate(info.daysLate());
        current.setAccruedFee(BigDecimal.valueOf(info.lateFee()));
        current.setUpdatedAt(now);
        LateCheckoutCase saved = caseRepository.save(current);
        if (changed && saved.getStatus() == LateCheckoutCase.Status.PENDING_MANAGER) {
            notificationService.notifyLateCheckoutEscalated(
                    reservation, info.daysLate(), info.lateFee(), managersFor(reservation));
            logService.log(reservation.getCustomer(), "LATE_CHECKOUT_CASE", saved.getCaseId(),
                    "ESCALATED", "LATE", "PENDING_MANAGER",
                    "Quá hạn " + info.daysLate() + " ngày — chuyển quản lý");
        }
        return saved;
    }

    @Transactional
    public LateCheckoutCase extend(Reservation reservation, User manager, int extensionDays, String reason) {
        LateCheckoutCase current = requireCase(reservation);
        if (current.getStatus() == LateCheckoutCase.Status.LIQUIDATED
                || current.getStatus() == LateCheckoutCase.Status.RESOLVED) {
            throw new com.storagehub.exception.BusinessRuleException(
                    "Case đã kết thúc — không thể gia hạn.");
        }
        int days = Math.max(0, extensionDays);
        LocalDate today = LocalDate.now(ICT_ZONE);
        LateCheckoutInfo info = info(reservation);
        current.setStatus(LateCheckoutCase.Status.EXTENDED);
        current.setDecision(LateCheckoutCase.Decision.EXTEND);
        current.setManager(manager);
        current.setExtensionDays(days);
        current.setExtendedUntil(today.plusDays(days));
        current.setReason(reason);
        current.setDaysLate(info.daysLate());
        current.setAccruedFee(BigDecimal.valueOf(info.lateFee()));
        current.setDecidedAt(LocalDateTime.now(ICT_ZONE));
        current.setUpdatedAt(LocalDateTime.now(ICT_ZONE));
        LateCheckoutCase saved = caseRepository.save(current);
        notificationService.notifyLateCheckoutExtended(reservation, saved.getExtendedUntil(), days == 0);
        logService.log(manager, "LATE_CHECKOUT_CASE", saved.getCaseId(),
                "EXTENDED", current.getStatus().name(), LateCheckoutCase.Status.EXTENDED.name(),
                (reason != null ? reason : "") + " — " + days + " ngày");
        return saved;
    }

    @Transactional
    public void markResolved(Reservation reservation) {
        caseRepository.findByReservation_ReservationId(reservation.getReservationId())
                .filter(c -> c.getStatus() != LateCheckoutCase.Status.LIQUIDATED
                        && c.getStatus() != LateCheckoutCase.Status.RESOLVED)
                .ifPresent(c -> {
                    c.setStatus(LateCheckoutCase.Status.RESOLVED);
                    c.setDecidedAt(LocalDateTime.now(ICT_ZONE));
                    c.setUpdatedAt(LocalDateTime.now(ICT_ZONE));
                    caseRepository.save(c);
                    logService.log(reservation.getCustomer(), "LATE_CHECKOUT_CASE", c.getCaseId(),
                            "RESOLVED", null, "RESOLVED", "Khách đã tất toán");
                });
    }

    @Transactional
    public void markLiquidated(
            Reservation reservation,
            User manager,
            Long settlementId,
            String reason
    ) {
        LateCheckoutCase current = caseRepository.findByReservation_ReservationId(
                reservation.getReservationId()).orElseGet(() -> {
            LateCheckoutCase created = new LateCheckoutCase();
            created.setReservation(reservation);
            created.setDaysLate(0);
            created.setAccruedFee(BigDecimal.ZERO);
            created.setEscalationCount(0);
            created.setUpdatedAt(LocalDateTime.now(ICT_ZONE));
            return created;
        });
        current.setStatus(LateCheckoutCase.Status.LIQUIDATED);
        current.setDecision(LateCheckoutCase.Decision.LIQUIDATE);
        current.setManager(manager);
        current.setReason(reason);
        if (settlementId != null) {
            current.setSettlement(settlementRepository.findById(settlementId).orElse(null));
        }
        current.setDecidedAt(LocalDateTime.now(ICT_ZONE));
        current.setUpdatedAt(LocalDateTime.now(ICT_ZONE));
        LateCheckoutCase saved = caseRepository.save(current);
        logService.log(manager, "LATE_CHECKOUT_CASE", saved.getCaseId(),
                "LIQUIDATED", null, "LIQUIDATED", reason != null ? reason : "Thanh lý hợp đồng");
    }

    public LateCheckoutCase findByReservationId(Long reservationId) {
        return caseRepository.findByReservation_ReservationId(reservationId).orElse(null);
    }

    public LateCheckoutCase requireCaseForManager(User manager, Long caseId) {
        LateCheckoutCase current = caseRepository.findWithDetailsById(caseId)
                .orElseThrow(() -> new com.storagehub.exception.BusinessRuleException(
                        "Không tìm thấy case trễ checkout."));
        if (!inFacility(manager, current.getReservation())) {
            throw new AccessDeniedException("Case thuộc cơ sở khác.");
        }
        return current;
    }

    public List<User> managersFor(Reservation reservation) {
        Integer facilityId = reservation.getUnit() != null
                && reservation.getUnit().getZone() != null
                && reservation.getUnit().getZone().getFacility() != null
                ? reservation.getUnit().getZone().getFacility().getFacilityId()
                : null;
        return userRepository.findByRole_NameAndStatus(Role.Name.FACILITY_MANAGER, 1).stream()
                .filter(u -> facilityId == null || (u.getFacility() != null
                        && facilityId.equals(u.getFacility().getFacilityId())))
                .toList();
    }

    @Transactional
    public List<LateCheckoutCaseResponse> listCases(
            User currentUser,
            String status,
            String query,
            int page,
            int pageSize
    ) {
        // Mở case ngay từ ngày trễ đầu tiên khi manager mở tab (idempotent).
        reservationRepository.findActiveWithDetails(
                        List.of(Reservation.Status.CHECKED_IN, Reservation.Status.CHECKOUT_REQUESTED))
                .stream()
                .filter(r -> inFacility(currentUser, r))
                .forEach(this::evaluate);

        List<LateCheckoutCase.Status> statuses = parseStatuses(status);
        List<LateCheckoutCase> cases = caseRepository.findWithDetailsByStatusIn(statuses);
        String q = query != null ? query.trim().toLowerCase(Locale.ROOT) : "";
        List<LateCheckoutCaseResponse> rows = cases.stream()
                .filter(c -> inFacility(currentUser, c.getReservation()))
                .filter(c -> q.isEmpty()
                        || c.getReservation().getCode().toLowerCase(Locale.ROOT).contains(q)
                        || c.getReservation().getCustomer().getFullName().toLowerCase(Locale.ROOT).contains(q)
                        || c.getReservation().getUnit().getCode().toLowerCase(Locale.ROOT).contains(q))
                .map(c -> {
                    LateCheckoutInfo info = info(c.getReservation());
                    return new LateCheckoutCaseResponse(
                            c.getCaseId(),
                            c.getReservation().getReservationId(),
                            c.getReservation().getCode(),
                            c.getReservation().getCustomer().getFullName(),
                            c.getReservation().getCustomer().getPhone(),
                            c.getReservation().getUnit().getCode(),
                            c.getReservation().getEndDate(),
                            info.daysLate(),
                            info.lateFee(),
                            c.getStatus().name(),
                            c.getDecision() != null ? c.getDecision().name() : null,
                            c.getExtensionDays(),
                            c.getExtendedUntil(),
                            c.getReason(),
                            c.getManager() != null ? c.getManager().getFullName() : null,
                            c.getDecidedAt(),
                            c.getSettlement() != null ? c.getSettlement().getSettlementId() : null
                    );
                })
                .toList();
        return slice(rows, page, pageSize);
    }

    @Transactional
    public List<LateCheckoutActiveRentalResponse> listActiveRentals(
            User currentUser,
            String query,
            int page,
            int pageSize
    ) {
        List<Reservation> active = reservationRepository.findActiveWithDetails(
                List.of(Reservation.Status.CHECKED_IN, Reservation.Status.CHECKOUT_REQUESTED));
        String q = query != null ? query.trim().toLowerCase(Locale.ROOT) : "";
        List<LateCheckoutActiveRentalResponse> rows = active.stream()
                .filter(r -> inFacility(currentUser, r))
                .filter(r -> q.isEmpty()
                        || r.getCode().toLowerCase(Locale.ROOT).contains(q)
                        || r.getCustomer().getFullName().toLowerCase(Locale.ROOT).contains(q)
                        || r.getUnit().getCode().toLowerCase(Locale.ROOT).contains(q))
                .sorted(Comparator.comparing(Reservation::getEndDate))
                .map(r -> {
                    LateCheckoutInfo info = info(r);
                    return new LateCheckoutActiveRentalResponse(
                            r.getReservationId(),
                            r.getCode(),
                            r.getCustomer().getFullName(),
                            r.getCustomer().getPhone(),
                            r.getUnit().getCode(),
                            r.getEndDate(),
                            r.getStatus().name(),
                            info.daysLate(),
                            info.lateFee(),
                            info.caseStatus(),
                            info.extendedUntil(),
                            info.canSettle()
                    );
                })
                .toList();
        return slice(rows, page, pageSize);
    }

    private LateCheckoutCase requireCase(Reservation reservation) {
        return caseRepository.findByReservation_ReservationId(reservation.getReservationId())
                .orElseThrow(() -> new com.storagehub.exception.BusinessRuleException(
                        "Đơn chưa có case trễ checkout."));
    }

    private List<LateCheckoutCase.Status> parseStatuses(String status) {
        if (status == null || status.isBlank() || "ALL".equalsIgnoreCase(status)) {
            return List.of(
                    LateCheckoutCase.Status.LATE,
                    LateCheckoutCase.Status.PENDING_MANAGER,
                    LateCheckoutCase.Status.EXTENDED,
                    LateCheckoutCase.Status.RESOLVED,
                    LateCheckoutCase.Status.LIQUIDATED
            );
        }
        try {
            return List.of(LateCheckoutCase.Status.valueOf(status.toUpperCase(Locale.ROOT)));
        } catch (IllegalArgumentException e) {
            throw new com.storagehub.exception.BusinessRuleException("Trạng thái case không hợp lệ: " + status);
        }
    }

    private boolean inFacility(User currentUser, Reservation reservation) {
        if (currentUser.getRole().getName() == Role.Name.SYSTEM_ADMIN) {
            return true;
        }
        if (currentUser.getRole().getName() != Role.Name.FACILITY_MANAGER
                || currentUser.getFacility() == null) {
            throw new AccessDeniedException("Chỉ quản lý cơ sở mới được xem case trả kho.");
        }
        return reservation.getUnit().getZone() != null
                && reservation.getUnit().getZone().getFacility() != null
                && currentUser.getFacility().getFacilityId().equals(
                reservation.getUnit().getZone().getFacility().getFacilityId());
    }

    private <T> List<T> slice(List<T> rows, int page, int pageSize) {
        int p = Math.max(1, page);
        int size = pageSize <= 0 ? 25 : Math.min(pageSize, 100);
        int from = Math.min(rows.size(), (p - 1) * size);
        int to = Math.min(rows.size(), from + size);
        return rows.subList(from, to);
    }

    private LocalDate effectiveDueDate(Reservation reservation) {
        CheckoutRequest forced = checkoutRequestRepository
                .findFirstByReservation_ReservationIdAndCheckoutTypeOrderByCreatedAtDesc(
                        reservation.getReservationId(), "VIOLATION")
                .filter(cr -> cr.getStatus() == CheckoutRequest.Status.PENDING)
                .orElse(null);
        LocalDate endDate = reservation.getEndDate();
        if (forced != null && forced.getRequestedDate() != null
                && forced.getRequestedDate().isBefore(endDate)) {
            // Buộc checkout sớm trước hạn: mốc trễ là deadline manager đặt.
            return forced.getRequestedDate();
        }
        // Đã trễ từ trước: giữ mốc endDate, không reset phạt theo deadline.
        return endDate;
    }
}
