package com.storagehub.gateway;

import com.storagehub.entity.Payment;
import com.storagehub.exception.PaymentBadRequestException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.context.annotation.Primary;
import org.springframework.stereotype.Component;

import java.util.Optional;

/**
 * Một cửa duy nhất cho PaymentService (AD-9): CARD/MOMO/VNPAY → mock demo;
 * PAYOS → PayOS thật. PayOS chỉ có bean khi {@code payment.payos.enabled=true}
 * và đủ 3 key; chưa cấu hình thì báo lỗi rõ thay vì âm thầm mock.
 */
@Primary
@Component
public class PaymentGatewayRouter implements PaymentGateway {

    private static final Logger log = LoggerFactory.getLogger(PaymentGatewayRouter.class);

    private final MockPaymentGateway mock;
    private final ObjectProvider<PayOsPaymentGateway> payOsProvider;

    public PaymentGatewayRouter(
            MockPaymentGateway mock,
            ObjectProvider<PayOsPaymentGateway> payOsProvider
    ) {
        this.mock = mock;
        this.payOsProvider = payOsProvider;
    }

    @Override
    public InitiationResult initiate(InitiationCommand command) {
        if (command.method() == Payment.Method.PAYOS) {
            return payOs().initiate(command);
        }
        return mock.initiate(command);
    }

    @Override
    public Optional<Payment.Status> poll(Long paymentId, Payment.Method method) {
        if (method == Payment.Method.PAYOS) {
            return payOs().poll(paymentId, method);
        }
        return mock.poll(paymentId, method);
    }

    @Override
    public Payment.Status confirmOtp(Long paymentId, String otp) {
        return mock.confirmOtp(paymentId, otp);
    }

    @Override
    public Optional<SessionView> describe(Long paymentId, Payment.Method method) {
        if (method == Payment.Method.PAYOS) {
            return payOs().describe(paymentId, method);
        }
        return mock.describe(paymentId, method);
    }

    @Override
    public Optional<WebhookEvent> verifyWebhook(String rawPayload) {
        PayOsPaymentGateway payOs = payOsProvider.getIfAvailable();
        return payOs == null ? Optional.empty() : payOs.verifyWebhook(rawPayload);
    }

    private PayOsPaymentGateway payOs() {
        PayOsPaymentGateway payOs = payOsProvider.getIfAvailable();
        if (payOs == null) {
            log.warn("PayOS gateway được yêu cầu nhưng chưa cấu hình (PAYOS_ENABLED=false hoặc thiếu keys trong .env).");
            throw new PaymentBadRequestException(
                    "Cổng thanh toán QR hiện đang tạm bảo trì kết nối. Quý khách vui lòng chọn phương thức thanh toán cọc khác");
        }
        return payOs;
    }
}
