package com.storagehub.config;

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import vn.payos.PayOS;

/**
 * PayOS client (AD-9) — chỉ tạo khi bật profile `payos`; mặc định demo vẫn
 * dùng MockPaymentGateway. Thiếu key thì fail fast ngay lúc khởi động, không
 * để payment treo PENDING vì cấu hình nửa vời.
 */
@Configuration
@ConditionalOnProperty(prefix = "payment.payos", name = "enabled", havingValue = "true")
public class PayOsConfig {

    @Bean
    public PayOS payOS(
            @Value("${payment.payos.client-id:}") String clientId,
            @Value("${payment.payos.api-key:}") String apiKey,
            @Value("${payment.payos.checksum-key:}") String checksumKey
    ) {
        require(clientId, "PAYOS_CLIENT_ID");
        require(apiKey, "PAYOS_API_KEY");
        require(checksumKey, "PAYOS_CHECKSUM_KEY");
        return new PayOS(clientId, apiKey, checksumKey);
    }

    private static void require(String value, String envName) {
        if (value == null || value.isBlank()) {
            throw new IllegalStateException(
                    "PAYOS_ENABLED=true nhưng thiếu " + envName
                            + " — set biến môi trường trước khi chạy backend.");
        }
    }
}
