package com.storagehub.payment;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.resttestclient.TestRestTemplate;
import org.springframework.boot.resttestclient.autoconfigure.AutoConfigureTestRestTemplate;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;

import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

/**
 * US-8 integration test (MySQL storagehub_test + seed demo + JWT thật).
 * 10 case bắt buộc theo docs/sprints/US-08-payment-backend-checklist.md.
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@AutoConfigureTestRestTemplate // Boot 4: bean TestRestTemplate không còn tự đăng ký
@ActiveProfiles("test")
class PaymentIntegrationTest {

    private static final String LAN = "lan@demo.storagehub.vn";   // customer seed
    private static final String TRANG = "trang@demo.storagehub.vn"; // customer khác
    private static final String PASSWORD = "password";            // seed demo
    private static final String SUCCESS_CARD = "4242424242424242";
    private static final long DEPOSIT_AMOUNT = 1_035_000L;

    @Autowired
    private TestRestTemplate rest;

    @Autowired
    private JdbcTemplate jdbc;

    private final ObjectMapper mapper = new ObjectMapper();

    private final List<Long> createdReservationIds = new java.util.ArrayList<>();

    @AfterEach
    void cleanup() {
        for (Long reservationId : createdReservationIds) {
            List<Long> paymentIds = jdbc.queryForList(
                    "SELECT payment_id FROM payments WHERE reservation_id = ?",
                    Long.class, reservationId);

            jdbc.update("DELETE FROM payments WHERE reservation_id = ?", reservationId);
            jdbc.update("DELETE FROM notifications WHERE deep_link = ?",
                    "/rentals/" + reservationId);
            if (!paymentIds.isEmpty()) {
                String in = String.join(",",
                        paymentIds.stream().map(String::valueOf).toList());
                jdbc.update("DELETE FROM activity_logs WHERE entity_type = 'PAYMENT' "
                        + "AND entity_id IN (" + in + ")");
            }
            jdbc.update("DELETE FROM activity_logs WHERE entity_type = 'RESERVATION' "
                    + "AND entity_id = ?", reservationId);
            jdbc.update("DELETE FROM reservations WHERE reservation_id = ?",
                    reservationId);
        }
        createdReservationIds.clear();
    }

    // ------------------------------------------------------------------
    // 1. CARD hợp lệ → poll → SUCCEEDED + receipt + reservation RESERVED
    // ------------------------------------------------------------------
    @Test
    void cardSuccess_flipsReservation_andCreatesReceipt() throws Exception {
        String token = login(LAN);
        long reservationId = insertPendingPaymentReservation(LAN);

        ResponseEntity<String> created = createPayment(token, Map.of(
                "purpose", "DEPOSIT",
                "reservationId", reservationId,
                "method", "CARD",
                "card", Map.of("number", SUCCESS_CARD,
                        "expiry", "12/28", "cvc", "123")));
        assertEquals(201, created.getStatusCode().value());
        JsonNode body = mapper.readTree(created.getBody());
        assertEquals("PROCESSING", body.get("status").asText());
        assertEquals(DEPOSIT_AMOUNT, body.get("amount").asLong()); // server tính
        assertTrue(body.get("receiptCode").isNull());              // chưa SUCCEEDED

        Thread.sleep(800); // auto-complete-delay = PT0.3S (test profile)

        ResponseEntity<String> polled = getPayment(token, body.get("id").asLong());
        JsonNode session = mapper.readTree(polled.getBody());
        assertEquals("SUCCEEDED", session.get("status").asText());
        assertTrue(session.get("receiptCode").asText().startsWith("RT-"));

        assertEquals("RESERVED", reservationStatus(reservationId));
        assertEquals(1, notificationCount(reservationId));
    }

    // ------------------------------------------------------------------
    // 2. CARD sai → FAILED, không đổi trạng thái nghiệp vụ
    // ------------------------------------------------------------------
    @Test
    void cardFailure_keepsReservationPending() throws Exception {
        String token = login(LAN);
        long reservationId = insertPendingPaymentReservation(LAN);

        JsonNode created = mapper.readTree(createPayment(token, Map.of(
                "purpose", "DEPOSIT",
                "reservationId", reservationId,
                "method", "CARD",
                "card", Map.of("number", "4000000000000000",
                        "expiry", "12/28", "cvc", "123"))).getBody());

        Thread.sleep(800);

        JsonNode session = mapper.readTree(
                getPayment(token, created.get("id").asLong()).getBody());
        assertEquals("FAILED", session.get("status").asText());
        assertTrue(session.get("receiptCode").isNull());
        assertEquals("PENDING_PAYMENT", reservationStatus(reservationId));
        assertEquals(0, notificationCount(reservationId));
    }

    // ------------------------------------------------------------------
    // 3. MoMo OTP đúng → PaymentResult đầy đủ
    // ------------------------------------------------------------------
    @Test
    void momoCorrectOtp_returnsFullResult() throws Exception {
        String token = login(LAN);
        long reservationId = insertPendingPaymentReservation(LAN);

        JsonNode created = mapper.readTree(createPayment(token, Map.of(
                "purpose", "DEPOSIT",
                "reservationId", reservationId,
                "method", "MOMO",
                "momoPhone", "0901234567")).getBody());
        assertEquals("PENDING", created.get("status").asText());
        assertTrue(created.get("otpRequired").asBoolean());
        assertNotNull(created.get("otpExpiresAt"));

        ResponseEntity<String> confirmed = confirmPayment(
                token, created.get("id").asLong(), "123456");
        assertEquals(200, confirmed.getStatusCode().value());

        JsonNode result = mapper.readTree(confirmed.getBody());
        assertEquals("SUCCEEDED", result.at("/payment/status").asText());
        assertEquals("RT-", result.at("/receipt/receiptCode").asText()
                .substring(0, 3));
        assertEquals("RESERVED", result.at("/reservation/status").asText());
        assertEquals("HELD", result.at("/reservation/depositStatus").asText());
        assertEquals("RESERVATION_CONFIRMED",
                result.at("/notification/type").asText());
        assertEquals("/rentals/" + reservationId,
                result.at("/notification/deepLink").asText());
    }

    // ------------------------------------------------------------------
    // 4. MoMo OTP sai → FAILED, không receipt, retry được
    // ------------------------------------------------------------------
    @Test
    void momoWrongOtp_failsWithoutReceipt() throws Exception {
        String token = login(LAN);
        long reservationId = insertPendingPaymentReservation(LAN);

        JsonNode created = mapper.readTree(createPayment(token, Map.of(
                "purpose", "DEPOSIT",
                "reservationId", reservationId,
                "method", "MOMO",
                "momoPhone", "0901234567")).getBody());

        JsonNode result = mapper.readTree(confirmPayment(
                token, created.get("id").asLong(), "999999").getBody());
        assertEquals("FAILED", result.at("/payment/status").asText());
        assertTrue(result.at("/receipt").isNull());
        assertEquals("PENDING_PAYMENT", reservationStatus(reservationId));

        // Retry bằng CARD sau khi thất bại — cho phép đổi phương thức
        ResponseEntity<String> retry = createPayment(token, Map.of(
                "purpose", "DEPOSIT",
                "reservationId", reservationId,
                "method", "CARD",
                "card", Map.of("number", SUCCESS_CARD,
                        "expiry", "12/28", "cvc", "123")));
        assertEquals(201, retry.getStatusCode().value());
    }

    // ------------------------------------------------------------------
    // 5. VNPAY QR quá hạn → EXPIRED (qr-ttl = PT1S ở test profile)
    // ------------------------------------------------------------------
    @Test
    void vnpayQrExpires_afterTtl() throws Exception {
        String token = login(LAN);
        long reservationId = insertPendingPaymentReservation(LAN);

        JsonNode created = mapper.readTree(createPayment(token, Map.of(
                "purpose", "DEPOSIT",
                "reservationId", reservationId,
                "method", "VNPAY")).getBody());
        assertEquals("PENDING", created.get("status").asText());
        assertNotNull(created.get("qrPayload"));
        assertNotNull(created.get("qrExpiresAt"));

        Thread.sleep(1500);

        JsonNode session = mapper.readTree(
                getPayment(token, created.get("id").asLong()).getBody());
        assertEquals("EXPIRED", session.get("status").asText());
        assertEquals("PENDING_PAYMENT", reservationStatus(reservationId));
    }

    // ------------------------------------------------------------------
    // 6. Reservation của người khác → 403
    // ------------------------------------------------------------------
    @Test
    void foreignReservation_forbidden() throws Exception {
        long reservationId = insertPendingPaymentReservation(LAN);
        String strangerToken = login(TRANG);

        ResponseEntity<String> response = createPayment(strangerToken, Map.of(
                "purpose", "DEPOSIT",
                "reservationId", reservationId,
                "method", "VNPAY"));
        assertEquals(403, response.getStatusCode().value());
    }

    // ------------------------------------------------------------------
    // 7. Request không có amount — server dùng depositAmount chuẩn
    // ------------------------------------------------------------------
    @Test
    void amountComesFromServerQuote() throws Exception {
        String token = login(LAN);
        long reservationId = insertPendingPaymentReservation(LAN);

        JsonNode created = mapper.readTree(createPayment(token, Map.of(
                "purpose", "DEPOSIT",
                "reservationId", reservationId,
                "method", "VNPAY")).getBody());
        assertEquals(DEPOSIT_AMOUNT, created.get("amount").asLong());
        // Request body chỉ có purpose/reservationId/method — không field amount
    }

    // ------------------------------------------------------------------
    // 8. Thanh toán lần 2 → 409 PAYMENT_DUPLICATE, vẫn 1 payment
    // ------------------------------------------------------------------
    @Test
    void duplicatePayment_blocked() throws Exception {
        String token = login(LAN);
        long reservationId = insertPendingPaymentReservation(LAN);

        JsonNode created = mapper.readTree(createPayment(token, Map.of(
                "purpose", "DEPOSIT",
                "reservationId", reservationId,
                "method", "CARD",
                "card", Map.of("number", SUCCESS_CARD,
                        "expiry", "12/28", "cvc", "123"))).getBody());
        Thread.sleep(800);
        getPayment(token, created.get("id").asLong()); // resolve SUCCEEDED

        ResponseEntity<String> second = createPayment(token, Map.of(
                "purpose", "DEPOSIT",
                "reservationId", reservationId,
                "method", "VNPAY"));
        assertEquals(409, second.getStatusCode().value());
        assertEquals("PAYMENT_DUPLICATE",
                mapper.readTree(second.getBody()).get("code").asText());

        assertEquals(1, paymentCount(reservationId));
        assertEquals(1, notificationCount(reservationId));
    }

    // ------------------------------------------------------------------
    // 9. Confirm 2 lần → lần 2 409, handler chỉ chạy 1 lần
    // ------------------------------------------------------------------
    @Test
    void confirmTwice_secondRejected_handlerRunsOnce() throws Exception {
        String token = login(LAN);
        long reservationId = insertPendingPaymentReservation(LAN);

        JsonNode created = mapper.readTree(createPayment(token, Map.of(
                "purpose", "DEPOSIT",
                "reservationId", reservationId,
                "method", "MOMO",
                "momoPhone", "0901234567")).getBody());

        assertEquals(200, confirmPayment(
                token, created.get("id").asLong(), "123456").getStatusCode().value());

        ResponseEntity<String> second = confirmPayment(
                token, created.get("id").asLong(), "123456");
        assertEquals(409, second.getStatusCode().value());
        assertEquals("PAYMENT_INVALID_STATE",
                mapper.readTree(second.getBody()).get("code").asText());

        assertEquals("RESERVED", reservationStatus(reservationId));
        assertEquals(1, notificationCount(reservationId)); // handler 1 lần
    }

    // ------------------------------------------------------------------
    // 10. Reservation sai phase (đã RESERVED) → 409 PAYMENT_INVALID_STATE
    // ------------------------------------------------------------------
    @Test
    void wrongPhase_rejected() throws Exception {
        String token = login(LAN);
        long reservationId = insertReservation(LAN, "RESERVED");

        ResponseEntity<String> response = createPayment(token, Map.of(
                "purpose", "DEPOSIT",
                "reservationId", reservationId,
                "method", "VNPAY"));
        assertEquals(409, response.getStatusCode().value());
        assertEquals("PAYMENT_INVALID_STATE",
                mapper.readTree(response.getBody()).get("code").asText());
    }

    // ------------------------------------------------------------------
    // Helpers
    // ------------------------------------------------------------------

    private String login(String email) throws Exception {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        ResponseEntity<String> response = rest.postForEntity(
                "/api/v1/auth/login",
                new HttpEntity<>(Map.of("email", email, "password", PASSWORD),
                        headers),
                String.class);
        assertEquals(200, response.getStatusCode().value());
        return mapper.readTree(response.getBody()).get("token").asText();
    }

    private ResponseEntity<String> createPayment(
            String token, Map<String, Object> body) {
        HttpHeaders headers = jsonHeaders(token);
        return rest.postForEntity(
                "/api/v1/payments",
                new HttpEntity<>(body, headers),
                String.class);
    }

    private ResponseEntity<String> getPayment(String token, long paymentId) {
        return rest.exchange(
                "/api/v1/payments/" + paymentId,
                org.springframework.http.HttpMethod.GET,
                new HttpEntity<>(authHeaders(token)),
                String.class);
    }

    private ResponseEntity<String> confirmPayment(
            String token, long paymentId, String otp) {
        HttpHeaders headers = jsonHeaders(token);
        return rest.postForEntity(
                "/api/v1/payments/" + paymentId + "/confirm",
                new HttpEntity<>(Map.of("otp", otp), headers),
                String.class);
    }

    private HttpHeaders jsonHeaders(String token) {
        HttpHeaders headers = authHeaders(token);
        headers.setContentType(MediaType.APPLICATION_JSON);
        return headers;
    }

    private HttpHeaders authHeaders(String token) {
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(token);
        return headers;
    }

    /** Chèn reservation mới (code unique) — seed không có PENDING_PAYMENT. */
    private long insertPendingPaymentReservation(String email) {
        return insertReservation(email, "PENDING_PAYMENT");
    }

    private long insertReservation(String email, String status) {
        Long userId = jdbc.queryForObject(
                "SELECT user_id FROM users WHERE email = ?", Long.class, email);
        Long unitId = jdbc.queryForObject(
                "SELECT unit_id FROM units ORDER BY unit_id LIMIT 1", Long.class);
        String code = "BK-T" + System.nanoTime();

        jdbc.update("""
                        INSERT INTO reservations
                            (code, customer_id, unit_id, start_date, end_date,
                             deposit_amount, status, created_at)
                        VALUES (?, ?, ?, DATE_ADD(CURDATE(), INTERVAL 7 DAY),
                                DATE_ADD(DATE_ADD(CURDATE(), INTERVAL 7 DAY),
                                         INTERVAL 3 MONTH), ?, ?, NOW(6))
                        """,
                code, userId, unitId, DEPOSIT_AMOUNT, status);

        long reservationId = jdbc.queryForObject(
                "SELECT reservation_id FROM reservations WHERE code = ?",
                Long.class, code);
        createdReservationIds.add(reservationId);
        return reservationId;
    }

    private String reservationStatus(long reservationId) {
        return jdbc.queryForObject(
                "SELECT status FROM reservations WHERE reservation_id = ?",
                String.class, reservationId);
    }

    private int paymentCount(long reservationId) {
        Integer count = jdbc.queryForObject(
                "SELECT COUNT(*) FROM payments WHERE reservation_id = ?",
                Integer.class, reservationId);
        return count == null ? 0 : count;
    }

    private int notificationCount(long reservationId) {
        Integer count = jdbc.queryForObject(
                "SELECT COUNT(*) FROM notifications WHERE deep_link = ?",
                Integer.class, "/rentals/" + reservationId);
        return count == null ? 0 : count;
    }
}
