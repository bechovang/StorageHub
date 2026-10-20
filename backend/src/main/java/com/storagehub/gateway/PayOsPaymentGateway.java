package com.storagehub.gateway;

import com.storagehub.entity.Payment;
import com.storagehub.exception.PaymentGatewayException;
import com.storagehub.exception.PaymentBadRequestException;
import com.storagehub.exception.PaymentWebhookException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;
import vn.payos.PayOS;
import vn.payos.model.v2.paymentRequests.CreatePaymentLinkRequest;
import vn.payos.model.v2.paymentRequests.CreatePaymentLinkResponse;
import vn.payos.model.v2.paymentRequests.PaymentLink;
import vn.payos.model.v2.paymentRequests.PaymentLinkStatus;
import vn.payos.model.webhooks.WebhookData;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;
/**
 * PayOS thật (AD-9/Task 33) — bean chỉ tạo khi {@code payment.payos.enabled=true}.
 *
 * <p>orderCode là hàm thuần của paymentId ({@code base + id}) nên webhook
 * quay ngược được về Payment mà không cần cột/lookup mới. Gateway không ghi
 * DB: state machine vẫn thuộc PaymentService (AD-4). Phiên checkout/qr giữ
 * in-memory giống MockPaymentGateway; mất cache sau restart thì webhook vẫn
 * resolve đúng nhờ orderCode.</p>
 */
@Component
@ConditionalOnProperty(prefix = "payment.payos", name = "enabled", havingValue = "true")
public class PayOsPaymentGateway implements PaymentGateway {

    private static final Logger log = LoggerFactory.getLogger(PayOsPaymentGateway.class);
    private static final String CHECKOUT_BASE = "https://pay.payos.vn/web/";

    private final PayOS payOS;
    private final Clock clock;
    private final Duration qrTtl;
    private final String returnUrl;
    private final String cancelUrl;
    private final long orderCodeBase;
    private final Map<Long, PayOsSession> sessions = new ConcurrentHashMap<>();

    public PayOsPaymentGateway(
            PayOS payOS,
            Clock clock,
            @Value("${payment.payos.qr-ttl:PT5M}") Duration qrTtl,
            @Value("${payment.payos.return-url:http://localhost:5173/payment}") String returnUrl,
            @Value("${payment.payos.cancel-url:http://localhost:5173/payment}") String cancelUrl,
            @Value("${payment.payos.order-code-base:100000}") long orderCodeBase
    ) {
        this.payOS = payOS;
        this.clock = clock;
        this.qrTtl = qrTtl;
        this.returnUrl = returnUrl;
        this.cancelUrl = cancelUrl;
        this.orderCodeBase = orderCodeBase;
    }

    @Override
    public InitiationResult initiate(InitiationCommand command) {
        if (command.method() != Payment.Method.PAYOS) {
            throw new PaymentBadRequestException(
                    "PayOS chỉ hỗ trợ phương thức PAYOS — chọn PayOS QR.");
        }

        long orderCode = orderCodeFor(command.paymentId());
        long expiredAt = clock.instant().plus(qrTtl).getEpochSecond();

        CreatePaymentLinkRequest request = CreatePaymentLinkRequest.builder()
                .orderCode(orderCode)
                .amount(command.amount())
                .description(descriptionFor(command.paymentId()))
                .returnUrl(withPaymentId(returnUrl, command.paymentId()))
                .cancelUrl(withPaymentId(cancelUrl, command.paymentId()))
                .expiredAt(expiredAt)
                .build();

        try {
            CreatePaymentLinkResponse response = payOS.paymentRequests().create(request);
            Instant expiresAt = response.getExpiredAt() != null
                    ? Instant.ofEpochSecond(response.getExpiredAt())
                    : Instant.ofEpochSecond(expiredAt);

            sessions.put(command.paymentId(), new PayOsSession(
                    response.getCheckoutUrl(),
                    response.getQrCode(),
                    expiresAt
            ));

            return new InitiationResult(Payment.Status.PENDING);
        } catch (Exception exception) {
            log.error("PayOS create link failed for payment {} (orderCode {}): {}",
                    command.paymentId(), orderCode, exception.getMessage(), exception);
            throw new PaymentGatewayException(
                    "Không khởi tạo được phiên thanh toán PayOS.", exception);
        }
    }

    @Override
    public Optional<Payment.Status> poll(Long paymentId, Payment.Method method) {
        try {
            PaymentLink link = payOS.paymentRequests().get(orderCodeFor(paymentId));
            PaymentLinkStatus status = link.getStatus();
            if (status == null) {
                return Optional.empty();
            }
            return switch (status) {
                case PAID -> Optional.of(Payment.Status.SUCCEEDED);
                case CANCELLED, FAILED, UNDERPAID -> Optional.of(Payment.Status.FAILED);
                case EXPIRED -> Optional.of(Payment.Status.EXPIRED);
                case PENDING, PROCESSING -> Optional.empty();
            };
        } catch (Exception exception) {
            // Webhook vẫn là đường xác nhận chính; lỗi mạng khi poll không được
            // làm FE mất trạng thái — giữ PENDING và để lần poll sau thử lại.
            log.warn("PayOS get link failed for payment {}: {}",
                    paymentId, exception.getMessage());
            return Optional.empty();
        }
    }

    @Override
    public Payment.Status confirmOtp(Long paymentId, String otp) {
        throw new IllegalStateException("PayOS không dùng OTP.");
    }

    @Override
    public Optional<SessionView> describe(Long paymentId, Payment.Method method) {
        PayOsSession session = sessions.get(paymentId);
        if (session != null) {
            return Optional.of(new SessionView(
                    false,
                    null,
                    session.qrPayload(),
                    session.qrExpiresAt(),
                    session.checkoutUrl()
            ));
        }

        // Backend restart giữa phiên: cache mất nhưng link PayOS còn sống.
        // Dựng checkoutUrl từ paymentLinkId để FE vẫn mở được cổng.
        try {
            PaymentLink link = payOS.paymentRequests().get(orderCodeFor(paymentId));
            if (link.getId() == null) {
                return Optional.empty();
            }
            PayOsSession recovered = new PayOsSession(
                    CHECKOUT_BASE + link.getId(), null, null);
            sessions.put(paymentId, recovered);
            return Optional.of(new SessionView(
                    false,
                    null,
                    null,
                    null,
                    recovered.checkoutUrl()
            ));
        } catch (Exception exception) {
            return Optional.empty();
        }
    }

    @Override
    public Optional<WebhookEvent> verifyWebhook(String rawPayload) {
        try {
            WebhookData data = payOS.webhooks().verify(rawPayload);
            if (data == null || data.getOrderCode() == null) {
                throw new PaymentWebhookException(
                        "Webhook PayOS thiếu orderCode.");
            }

            long paymentId = data.getOrderCode() - orderCodeBase;
            if (paymentId <= 0) {
                throw new PaymentWebhookException(
                        "orderCode không thuộc StorageHub: " + data.getOrderCode());
            }

            boolean success = "00".equals(data.getCode());
            long amount = data.getAmount() == null ? 0L : data.getAmount();
            return Optional.of(new WebhookEvent(paymentId, success, amount));
        } catch (PaymentWebhookException exception) {
            throw exception;
        } catch (Exception exception) {
            log.error("PayOS webhook verification failed: {}", exception.getMessage());
            throw new PaymentWebhookException(
                    "Chữ ký webhook PayOS không hợp lệ.", exception);
        }
    }

    private long orderCodeFor(Long paymentId) {
        return orderCodeBase + paymentId;
    }

    private static String descriptionFor(Long paymentId) {
        String description = "StorageHub" + paymentId;
        return description.length() > 25 ? description.substring(0, 25) : description;
    }

    private static String withPaymentId(String url, Long paymentId) {
        String separator = url.contains("?") ? "&" : "?";
        return url + separator + "paymentId=" + paymentId;
    }

    private record PayOsSession(
            String checkoutUrl,
            String qrPayload,
            Instant qrExpiresAt
    ) {
    }
}
