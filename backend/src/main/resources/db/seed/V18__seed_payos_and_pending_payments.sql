-- ============================================================================
-- StorageHub — Flyway V18 (dev only) — Kịch bản PayOS & đơn đã cọc
-- Phục vụ: US-34 (Payment — PayOS gateway thật / AD-9), US-8 (Payment Modal demo)
-- Kịch bản: khách Lan đặt cọc kho M-6 (61 ngày × 8.000 ₫/ngày = 488.000 ₫
-- thuê, cọc 10% = 48.800 ₫ — khớp PricingEngine, ≥ 2.000 ₫ mốc PayOS).
--
-- KHÔNG còn đơn PENDING_PAYMENT: booking draft (TTL 30 phút) là thứ tồn tại
-- trước khi trả cọc, và Reservation chỉ sinh sau khi PayOS SUCCEEDED. Seed này
-- giữ một đơn đã cọc làm ví dụ trạng thái RESERVED/HELD.
-- ============================================================================

INSERT INTO reservations (reservation_id, code, customer_id, unit_id, start_date, end_date,
                          deposit_amount, access_code, status, created_at) VALUES
    (63, 'BK-2043', 1, 18,
        DATE_ADD(CURDATE(), INTERVAL 7 DAY),
        DATE_ADD(CURDATE(), INTERVAL 67 DAY),
        48800, NULL, 'RESERVED', DATE_SUB(NOW(6), INTERVAL 30 MINUTE));

-- Biên lai cọc đã thanh toán — depositStatus = HELD, không có payment chờ.
INSERT INTO payments (payment_id, receipt_code, payer_id, reservation_id, extension_id,
                      settlement_id, purpose, method, amount, status, created_at) VALUES
    (66, 'RT-2026-0066', 1, 63, NULL, NULL, 'DEPOSIT', 'PAYOS', 48800, 'SUCCEEDED', DATE_SUB(NOW(6), INTERVAL 25 MINUTE));
