package com.storagehub.service.impl;

import com.storagehub.dto.payment.ConfirmPaymentRequest;
import com.storagehub.dto.payment.CreatePaymentRequest;
import com.storagehub.dto.payment.PaymentPageResponse;
import com.storagehub.dto.payment.PaymentRecordResponse;
import com.storagehub.dto.payment.PaymentResultResponse;
import com.storagehub.dto.payment.PaymentSessionResponse;
import com.storagehub.dto.reservation.ReservationDetailResponse;
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
import com.storagehub.repository.PaymentRepository;
import com.storagehub.repository.ReservationRepository;
import com.storagehub.repository.UserRepository;
import com.storagehub.service.ExtensionService;
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
    private final ReservationRepository reservationRepository;
    private final UserRepository userRepository;
    private final PaymentGateway gateway;
    private final List<PaymentSuccessHandler> handlers;
    private final TransactionTemplate transactionTemplate;
    private final com.storagehub.service.PricingEngine pricingEngine;
    private final ExtensionService extensionService;

    public PaymentServiceImpl(
            PaymentRepository paymentRepository,
            ReservationRepository reservationRepository,
            UserRepository userRepository,
            PaymentGateway gateway,
            List<PaymentSuccessHandler> handlers,
            PlatformTransactionManager transactionManager,
            com.storagehub.service.PricingEngine pricingEngine,
            ExtensionService extensionService
    ) {
        this.paymentRepository = paymentRepository;
        this.reservationRepository = reservationRepository;
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

        // Ownership: không phải reservation của mình (hoặc không tồn tại) → 403.
        Reservation reservation = reservationRepository
                .findByReservationIdAndCustomer_EmailIgnoreCase(
                        request.reservationId(), email)
                .orElseThrow(() -> new AccessDeniedException(
                        "Reservation belongs to another customer"));

        // Scope theo openapi.yaml: DEPOSIT (booking) + RENT (check-in, US-15)
        // + EXTENSION_FEE (gia hạn, US-18).
        if (request.purpose() != Payment.Purpose.DEPOSIT
                && request.purpose() != Payment.Purpose.RENT
                && request.purpose() != Payment.Purpose.EXTENSION_FEE) {
            throw new PaymentBadRequestException(
                    "Chỉ hỗ trợ purpose DEPOSIT, RENT và EXTENSION_FEE.");
        }

        if (request.method() == Payment.Method.CARD && request.card() == null) {
            throw new PaymentBadRequestException(
                    "Card details are required for CARD payments.");
        }
        if (request.method() == Payment.Method.MOMO
                && (request.momoPhone() == null || request.momoPhone().isBlank())) {
            throw new PaymentBadRequestException(
                    "momoPhone is required for MOMO payments.");
        }

        // Duplicate check TRƯỚC state check: sau khi deposit thành công,
        // reservation đã flip RESERVED — vẫn phải trả 409 PAYMENT_DUPLICATE
        // ("Khoản này đã được thanh toán.") thay vì PAYMENT_INVALID_STATE.
        // EXTENSION_FEE đặc biệt: cho phép chuỗi gia hạn liên tiếp nên SUCCEEDED
        // không chặn — chỉ chặn payment còn sống (1 extension chờ trả tại 1 thời điểm).
        Set<Payment.Status> duplicateBlock = request.purpose() == Payment.Purpose.EXTENSION_FEE
                ? Set.of(Payment.Status.PENDING, Payment.Status.PROCESSING)
                : BLOCKS_DUPLICATE;
        if (paymentRepository.existsByReservation_ReservationIdAndPurposeAndStatusIn(
                request.reservationId(), request.purpose(), duplicateBlock)) {
            throw new PaymentDuplicateException();
        }

        if (request.purpose() == Payment.Purpose.DEPOSIT
                && reservation.getStatus() != Reservation.Status.PENDING_PAYMENT) {
            throw new PaymentInvalidStateException(
                    "Đặt chỗ này không ở trạng thái chờ thanh toán.");
        }

        // US-15 (FR-15): rent thu 100% tại quầy check-in — chỉ mở khi đặt chỗ
        // đã cọc (RESERVED) và chưa quá hạn nhận kho (FR-36 tính theo giờ ICT).
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

        // US-18 (FR-16): gia hạn chỉ mở cho thuê đang hoạt động, chưa qua EndDate
        // (trễ → LATE_FEE lúc tất toán), và phải có extension PENDING_PAYMENT
        // tạo từ POST /reservations/{id}/extensions — đóng modal chưa trả thì
        // không ghi nhận gì.
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

        return createWithRetry(payer, reservation, request);
    }

    /**
     * Mỗi attempt là một transaction riêng: đụng unique uk_payments_receipt thì
     * rollback sạch rồi cấp số mới. Không retry bên trong transaction — session
     * Hibernate không dùng lại được sau khi flush lỗi (AssertionFailure).
     */
    private PaymentSessionResponse createWithRetry(
            User payer,
            Reservation reservation,
            CreatePaymentRequest request
    ) {
        for (int attempt = 0; attempt < 3; attempt++) {
            try {
                return transactionTemplate.execute(tx -> {
                    // Reservation nạp ngoài tx (createPayment không @Transactional)
                    // nên proxy Unit là detached — nạp lại trong tx để lazy-load
                    // được khi tính amount RENT theo quote.
                    Reservation managed = reservationRepository
                            .findById(reservation.getReservationId())
                            .orElseThrow();

                    Payment payment = new Payment();
                    payment.setPayer(payer);
                    payment.setReservation(managed);
                    payment.setPurpose(request.purpose());
                    payment.setMethod(request.method());
                    // AD-11: server tính từ quote snapshot — FE không gửi được amount.
                    // DEPOSIT = cọc đang giữ; RENT = 100% tổng tiền thuê (FR-15).
                    payment.setAmount(resolveAmount(managed, request.purpose()));
                    payment.setStatus(Payment.Status.PENDING);
                    // Cấp từ lúc tạo (cột NOT NULL), chỉ hiển thị khi SUCCEEDED.
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

                    return toSession(payment, request.reservationId());
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
        int months = (int) java.time.temporal.ChronoUnit.MONTHS.between(
                reservation.getStartDate().withDayOfMonth(1),
                reservation.getEndDate().plusDays(1).withDayOfMonth(1));
        if (months < 1) {
            months = 1;
        }
        com.storagehub.dto.quote.QuoteResponse quote = pricingEngine.calculateQuote(
                reservation.getUnit(), reservation.getStartDate(), months);
        return java.math.BigDecimal.valueOf(quote.totalRent());
    }

    @Override
    public PaymentSessionResponse getPayment(String email, Long paymentId) {
        Payment payment = requireOwnedPayment(email, paymentId);

        if (!TERMINAL.contains(payment.getStatus())) {
            // Mock resolve terminal ngay lúc poll (CARD/VNPAY auto-complete,
            // MOMO/VNPAY quá hạn) — transaction + FOR UPDATE bên trong.
            gateway.poll(paymentId, payment.getMethod()).ifPresent(decision ->
                    transactionTemplate.executeWithoutResult(
                            tx -> resolve(paymentId, decision)));

            payment = requireOwnedPayment(email, paymentId);
        }

        return toSession(payment, payment.getReservation().getReservationId());
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

        Page<Payment> result = reservationId == null
                ? paymentRepository.findByPayer_EmailIgnoreCase(email, pageable)
                : paymentRepository.findByPayer_EmailIgnoreCaseAndReservation_ReservationId(
                        email, reservationId, pageable);

        // Trong transaction để lazy load Reservation khi map DTO.
        return transactionTemplate.execute(tx -> PaymentPageResponse.from(result));
    }

    @Override
    public PaymentResultResponse confirmPayment(
            String email,
            Long paymentId,
            ConfirmPaymentRequest request
    ) {
        Payment payment = requireOwnedPayment(email, paymentId);

        if (payment.getMethod() != Payment.Method.MOMO) {
            throw new PaymentInvalidStateException(
                    "Chỉ thanh toán MoMo cần xác nhận OTP.");
        }
        if (TERMINAL.contains(payment.getStatus())) {
            throw new PaymentInvalidStateException(); // "Giao dịch này đã kết thúc."
        }

        Payment.Status decision = gateway.confirmOtp(paymentId, request.otp());

        if (decision == Payment.Status.EXPIRED) {
            // Persist EXPIRED trong tx riêng rồi trả 409 (openapi.yaml confirm).
            transactionTemplate.executeWithoutResult(
                    tx -> resolve(paymentId, decision));
            throw new PaymentExpiredException();
        }

        return transactionTemplate.execute(tx ->
                buildResultAfterResolve(paymentId, decision));
    }

    /**
     * Webhook PayOS (AD-9): gateway đã verify chữ ký và trả event; service là
     * single writer — đổi state machine + chạy handler đúng một lần trong
     * transaction có FOR UPDATE. Payment đã terminal (webhook retry) → no-op.
     */
    @Override
    public void handlePayOsWebhook(String rawPayload) {
        PaymentGateway.WebhookEvent event = gateway.verifyWebhook(rawPayload)
                .orElseThrow(() -> new PaymentWebhookException(
                        "Cổng PayOS chưa được bật trên backend này."));

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
            next = Integer.parseInt(max.substring(prefix.length())) + 1;
        }
        return prefix + String.format("%04d", next);
    }
}
