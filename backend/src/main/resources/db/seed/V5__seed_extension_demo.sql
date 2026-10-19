-- US-18 (FR-16/12) — dữ liệu demo gia hạn:
-- (A) reservation 30 BK-2031 (Lan, S-4): CHECKED_IN, KHÔNG có đơn kế tiếp trên
--     unit → gia hạn tự do. Chọn newEndDate = end + 1 tháng → phí 345.000 ₫
--     + top-up cọc 34.500 ₫ (cọc 34.500 → 69.000) = 379.500 ₫ qua Payment Modal
--     purpose EXTENSION_FEE → EndDate dịch ngay + addendum CT-2031-A1 hẹn ký 7 ngày.
-- (B) reservation 31 BK-2032 (Trang, S-2): CHECKED_IN, unit đã có khách đặt trước
--     (reservation 32 BK-2033 bắt đầu CURDATE()+25) → latestNewCheckout =
--     CURDATE()+24. newEndDate vượt mốc → 409 "Latest new checkout: ...".

-- ============ KỊCH BẢN A — gia hạn tự do (S-4) ============

INSERT INTO reservations (reservation_id, code, customer_id, unit_id, start_date, end_date,
                          deposit_amount, access_code, status, created_at) VALUES
    (30, 'BK-2031', 1, 4,
        DATE_SUB(CURDATE(), INTERVAL 10 DAY),
        DATE_ADD(CURDATE(), INTERVAL 20 DAY),
        34500, '482913', 'CHECKED_IN', DATE_SUB(NOW(6), INTERVAL 10 DAY));

INSERT INTO payments (payment_id, receipt_code, payer_id, reservation_id, extension_id,
                      settlement_id, purpose, method, amount, status, created_at) VALUES
    (30, 'RT-2026-0009', 1, 30, NULL, NULL, 'DEPOSIT', 'CARD', 34500, 'SUCCEEDED',
        DATE_SUB(NOW(6), INTERVAL 10 DAY)),
    (31, 'RT-2026-0010', 1, 30, NULL, NULL, 'RENT', 'CARD', 345000, 'SUCCEEDED',
        DATE_SUB(NOW(6), INTERVAL 9 DAY));

-- SIGNED như bản sau khi staff check-in ký và đính ảnh (US-15).
INSERT INTO contracts (contract_id, code, reservation_id, policy_id, content_snapshot,
                       signed_photo_url, status, supersedes_contract_id, is_latest, created_at) VALUES
    (30, 'CT-2031', 30, 2,
     '{"unit":"S-4","term":"1 month","rent":345000,"deposit":34500,"policy":"v3"}',
     '/storage/contracts/CT-2031-signed.jpg', 'SIGNED', NULL, 1,
     DATE_SUB(NOW(6), INTERVAL 10 DAY));

UPDATE units SET status = 'RENTED' WHERE unit_id = 4;

-- ============ KỊCH BẢN B — boundary với đơn kế tiếp (S-2) ============

INSERT INTO reservations (reservation_id, code, customer_id, unit_id, start_date, end_date,
                          deposit_amount, access_code, status, created_at) VALUES
    (31, 'BK-2032', 6, 2,
        DATE_SUB(CURDATE(), INTERVAL 10 DAY),
        DATE_ADD(CURDATE(), INTERVAL 20 DAY),
        34500, '517306', 'CHECKED_IN', DATE_SUB(NOW(6), INTERVAL 10 DAY)),
    (32, 'BK-2033', 1, 2,
        DATE_ADD(CURDATE(), INTERVAL 25 DAY),
        DATE_ADD(CURDATE(), INTERVAL 55 DAY),
        34500, NULL, 'RESERVED', DATE_SUB(NOW(6), INTERVAL 5 DAY));

INSERT INTO payments (payment_id, receipt_code, payer_id, reservation_id, extension_id,
                      settlement_id, purpose, method, amount, status, created_at) VALUES
    (32, 'RT-2026-0011', 6, 31, NULL, NULL, 'DEPOSIT', 'CARD', 34500, 'SUCCEEDED',
        DATE_SUB(NOW(6), INTERVAL 10 DAY)),
    (33, 'RT-2026-0012', 6, 31, NULL, NULL, 'RENT', 'CARD', 345000, 'SUCCEEDED',
        DATE_SUB(NOW(6), INTERVAL 9 DAY)),
    (34, 'RT-2026-0013', 1, 32, NULL, NULL, 'DEPOSIT', 'MOMO', 34500, 'SUCCEEDED',
        DATE_SUB(NOW(6), INTERVAL 5 DAY));

INSERT INTO contracts (contract_id, code, reservation_id, policy_id, content_snapshot,
                       signed_photo_url, status, supersedes_contract_id, is_latest, created_at) VALUES
    (31, 'CT-2032', 31, 2,
     '{"unit":"S-2","term":"1 month","rent":345000,"deposit":34500,"policy":"v3"}',
     '/storage/contracts/CT-2032-signed.jpg', 'SIGNED', NULL, 1,
     DATE_SUB(NOW(6), INTERVAL 10 DAY)),
    (32, 'CT-2033', 32, 2,
     '{"unit":"S-2","term":"1 month","rent":345000,"deposit":34500,"policy":"v3"}',
     NULL, 'DRAFT', NULL, 1, DATE_SUB(NOW(6), INTERVAL 5 DAY));

-- Unit 2 bị đơn kế tiếp (BK-2033) giữ chỗ từ CURDATE()+25 — boundary chặt.
UPDATE units SET status = 'RESERVED' WHERE unit_id = 2;
