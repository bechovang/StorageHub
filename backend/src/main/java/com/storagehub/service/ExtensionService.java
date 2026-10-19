package com.storagehub.service;

import com.storagehub.dto.extension.ExtensionQuoteResponse;
import com.storagehub.dto.quote.QuoteResponse;
import com.storagehub.entity.Extension;
import com.storagehub.entity.PolicyRule;
import com.storagehub.entity.RentalPolicy;
import com.storagehub.entity.Reservation;
import com.storagehub.entity.Unit;
import com.storagehub.entity.User;
import com.storagehub.exception.InvalidCredentialsException;
import com.storagehub.exception.ReservationInvalidStateException;
import com.storagehub.exception.ReservationNotFoundException;
import com.storagehub.repository.ExtensionRepository;
import com.storagehub.repository.PolicyRuleRepository;
import com.storagehub.repository.RentalPolicyRepository;
import com.storagehub.repository.ReservationRepository;
import com.storagehub.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Optional;

/**
 * US-18 (FR-16/FR-12, AD-6): ExtensionService độc quyền ghi bảng extensions.
 * Phí gia hạn = tiền thuê kỳ thêm (policy active) + top-up cọc
 * = max(0, Deposit% × tổng tiền thuê sau gia hạn − cọc đang giữ) — mọi số liệu
 * từ PricingEngine (AD-11), FE không được gửi amount.
 *
 * Boundary xung đột (FR-16): latestNewCheckout = ngày bắt đầu của reservation
 * kế tiếp trên cùng unit − 1 (không buffer — turnover buffer đã tính khi booking).
 * Gia hạn chỉ mở trước EndDate; quá hạn giữ CHECKED_IN và tính LATE_FEE lúc tất toán.
 */
@Service
@RequiredArgsConstructor
public class ExtensionService {

    /** Status reservation "chiếm lịch tương lai" của unit — chặn gia hạn đâm qua. */
    private static final List<Reservation.Status> NEXT_BLOCKING_STATUSES = List.of(
            Reservation.Status.RESERVED,
            Reservation.Status.CHECKED_IN,
            Reservation.Status.CHECKOUT_REQUESTED
    );

    private static final ZoneId ICT_ZONE = ZoneId.of("Asia/Ho_Chi_Minh");

    private final ExtensionRepository extensionRepository;
    private final ReservationRepository reservationRepository;
    private final UserRepository userRepository;
    private final RentalPolicyRepository rentalPolicyRepository;
    private final PolicyRuleRepository policyRuleRepository;
    private final PricingEngine pricingEngine;
    private final LogService logService;

    /** Số tiền gia hạn tính lại theo policy active — handler dùng khi apply. */
    public record Breakdown(
            int addedMonths,
            long addedRent,
            long depositHeld,
            long depositTopUp,
            long newDepositHeld,
            long totalPayable,
            String policyVersion
    ) {
    }

    /**
     * FR-16 boundary: ngày trả muộn nhất được phép = start của reservation kế
     * tiếp trên cùng unit − 1. Null khi unit trống phía sau (gia hạn tự do).
     */
    @Transactional(readOnly = true)
    public LocalDate latestAllowedCheckout(Reservation reservation) {
        List<Reservation> actives = reservationRepository.findActiveReservationsForUnit(
                reservation.getUnit().getUnitId(), NEXT_BLOCKING_STATUSES);
        return actives.stream()
                .filter(r -> !r.getReservationId().equals(reservation.getReservationId()))
                .map(Reservation::getStartDate)
                .filter(start -> start.isAfter(reservation.getStartDate()))
                .min(LocalDate::compareTo)
                .map(start -> start.minusDays(1))
                .orElse(null);
    }

    /** Extension PENDING_PAYMENT đang chờ trả (duy nhất theo single live payment). */
    @Transactional(readOnly = true)
    public Optional<Extension> pendingExtensionOrNull(Long reservationId) {
        return extensionRepository.findFirstByReservation_ReservationIdAndStatusOrderByExtensionIdDesc(
                reservationId, Extension.Status.PENDING_PAYMENT);
    }

    /** Variants bắt buộc có — PaymentServiceImpl/Handler gọi trong tx resolve(). */
    @Transactional(readOnly = true)
    public Extension pendingExtensionFor(Long reservationId) {
        return pendingExtensionOrNull(reservationId)
                .orElseThrow(() -> new ReservationInvalidStateException(
                        "Không có yêu cầu gia hạn nào chờ thanh toán — hãy tạo gia hạn trước."));
    }

    /**
     * Bảng tính FR-16: thêm kỳ theo policy active + top-up cọc theo Deposit%.
     * Gọi trong transaction của caller (createRequest / handler resolve) —
     * reservation phải được nạp cùng unit để PricingEngine đọc rule.
     */
    public Breakdown breakdownFor(Reservation reservation, LocalDate newEndDate) {
        Unit unit = reservation.getUnit();

        int addedMonths = monthsBetween(reservation.getEndDate(), newEndDate);

        // Tổng tiền thuê hiện tại + kỳ thêm đều recompute theo policy active (AD-11).
        QuoteResponse originalQuote = pricingEngine.calculateQuote(
                unit, reservation.getStartDate(), originalMonths(reservation));
        QuoteResponse extensionQuote = pricingEngine.calculateQuote(
                unit, reservation.getEndDate().plusDays(1), addedMonths);

        long addedRent = extensionQuote.totalRent();
        long newTotalRent = originalQuote.totalRent() + addedRent;
        int depositPercent = depositPercentFor(unit);
        long newDepositHeld = (newTotalRent * depositPercent) / 100;

        long depositHeld = reservation.getDepositAmount().longValueExact();
        long depositTopUp = Math.max(0, newDepositHeld - depositHeld);

        return new Breakdown(
                addedMonths,
                addedRent,
                depositHeld,
                depositTopUp,
                newDepositHeld,
                addedRent + depositTopUp,
                originalQuote.policyVersion()
        );
    }

    /**
     * Bước 1/2 của FR-16 (POST /reservations/{id}/extensions): validate + server
     * tính bảng giá + tạo (hoặc tái dùng) extension PENDING_PAYMENT. Chưa đụng
     * EndDate — chỉ dịch khi phí được trả (handler flip APPLIED).
     */
    @Transactional
    public ExtensionQuoteResponse createRequest(String email, Long reservationId, LocalDate newEndDate) {
        User customer = userRepository.findByEmailIgnoreCase(email)
                .orElseThrow(InvalidCredentialsException::new);

        Reservation reservation = reservationRepository.findWithDetailsById(reservationId)
                .orElseThrow(() -> new ReservationNotFoundException("Reservation not found."));

        if (!reservation.getCustomer().getUserId().equals(customer.getUserId())) {
            throw new AccessDeniedException("Reservation belongs to another customer");
        }

        if (reservation.getStatus() != Reservation.Status.CHECKED_IN) {
            throw new ReservationInvalidStateException(
                    "Chỉ thuê đang hoạt động (CHECKED_IN) mới gia hạn được.");
        }

        LocalDate today = LocalDate.now(ICT_ZONE);
        if (today.isAfter(reservation.getEndDate())) {
            throw new ReservationInvalidStateException(
                    "Đã qua ngày kết thúc — gia hạn chỉ mở trước EndDate; trả trễ sẽ tính phụ thu LATE_FEE khi tất toán.");
        }

        if (!newEndDate.isAfter(reservation.getEndDate())) {
            throw new ReservationInvalidStateException(
                    "Ngày trả mới phải sau ngày kết thúc hiện tại (" + reservation.getEndDate() + ").");
        }

        LocalDate latest = latestAllowedCheckout(reservation);
        if (latest != null && newEndDate.isAfter(latest)) {
            throw new ReservationInvalidStateException(
                    "Xung đột lịch — kho " + reservation.getUnit().getCode()
                            + " đã có khách đặt trước bắt đầu " + latest.plusDays(1)
                            + ". Latest new checkout: " + latest + ".");
        }

        Breakdown breakdown = breakdownFor(reservation, newEndDate);

        // Idempotent: cùng newEndDate + vẫn chờ trả → tái dùng row (không nhân bản).
        Extension extension = extensionRepository
                .findFirstByReservation_ReservationIdAndStatusAndNewEndDateOrderByExtensionIdDesc(
                        reservationId, Extension.Status.PENDING_PAYMENT, newEndDate)
                .orElseGet(() -> {
                    Extension created = new Extension();
                    created.setReservation(reservation);
                    created.setOldEndDate(reservation.getEndDate());
                    created.setNewEndDate(newEndDate);
                    created.setExtensionFee(BigDecimal.valueOf(breakdown.addedRent()));
                    created.setStatus(Extension.Status.PENDING_PAYMENT);
                    Extension saved = extensionRepository.save(created);
                    logService.log(customer, "EXTENSION", saved.getExtensionId(), "CREATED",
                            null, "PENDING_PAYMENT",
                            "Gia hạn " + reservation.getCode() + " đến " + newEndDate
                                    + " — thuê thêm " + breakdown.addedRent()
                                    + " ₫ + top-up cọc " + breakdown.depositTopUp() + " ₫");
                    return saved;
                });

        return new ExtensionQuoteResponse(
                extension.getExtensionId(),
                extension.getOldEndDate(),
                extension.getNewEndDate(),
                breakdown.addedMonths(),
                breakdown.addedRent(),
                breakdown.depositHeld(),
                breakdown.depositTopUp(),
                breakdown.newDepositHeld(),
                breakdown.totalPayable(),
                latest,
                breakdown.policyVersion()
        );
    }

    /**
     * Bước 2/2 (gọi từ ExtensionPaymentSuccessHandler trong lock payment —
     * chạy đúng 1 lần): flip PENDING_PAYMENT → APPLIED kèm ActivityLog.
     */
    public Extension markApplied(User actor, Extension extension) {
        if (extension.getStatus() == Extension.Status.APPLIED) {
            return extension;
        }
        extension.setStatus(Extension.Status.APPLIED);
        extensionRepository.save(extension);
        logService.log(actor, "EXTENSION", extension.getExtensionId(), "STATUS_CHANGED",
                "PENDING_PAYMENT", "APPLIED",
                "Phí gia hạn đã trả — checkout mới " + extension.getNewEndDate());
        return extension;
    }

    /** Số tháng giữa 2 mốc contract-style (end inclusive), tối thiểu 1. */
    private int monthsBetween(LocalDate oldEnd, LocalDate newEnd) {
        int months = (int) ChronoUnit.MONTHS.between(
                oldEnd.plusDays(1).withDayOfMonth(1),
                newEnd.plusDays(1).withDayOfMonth(1));
        return Math.max(1, months);
    }

    /** Thời hạn gốc của rental (mốc tính tổng tiền thuê hiện tại). */
    private int originalMonths(Reservation reservation) {
        int months = (int) ChronoUnit.MONTHS.between(
                reservation.getStartDate().withDayOfMonth(1),
                reservation.getEndDate().plusDays(1).withDayOfMonth(1));
        return Math.max(1, months);
    }

    /** Deposit% theo unit type từ policy active — cùng logic PricingEngine. */
    private int depositPercentFor(Unit unit) {
        int depositPercent = 10;
        RentalPolicy activePolicy = rentalPolicyRepository.findByStatus(1)
                .orElseThrow(() -> new IllegalStateException("Hệ thống chưa có chính sách giá hiệu lực"));
        Integer typeId = unit.getType().getTypeId();
        for (PolicyRule r : policyRuleRepository.findByPolicy_PolicyId(activePolicy.getPolicyId())) {
            if (r.getType().getTypeId().equals(typeId)
                    && r.getRuleType() == PolicyRule.RuleType.DEPOSIT_RATE) {
                depositPercent = r.getValue().intValue();
            }
        }
        return depositPercent;
    }
}
