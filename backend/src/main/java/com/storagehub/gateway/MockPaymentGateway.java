package com.storagehub.gateway;

import com.storagehub.entity.Payment;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Mock gateway (AD-9) — quyết định outcome theo cấu hình server-side, state
 * in-memory KHÔNG persist (không lưu số thẻ/CVC/OTP). Test values khai báo
 * trong openapi.yaml: thẻ 4242424242424242 / MoMo OTP 123456.
 * Flows theo contract: CARD → PROCESSING rồi auto-complete qua poll; MOMO →
 * PENDING + OTP confirm; VNPAY → PENDING + QR auto-complete ~2s, quá hạn EXPIRED.
 */
@Component
public class MockPaymentGateway implements PaymentGateway {

    private final Map<Long, MockSession> sessions = new ConcurrentHashMap<>();

    private final Clock clock;
    private final String successCard;
    private final String testOtp;
    private final Duration otpTtl;
    private final Duration qrTtl;
    private final Duration autoCompleteDelay;

    public MockPaymentGateway(
            Clock clock,
            @Value("${payment.mock.success-card:4242424242424242}") String successCard,
            @Value("${payment.mock.otp:123456}") String testOtp,
            @Value("${payment.mock.otp-ttl:PT5M}") Duration otpTtl,
            @Value("${payment.mock.qr-ttl:PT5M}") Duration qrTtl,
            @Value("${payment.mock.auto-complete-delay:PT2S}") Duration autoCompleteDelay
    ) {
        this.clock = clock;
        this.successCard = successCard;
        this.testOtp = testOtp;
        this.otpTtl = otpTtl;
        this.qrTtl = qrTtl;
        this.autoCompleteDelay = autoCompleteDelay;
    }

    @Override
    public InitiationResult initiate(InitiationCommand command) {
        Instant now = clock.instant();
        MockSession session;

        switch (command.method()) {
            case CARD -> {
                boolean cardSuccess = successCard.equals(command.cardNumber());
                session = new MockSession(command.method(), now, null, null, null, cardSuccess);
            }
            case MOMO -> {
                Instant otpExpiresAt = now.plus(otpTtl);
                session = new MockSession(command.method(), now, otpExpiresAt, null, null, false);
            }
            case VNPAY -> {
                Instant qrExpiresAt = now.plus(qrTtl);
                String qrPayload = "STORAGEHUB|VNPAY-MOCK|"
                        + command.paymentId() + "|" + command.amount();
                session = new MockSession(command.method(), now, null, qrPayload, qrExpiresAt, false);
            }
            default -> throw new IllegalArgumentException(
                    "Unsupported method: " + command.method()
            );
        }

        sessions.put(command.paymentId(), session);

        return new InitiationResult(
                command.method() == Payment.Method.CARD
                        ? Payment.Status.PROCESSING
                        : Payment.Status.PENDING
        );
    }

    @Override
    public Optional<Payment.Status> poll(Long paymentId) {
        MockSession session = sessions.get(paymentId);
        if (session == null) {
            return Optional.empty();
        }

        Instant now = clock.instant();

        // Service guard bằng FOR UPDATE + status-check nên quyết định lặp
        // vẫn an toàn (resolve idempotent).
        return switch (session.method()) {
            case CARD -> {
                if (now.isAfter(session.startedAt().plus(autoCompleteDelay))) {
                    sessions.remove(paymentId);
                    yield Optional.of(session.cardSuccess()
                            ? Payment.Status.SUCCEEDED
                            : Payment.Status.FAILED);
                }
                yield Optional.empty();
            }
            case VNPAY -> {
                if (now.isAfter(session.qrExpiresAt())) {
                    sessions.remove(paymentId);
                    yield Optional.of(Payment.Status.EXPIRED);
                }
                if (now.isAfter(session.startedAt().plus(autoCompleteDelay))) {
                    sessions.remove(paymentId);
                    yield Optional.of(Payment.Status.SUCCEEDED);
                }
                yield Optional.empty();
            }
            case MOMO -> {
                if (now.isAfter(session.otpExpiresAt())) {
                    sessions.remove(paymentId);
                    yield Optional.of(Payment.Status.EXPIRED);
                }
                yield Optional.empty();
            }
        };
    }

    @Override
    public Payment.Status confirmOtp(Long paymentId, String otp) {
        MockSession session = sessions.remove(paymentId);
        if (session == null) {
            // Phiên không còn (restart / poll đã EXPIRED trước đó).
            return Payment.Status.EXPIRED;
        }

        if (clock.instant().isAfter(session.otpExpiresAt())) {
            return Payment.Status.EXPIRED;
        }

        if (testOtp.equals(otp)) {
            return Payment.Status.SUCCEEDED;
        }

        return Payment.Status.FAILED;
    }

    @Override
    public Optional<SessionView> describe(Long paymentId) {
        MockSession session = sessions.get(paymentId);
        if (session == null) {
            return Optional.empty();
        }

        return Optional.of(new SessionView(
                session.method() == Payment.Method.MOMO,
                session.otpExpiresAt(),
                session.qrPayload(),
                session.qrExpiresAt()
        ));
    }

    private record MockSession(
            Payment.Method method,
            Instant startedAt,
            Instant otpExpiresAt,
            String qrPayload,
            Instant qrExpiresAt,
            boolean cardSuccess
    ) {
    }
}
