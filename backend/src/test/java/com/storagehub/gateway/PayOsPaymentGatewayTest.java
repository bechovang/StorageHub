package com.storagehub.gateway;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.storagehub.exception.PaymentWebhookException;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import vn.payos.PayOS;
import vn.payos.model.webhooks.WebhookData;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.LinkedHashMap;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class PayOsPaymentGatewayTest {

    private static final String CHECKSUM_KEY = "test-checksum-key";
    private static final long ORDER_CODE_BASE = 100_000L;

    private final PayOS payOS = new PayOS("client-id", "api-key", CHECKSUM_KEY);
    private final ObjectMapper objectMapper = new ObjectMapper();
    private final PayOsPaymentGateway gateway = new PayOsPaymentGateway(
            payOS,
            Clock.fixed(Instant.parse("2026-10-20T03:00:00Z"), ZoneOffset.UTC),
            Duration.ofMinutes(5),
            "http://localhost:5173/payments",
            "http://localhost:5173/payments",
            ORDER_CODE_BASE
    );

    @Test
    @DisplayName("Webhook chữ ký hợp lệ → event đã verify, map orderCode về paymentId")
    void verifiesValidSignature() throws Exception {
        WebhookData data = webhookData(100_123L, 50_000L);
        String payload = signedPayload(data, 50_000L);

        PaymentGateway.WebhookEvent event = gateway.verifyWebhook(payload).orElseThrow();

        assertThat(event.paymentId()).isEqualTo(123L);
        assertThat(event.success()).isTrue();
        assertThat(event.amount()).isEqualTo(50_000L);
    }

    @Test
    @DisplayName("Chữ ký giả mạo → PaymentWebhookException (400)")
    void rejectsTamperedSignature() throws Exception {
        WebhookData data = webhookData(100_123L, 50_000L);
        String payload = signedPayload(data, 50_000L).replace("\"amount\":50000", "\"amount\":1");

        assertThatThrownBy(() -> gateway.verifyWebhook(payload))
                .isInstanceOf(PaymentWebhookException.class);
    }

    @Test
    @DisplayName("Payload thiếu signature → PaymentWebhookException")
    void rejectsMissingSignature() {
        assertThatThrownBy(() -> gateway.verifyWebhook("{\"code\":\"00\",\"data\":{}}"))
                .isInstanceOf(PaymentWebhookException.class);
    }

    @Test
    @DisplayName("orderCode format mới (paymentId * 1e9 + random) giải mã đúng paymentId")
    void decodesNewOrderCodeFormat() throws Exception {
        long paymentId = 42L;
        long orderCode = paymentId * 1_000_000_000L + 999_999_999L;
        WebhookData data = webhookData(orderCode, 50_000L);
        String payload = signedPayload(data, 50_000L);

        PaymentGateway.WebhookEvent event = gateway.verifyWebhook(payload).orElseThrow();
        assertThat(event.paymentId()).isEqualTo(paymentId);
    }

    @Test
    @DisplayName("orderCode ngoài dải StorageHub (payload mẫu PayOS 123) → bỏ qua, trả empty")
    void ignoresForeignOrderCodeAsProbe() throws Exception {
        WebhookData data = webhookData(42L, 50_000L);
        String payload = signedPayload(data, 50_000L);

        assertThat(gateway.verifyWebhook(payload)).isEmpty();
    }

    private WebhookData webhookData(long orderCode, long amount) {
        WebhookData data = new WebhookData();
        data.setOrderCode(orderCode);
        data.setAmount(amount);
        data.setDescription("StorageHub123");
        data.setAccountNumber("0123456789");
        data.setReference("REF-1");
        data.setTransactionDateTime("2026-10-20 10:00:00");
        data.setCurrency("VND");
        data.setPaymentLinkId("pl-1");
        data.setCode("00");
        data.setDesc("success");
        return data;
    }

    /**
     * Ký đúng object mà SDK sẽ parse lại: PayOS verify chữ ký trên WebhookData
     * (không phải raw text), nên test dùng cùng crypto provider với cùng object.
     */
    private String signedPayload(WebhookData data, long signatureAmount) throws Exception {
        WebhookData signable = webhookData(data.getOrderCode(), signatureAmount);
        String signature = payOS.getCrypto().createSignatureFromObj(signable, CHECKSUM_KEY);

        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("code", "00");
        payload.put("desc", "success");
        payload.put("success", true);
        payload.put("data", data);
        payload.put("signature", signature);
        return objectMapper.writeValueAsString(payload);
    }
}
