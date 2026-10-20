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
 * Gateway demo (AD-9) cho CARD / MOMO / VNPAY.
 *
 * <p>Mọi phương thức demo đều trả PROCESSING rồi poll tự SUCCEEDED sau
 * {@code payment.mock.auto-complete-delay} (mặc định 0s) — bấm là thành công,
 * không cần thẻ/OTP/QR hợp lệ. PayOS KHÔNG đi qua đây: PAYOS do
 * PayOsPaymentGateway thật xử lý (router chọn theo method).</p>
 */
@Component
public class MockPaymentGateway implements PaymentGateway {

    private final Map<Long, Instant> startedAt = new ConcurrentHashMap<>();

    private final Clock clock;
    private final Duration autoCompleteDelay;

    public MockPaymentGateway(
            Clock clock,
            @Value("${payment.mock.auto-complete-delay:PT0S}") Duration autoCompleteDelay
    ) {
        this.clock = clock;
        this.autoCompleteDelay = autoCompleteDelay;
    }

    @Override
    public InitiationResult initiate(InitiationCommand command) {
        if (command.method() == Payment.Method.PAYOS) {
            throw new IllegalArgumentException("PAYOS phải đi PayOsPaymentGateway.");
        }
        startedAt.put(command.paymentId(), clock.instant());
        // PROCESSING: FE hiện spinner rồi poll — handler nghiệp vụ chạy ở resolve,
        // không phải lúc create (state machine vẫn ở PaymentService).
        return new InitiationResult(Payment.Status.PROCESSING);
    }

    @Override
    public Optional<Payment.Status> poll(Long paymentId, Payment.Method method) {
        Instant started = startedAt.get(paymentId);
        if (started == null) {
            return Optional.empty();
        }
        if (clock.instant().isBefore(started.plus(autoCompleteDelay))) {
            return Optional.empty();
        }
        startedAt.remove(paymentId);
        return Optional.of(Payment.Status.SUCCEEDED);
    }

    @Override
    public Payment.Status confirmOtp(Long paymentId, String otp) {
        // Demo không còn bước OTP; giữ contract cũ cho client lỡ gọi.
        startedAt.remove(paymentId);
        return Payment.Status.SUCCEEDED;
    }

    @Override
    public Optional<SessionView> describe(Long paymentId, Payment.Method method) {
        return Optional.empty();
    }
}
