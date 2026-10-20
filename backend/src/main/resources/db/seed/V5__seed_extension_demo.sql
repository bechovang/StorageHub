-- US-18 (FR-16/12) — dữ liệu demo gia hạn:
-- (A) reservation 30 BK-2031 (Lan, S-4): CHECKED_IN, KHÔNG có đơn kế tiếp trên
--     unit → gia hạn tự do. Chọn newEndDate = end + 1 tháng → phí 345.000 ₫
--     + top-up cọc 34.500 ₫ (cọc 34.500 → 69.000) = 379.500 ₫ qua Payment Modal
--     purpose EXTENSION_FEE → EndDate dịch ngay + addendum CT-2031-A1 hẹn ký 7 ngày.

-- ============ KỊCH BẢN A — gia hạn tự do (S-4) ============

INSERT IGNORE INTO reservations (reservation_id, code, customer_id, unit_id, start_date, end_date,
                          deposit_amount, access_code, status, created_at) VALUES
    (30, 'BK-2031', 1, 4,
        DATE_SUB(CURDATE(), INTERVAL 10 DAY),
        DATE_ADD(CURDATE(), INTERVAL 20 DAY),
        34500, '482913', 'CHECKED_IN', DATE_SUB(NOW(6), INTERVAL 10 DAY));

INSERT IGNORE INTO payments (payment_id, receipt_code, payer_id, reservation_id, extension_id,
                      settlement_id, purpose, method, amount, status, created_at) VALUES
    (30, 'RT-2026-0009', 1, 30, NULL, NULL, 'DEPOSIT', 'CARD', 34500, 'SUCCEEDED',
        DATE_SUB(NOW(6), INTERVAL 10 DAY)),
    (31, 'RT-2026-0010', 1, 30, NULL, NULL, 'RENT', 'CARD', 345000, 'SUCCEEDED',
        DATE_SUB(NOW(6), INTERVAL 9 DAY));

-- SIGNED như bản sau khi staff check-in ký và đính ảnh (US-15).
INSERT IGNORE INTO contracts (contract_id, code, reservation_id, policy_id, content_snapshot,
                       signed_photo_url, status, supersedes_contract_id, is_latest, created_at) VALUES
    (30, 'CT-2031', 30, 2,
     '{"unit":"S-4","term":"1 month","rent":345000,"deposit":34500,"policy":"v3"}',
     '/storage/contracts/CT-2031-signed.jpg', 'SIGNED', NULL, 1,
     DATE_SUB(NOW(6), INTERVAL 10 DAY));

UPDATE units SET status = 'RENTED' WHERE unit_id = 4;
