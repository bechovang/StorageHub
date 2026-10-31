-- ============================================================================
-- StorageHub — Flyway V18 (dev only) — Kịch bản Cổng thanh toán PayOS & Trạng thái Đang chờ
-- Phục vụ: US-34 (Payment — PayOS gateway thật / AD-9), US-8 (Payment Modal demo)
-- Kịch bản: khách Lan đặt cọc kho M-6 (61 ngày × 8.000 ₫/ngày = 488.000 ₫
-- thuê, cọc 10% = 48.800 ₫ — khớp PricingEngine, ≥ 2.000 ₫ mốc PayOS).
-- Đơn ở PENDING_PAYMENT: mở Payment Modal sẽ tạo payment PayOS thật để quét QR
-- (hoặc bấm "Bỏ qua thanh toán (Demo)" ở môi trường dev).
-- ============================================================================

-- Đơn đặt chỗ M-6 đang chờ thanh toán cọc (PENDING_PAYMENT)
INSERT INTO reservations (reservation_id, code, customer_id, unit_id, start_date, end_date,
                          deposit_amount, access_code, status, created_at) VALUES
    (63, 'BK-2043', 1, 18,
        DATE_ADD(CURDATE(), INTERVAL 7 DAY),
        DATE_ADD(CURDATE(), INTERVAL 67 DAY),
        48800, NULL, 'PENDING_PAYMENT', DATE_SUB(NOW(6), INTERVAL 30 MINUTE));

-- Các giao dịch thanh toán minh họa trọn bộ trạng thái Payment (PENDING, PROCESSING, EXPIRED):
-- LƯU Ý: KHÔNG seed payment DEPOSIT ở trạng thái PENDING/PROCESSING cho đơn
-- này — BE chặn tạo payment trùng khi còn payment "sống" (409
-- PAYMENT_DUPLICATE), sẽ làm FE không tạo được phiên PayOS mới. Chỉ seed
-- một bản EXPIRED (terminal) làm ví dụ lịch sử QR hết hạn.
INSERT INTO payments (payment_id, receipt_code, payer_id, reservation_id, extension_id,
                      settlement_id, purpose, method, amount, status, created_at) VALUES
    (66, 'RT-2026-0066', 1, 63, NULL, NULL, 'DEPOSIT', 'PAYOS', 48800, 'EXPIRED', DATE_SUB(NOW(6), INTERVAL 40 MINUTE));
