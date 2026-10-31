package com.storagehub.service.impl;

import com.storagehub.dto.payment.ConfirmPaymentRequest;
import com.storagehub.dto.payment.CreatePaymentRequest;
import com.storagehub.dto.payment.PaymentPageResponse;
import com.storagehub.dto.payment.PaymentRecordResponse;
import com.storagehub.dto.payment.PaymentResultResponse;
import com.storagehub.dto.payment.PaymentSessionResponse;
import com.storagehub.dto.reservation.ReservationDetailResponse;
import com.storagehub.entity.Unit;
import com.storagehub.entity.Payment;
import com.storagehub.entity.Reservation;
import com.storagehub.entity.User;
import com.storagehub.exception.InvalidCredentialsException;
import com.storagehub.exception.PaymentBadRequestException;
import com.storagehub.exception.PaymentDuplicateException;
import com.storagehub.exception.PaymentExpiredException;
import com.storagehub.exception.PaymentInvalidStateException;
import com.storagehub.exception.PaymentNotFoundException;
import com.storagehub.exception.PaymentWebhookException;
import com.storagehub.gateway.PaymentGateway;
import com.storagehub.repository.UnitRepository;
import com.storagehub.repository.PaymentRepository;
import com.storagehub.repository.ReservationRepository;
import com.storagehub.repository.UserRepository;
import com.storagehub.service.ExtensionService;
import com.storagehub.service.ReservationService;
import com.storagehub.service.PaymentService;
import com.storagehub.service.handler.PaymentSuccessHandler;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;

import java.time.LocalDate;
import java.time.ZoneId;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Set;

/**
 * US-8 (FR-8/9, AD-9). Nguyên tắc: amount do server tính từ quote snapshot của
 * Reservation (AD-11); outcome do gateway quyết; resolve terminal (poll/confirm)
 * chạy trong transaction + FOR UPDATE — handler nghiệp vụ chỉ chạy đúng 1 lần;
 * receipt_code cấp từ lúc tạo (cột NOT NULL) nhưng chỉ hiển thị khi SUCCEEDED.
 */
@Service
public class PaymentServiceImpl implements PaymentService {

    private static final Logger log =
            LoggerFactory.getLogger(PaymentServiceImpl.class);

    /** Payment còn "sống" hoặc đã xong → chặn tạo payment trùng (409 DUPLICATE). */
    private static final Set<Payment.Status> BLOCKS_DUPLICATE = Set.of(
            Payment.Status.PENDING,
            Payment.Status.PROCESSING,
            Payment.Status.SUCCEEDED
    );

    private static final Set<Payment.Status> TERMINAL = Set.of(
            Payment.Status.SUCCEEDED,
            Payment.Status.FAILED,
            Payment.Status.EXPIRED
    );

    private final PaymentRepository paymentRepository;
    private final UnitRepository unitRepository;
    private final ReservationService reservationService;
    private final ReservationRepository reservationRepository;
    private final UserRepository userRepository;
    private final PaymentGateway gateway;
    private final List<PaymentSuccessHandler> handlers;
    private final TransactionTemplate transactionTemplate;
    private final com.storagehub.service.PricingEngine pricingEngine;
    private final ExtensionService extensionService;
    @org.springframework.beans.factory.annotation.Value("${payment.demo.skip-enabled:false}")
    private boolean demoSkipEnabled;

    public PaymentServiceImpl(
            PaymentRepository paymentRepository,
            UnitRepository unitRepository,
            ReservationRepository reservationRepository,
            UserRepository userRepository,
            PaymentGateway gateway,
            List<PaymentSuccessHandler> handlers,
            PlatformTransactionManager transactionManager,
            com.storagehub.service.PricingEngine pricingEngine,
            ExtensionService extensionService,
            ReservationService reservationService
    ) {
        this.paymentRepository = paymentRepository;
        this.unitRepository = unitRepository;
        this.reservationRepository = reservationRepository;
        this.reservationService = reservationService;
        this.userRepository = userRepository;
        this.gateway = gateway;
        this.handlers = handlers;
        this.transactionTemplate = new TransactionTemplate(transactionManager);
        this.pricingEngine = pricingEngine;
        this.extensionService = extensionService;
    }

    @Override
    public PaymentSessionResponse createPayment(
            String email,
            CreatePaymentRequest request
    ) {
        User payer = userRepository.findByEmailIgnoreCase(email)
                .orElseThrow(InvalidCredentialsException::new);

        if (request.method() != Payment.Method.PAYOS) {
            throw new PaymentBadRequestException(
                    "Chỉ hỗ trợ kênh thanh toán PayOS (QR).");
        }

        if (request.purpose() == Payment.Purpose.DEPOSIT) {
            if (request.reservationId() != null
                    || request.unitId() == null
                    || request.startDate() == null
                    || request.endDate() == null) {
                throw new PaymentBadRequestException(
                        "Cọc cần unitId, startDate, endDate — chưa có reservation trước khi trả cọc.");
            }

            Unit unit = unitRepository.findWithDetailsById(request.unitId())
                    .orElseThrow(() -> new com.storagehub.exception.UnitNotFoundException("Unit này không tồn tại."));

            // Không giữ chỗ: chỉ kiểm tra tại thời điểm tạo QR. Webhook sẽ
            // lock unit và quyết định booking hay refund.
            reservationService.assertBookingAvailable(unit, request.startDate(), request.endDate());

            // Idempotency: cùng user + cùng kho/ngày + payment còn sống → trả
            // lại đúng session cũ thay vì tạo QR thứ hai.
            var existing = paymentRepository
                    .findFirstByPayer_UserIdAndUnit_UnitIdAndStartDateAndEndDateAndPurposeAndStatusInOrderByPaymentIdDesc(
                            payer.getUserId(),
                            unit.getUnitId(),
                            request.startDate(),
                            request.endDate(),
                            Payment.Purpose.DEPOSIT,
                            java.util.Set.of(Payment.Status.PENDING, Payment.Status.PROCESSING));
            if (existing.isPresent()) {
                return toSession(existing.get(), reservationIdOrNull(existing.get()));
            }

            com.storagehub.dto.quote.QuoteResponse quote = pricingEngine.calculateQuote(
                    unit, request.startDate(), request.endDate());

            return createWithRetry(
                    payer, null, unit,
                    request.startDate(), quote.endDate(),
                    java.math.BigDecimal.valueOf(quote.depositAmount()),
                    request);
        }

        if (request.unitId() != null || request.startDate() != null || request.endDate() != null) {
            throw new PaymentBadRequestException(
                    "unitId/startDate/endDate chỉ dùng cho purpose DEPOSIT.");
        }
        if (request.reservationId() == null) {
            throw new PaymentBadRequestException(
                    "RENT/EXTENSION_FEE cần reservationId.");
        }

        Reservation reservation = reservationRepository
                .findByReservationIdAndCustomer_EmailIgnoreCase(
                        request.reservationId(), email)
                .orElseThrow(() -> new AccessDeniedException(
                        "Reservation belongs to another customer"));

        if (request.purpose() != Payment.Purpose.RENT
                && request.purpose() != Payment.Purpose.EXTENSION_FEE) {
            throw new PaymentBadRequestException(
                    "Chỉ hỗ trợ purpose DEPOSIT, RENT và EXTENSION_FEE.");
        }

        Set<Payment.Status> duplicateBlock = request.purpose() == Payment.Purpose.EXTENSION_FEE
                ? Set.of(Payment.Status.PENDING, Payment.Status.PROCESSING)
                : BLOCKS_DUPLICATE;
        if (paymentRepository.existsByReservation_ReservationIdAndPurposeAndStatusIn(
                request.reservationId(), request.purpose(), duplicateBlock)) {
            throw new PaymentDuplicateException();
        }

        if (request.purpose() == Payment.Purpose.RENT) {
            LocalDate today = LocalDate.now(ZoneId.of("Asia/Ho_Chi_Minh"));
            if (reservation.getStatus() != Reservation.Status.RESERVED) {
                throw new PaymentInvalidStateException(
                        "Đặt chỗ này chưa xác nhận cọc — không thể trả tiền thuê.");
            }
            if (today.isAfter(reservation.getStartDate())) {
                throw new PaymentInvalidStateException(
                        "Đặt chỗ đã quá hạn nhận kho (no-show) — không thể trả tiền thuê.");
            }
        }

        if (request.purpose() == Payment.Purpose.EXTENSION_FEE) {
            LocalDate today = LocalDate.now(ZoneId.of("Asia/Ho_Chi_Minh"));
            if (reservation.getStatus() != Reservation.Status.CHECKED_IN) {
                throw new PaymentInvalidStateException(
                        "Chỉ thuê đang hoạt động (CHECKED_IN) mới thanh toán gia hạn.");
            }
            if (today.isAfter(reservation.getEndDate())) {
                throw new PaymentInvalidStateException(
                        "Đã qua ngày kết thúc — gia hạn chỉ mở trước EndDate.");
            }
            extensionService.pendingExtensionOrNull(request.reservationId())
                    .orElseThrow(() -> new PaymentInvalidStateException(
                            "Chưa có yêu cầu gia hạn nào chờ thanh toán — hãy tạo gia hạn trước."));
        }

        return createWithRetry(payer, reservation, null, null, null, null, request);
    }

    private PaymentSessionResponse createWithRetry(
            User payer,
            Reservation reservation,
            Unit unit,
            LocalDate startDate,
            LocalDate endDate,
            java.math.BigDecimal depositAmount,
            CreatePaymentRequest request
    ) {
        for (int attempt = 0; attempt < 3; attempt++) {
            try {
                return transactionTemplate.execute(tx -> {
                    Reservation managedRes = null;
                    Unit managedUnit = null;
                    if (reservation != null) {
                        managedRes = reservationRepository
                                .findById(reservation.getReservationId())
                                .orElseThrow();
                    } else {
                        managedUnit = unitRepository.findById(unit.getUnitId()).orElseThrow();
                    }

                    Payment payment = new Payment();
                    payment.setPayer(payer);
                    if (managedRes != null) {
                        payment.setReservation(managedRes);
                    } else {
                        payment.setUnit(managedUnit);
                        payment.setStartDate(startDate);
                        payment.setEndDate(endDate);
                    }
                    payment.setPurpose(request.purpose());
                    payment.setMethod(request.method());
                    // AD-11: server tính từ quote snapshot — FE không gửi được amount.
                    payment.setAmount(managedRes != null
                            ? resolveAmount(managedRes, request.purpose())
                            : depositAmount);
                    payment.setStatus(Payment.Status.PENDING);
                    payment.setReceiptCode(allocateReceiptCode());

                    paymentRepository.saveAndFlush(payment);

                    PaymentGateway.InitiationResult initiation = gateway.initiate(
                            new PaymentGateway.InitiationCommand(
                                    payment.getPaymentId(),
                                    payment.getMethod(),
                                    request.card() == null ? null : request.card().number(),
                                    payment.getAmount().longValueExact()
                            )
                    );
                    payment.setStatus(initiation.initialStatus());
                    paymentRepository.save(payment);

                    return toSession(payment, managedRes == null ? null : managedRes.getReservationId());
                });
            } catch (DataIntegrityViolationException race) {
                // create đồng thời cấp trùng receipt_code — thử số kế tiếp
            }
        }
        throw new IllegalStateException("Could not allocate receipt code");
    }

    /**
     * DEPOSIT = cọc đang giữ; RENT (US-15/FR-15) = 100% tổng tiền thuê theo quote;
     * EXTENSION_FEE (US-18/FR-16) = tiền thuê kỳ thêm + top-up cọc (bảng tính
     * server-truth từ extension PENDING_PAYMENT).
     */
    private java.math.BigDecimal resolveAmount(
            Reservation reservation,
            Payment.Purpose purpose
    ) {
        if (purpose == Payment.Purpose.EXTENSION_FEE) {
            com.storagehub.entity.Extension extension = extensionService
                    .pendingExtensionFor(reservation.getReservationId());
            ExtensionService.Breakdown breakdown = extensionService.breakdownFor(
                    reservation, extension.getNewEndDate());
            return java.math.BigDecimal.valueOf(breakdown.totalPayable());
        }
        if (purpose != Payment.Purpose.RENT) {
            return reservation.getDepositAmount();
        }
        com.storagehub.dto.quote.QuoteResponse quote = pricingEngine.calculateQuote(
                reservation.getUnit(), reservation.getStartDate(), reservation.getEndDate());
        return java.math.BigDecimal.valueOf(quote.totalRent());
    }

    @Override
    public PaymentSessionResponse getPayment(String email, Long paymentId) {
        Payment payment = requireOwnedPayment(email, paymentId);

        if (!TERMINAL.contains(payment.getStatus())) {
            // Poll để đồng bộ terminal state (webhook có thể chưa tới).
            gateway.poll(paymentId, payment.getMethod()).ifPresent(decision ->
                    transactionTemplate.executeWithoutResult(
                            tx -> resolve(paymentId, decision)));

            payment = requireOwnedPayment(email, paymentId);
        }

        return toSession(payment, reservationIdOrNull(payment));
    }

    @Override
    public PaymentPageResponse listPayments(
            String email,
            Long reservationId,
            int page,
            int pageSize
    ) {
        Pageable pageable = PageRequest.of(
                page - 1, // contract 1-based → Spring 0-based
                pageSize,
                Sort.by(Sort.Direction.DESC, "paymentId")
        );

        // Query + map trong CÙNG transaction: PaymentRecordResponse cần chạm
        // reservation/extension/settlement (lazy proxy) để lấy reservationId.
        return transactionTemplate.execute(tx -> {
            Page<Payment> result = reservationId == null
                    ? paymentRepository.findByPayer_EmailIgnoreCase(email, pageable)
                    : paymentRepository.findByPayer_EmailIgnoreCaseAndReservation_ReservationId(
                            email, reservationId, pageable);
            return PaymentPageResponse.from(result);
        });
    }

    @Override
    public PaymentResultResponse confirmPayment(
            String email,
            Long paymentId,
            ConfirmPaymentRequest request
    ) {
        throw new PaymentInvalidStateException(
                "Xác nhận OTP không còn được hỗ trợ — thanh toán qua PayOS webhook/polling.");
    }

    /**
     * Webhook PayOS (AD-9): gateway đã verify chữ ký và trả event; service là
     * single writer — đổi state machine + chạy handler đúng một lần trong
     * transaction có FOR UPDATE. Payment đã terminal (webhook retry) → no-op.
     */
    @Override
    public void handlePayOsWebhook(String rawPayload) {
        PaymentGateway.WebhookEvent event = gateway.verifyWebhook(rawPayload).orElse(null);
        if (event == null) {
            log.info("PayOS webhook ignored (verification probe or gateway disabled)");
            return;
        }

        transactionTemplate.executeWithoutResult(tx -> {
            Payment payment = paymentRepository
                    .findByIdForUpdate(event.paymentId())
                    .orElse(null);

            if (payment == null) {
                // orderCode lạ: trả 200 để PayOS không retry vô hạn.
                log.warn("PayOS webhook for unknown paymentId {}", event.paymentId());
                return;
            }
            if (payment.getMethod() != Payment.Method.PAYOS) {
                throw new PaymentWebhookException(
                        "Payment " + event.paymentId() + " không phải PayOS.");
            }
            if (event.success()
                    && payment.getAmount().longValueExact() != event.amount()) {
                throw new PaymentWebhookException(
                        "Số tiền webhook không khớp payment " + event.paymentId()
                                + " (webhook " + event.amount()
                                + ", expected " + payment.getAmount() + ").");
            }

            resolve(event.paymentId(), event.success()
                    ? Payment.Status.SUCCEEDED
                    : Payment.Status.FAILED);
        });
    }
    // ------------------------------------------------------------------
    // Resolve terminal — luôn chạy trong transaction
    // ------------------------------------------------------------------

    @Override
    public PaymentSessionResponse demoCompletePayment(String email, Long paymentId) {
        if (!demoSkipEnabled) {
            throw new PaymentBadRequestException(
                    "Chế độ bỏ qua thanh toán chỉ bật ở môi trường dev.");
        }
        Payment payment = requireOwnedPayment(email, paymentId);
        if (TERMINAL.contains(payment.getStatus())) {
            return toSession(payment, reservationIdOrNull(payment));
        }
        transactionTemplate.executeWithoutResult(
                tx -> resolve(paymentId, Payment.Status.SUCCEEDED));
        Payment refreshed = requireOwnedPayment(email, paymentId);
        return toSession(refreshed, reservationIdOrNull(refreshed));
    }

    private record Resolved(
            Payment payment,
            boolean transitioned,
            PaymentSuccessHandler.PaymentSuccessOutcome outcome
    ) {
    }

    private Resolved resolve(Long paymentId, Payment.Status decision) {
        Payment payment = paymentRepository.findByIdForUpdate(paymentId)
                .orElseThrow(PaymentNotFoundException::new);

        // Poll/confirm đua nhau: bên kia đã resolve — giữ kết quả cũ (idempotent).
        if (TERMINAL.contains(payment.getStatus())) {
            return new Resolved(payment, false, null);
        }

        payment.setStatus(decision);

        PaymentSuccessHandler.PaymentSuccessOutcome outcome = null;
        if (decision == Payment.Status.SUCCEEDED) {
            // Handler nghiệp vụ cùng transaction — ném exception rollback toàn bộ.
            outcome = handlers.stream()
                    .filter(h -> h.supports(payment.getPurpose()))
                    .findFirst()
                    .orElseThrow(() -> new IllegalStateException(
                            "No PaymentSuccessHandler for purpose "
                                    + payment.getPurpose()))
                    .onSuccess(payment);
        }

        paymentRepository.save(payment);
        return new Resolved(payment, true, outcome);
    }

    private PaymentResultResponse buildResultAfterResolve(
            Long paymentId,
            Payment.Status decision
    ) {
        Resolved resolved = resolve(paymentId, decision);
        Payment payment = resolved.payment();
        Reservation reservation = payment.getReservation();

        List<Payment> payments = paymentRepository
                .findByReservation_ReservationId(
                        reservation.getReservationId());

        boolean depositPaid = payments.stream().anyMatch(p ->
                p.getPurpose() == Payment.Purpose.DEPOSIT
                        && p.getStatus() == Payment.Status.SUCCEEDED);

        return new PaymentResultResponse(
                PaymentRecordResponse.from(payment),
                payment.getStatus() == Payment.Status.SUCCEEDED
                        ? PaymentResultResponse.ReceiptResponse.from(payment)
                        : null,
                ReservationDetailResponse.from(
                        reservation, payments, depositPaid ? "HELD" : null),
                // TODO US-11: ContractChainItem từ resolved.outcome().contract()
                null,
                resolved.outcome() == null
                        ? null
                        : resolved.outcome().notification()
        );
    }

    // ------------------------------------------------------------------
    // Helpers
    // ------------------------------------------------------------------

    private Payment requireOwnedPayment(String email, Long paymentId) {
        Payment payment = paymentRepository
                .findByIdWithAssociations(paymentId)
                .orElseThrow(PaymentNotFoundException::new);

        if (!payment.getPayer().getEmail().equalsIgnoreCase(email)) {
            throw new AccessDeniedException("Payment belongs to another user");
        }
        return payment;
    }

    private Long reservationIdOrNull(Payment payment) {
        return payment.getReservation() == null
                ? null
                : payment.getReservation().getReservationId();
    }

    private PaymentSessionResponse toSession(Payment payment, Long reservationId) {
        PaymentGateway.SessionView view = gateway
                .describe(payment.getPaymentId(), payment.getMethod())
                .orElse(null);

        return PaymentSessionResponse.from(
                payment,
                reservationId,
                view == null ? null : new PaymentSessionResponse.GatewaySessionView(
                        view.otpRequired(),
                        view.otpExpiresAt(),
                        view.qrPayload(),
                        view.qrExpiresAt(),
                        view.checkoutUrl()
                )
        );
    }

    /** RT-{YYYY}-{NNNN} tăng dần trong năm; unique DB là bảo vệ cuối. */
    private String allocateReceiptCode() {
        int year = LocalDate.now(ZoneOffset.UTC).getYear();
        String prefix = "RT-" + year + "-";
        String max = paymentRepository.findMaxReceiptCodeByPrefix(prefix);

        int next = 1;
        if (max != null && max.length() > prefix.length()) {
            String suffix = max.substring(prefix.length());
            try {
                next = Integer.parseInt(suffix) + 1;
            } catch (NumberFormatException ignored) {
                // Seed/dữ liệu cũ có thể chứa mã không phải số (vd RT-2026-PAYOS);
                // bỏ qua và cấp số kế tiếp theo số bản ghi — unique DB chặn trùng.
                next = (int) paymentRepository.count() + 1;
            }
        }
        return prefix + String.format("%04d", next);
    }
}
