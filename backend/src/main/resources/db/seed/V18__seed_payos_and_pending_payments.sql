-- ============================================================================
-- StorageHub — Flyway V18 (dev only) — Kịch bản Cổng thanh toán PayOS & Trạng thái Đang chờ
-- Phục vụ: US-34 (Payment — PayOS gateway thật / AD-9), US-8 (Payment Modal demo)
-- Kịch bản:
--   1. Giao dịch PayOS thật (RT-2026-PAYOS): Khách Lan đặt cọc kho M-6, đang ở trạng thái
--      PENDING để mở modal quét mã VietQR PayOS thật.
--   2. Giao dịch PROCESSING: Đang giả lập chờ xác nhận ngân hàng.
--   3. Giao dịch EXPIRED: Mã QR hết hạn sau 5 phút (theo AD-9) để test nhánh timeout.
-- ============================================================================

-- Đơn đặt chỗ M-6 đang chờ thanh toán cọc (PENDING_PAYMENT)
INSERT INTO reservations (reservation_id, code, customer_id, unit_id, start_date, end_date,
                          deposit_amount, access_code, status, created_at) VALUES
    (63, 'BK-2043', 1, 18,
        DATE_ADD(CURDATE(), INTERVAL 7 DAY),
        DATE_ADD(CURDATE(), INTERVAL 67 DAY),
        40000, NULL, 'PENDING_PAYMENT', DATE_SUB(NOW(6), INTERVAL 30 MINUTE));

-- Các giao dịch thanh toán minh họa trọn bộ trạng thái Payment (PENDING, PROCESSING, EXPIRED):
INSERT INTO payments (payment_id, receipt_code, payer_id, reservation_id, extension_id,
                      settlement_id, purpose, method, amount, status, created_at) VALUES
    -- 1. Giao dịch PayOS thật đang PENDING (chờ quét mã QR VietQR)
    (64, 'RT-2026-PAYOS', 1, 63, NULL, NULL, 'DEPOSIT', 'PAYOS', 40000,  'PENDING',    DATE_SUB(NOW(6), INTERVAL 20 MINUTE)),

    -- 2. Giao dịch giả lập đang PROCESSING (hiển thị spinner đang kiểm tra)
    (65, 'RT-2026-PROC',  1, 63, NULL, NULL, 'DEPOSIT', 'CARD',  40000,  'PROCESSING', DATE_SUB(NOW(6), INTERVAL 10 MINUTE)),

    -- 3. Giao dịch quá hạn thanh toán EXPIRED (quá 5 phút theo AD-9)
    (66, 'RT-2026-EXPR',  1, 63, NULL, NULL, 'DEPOSIT', 'VNPAY', 40000,  'EXPIRED',    DATE_SUB(NOW(6), INTERVAL 40 MINUTE));
