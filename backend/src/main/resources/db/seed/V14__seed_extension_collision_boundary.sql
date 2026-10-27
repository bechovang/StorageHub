-- ============================================================================
-- StorageHub — Flyway V14 (dev only) — Kịch bản Chặn gia hạn do trùng đơn kế tiếp
-- Phục vụ: US-18 (Extension + conflict boundary / FR-16/12 / UJ-1)
-- Kịch bản: Khách Hoàng Anh (user 8) đang thuê kho S-6 (BK-2040) sắp hết hạn sau 10 ngày.
--           Khách Bảo Ngọc (user 9) đã đặt cọc giữ chỗ kho S-6 (BK-2041) bắt đầu sau 25 ngày.
--           Khi Hoàng Anh vào gia hạn muốn chọn +2 tháng -> Hệ thống tính Turnover Buffer (1 ngày)
--           và CHẶN LẠI kèm thông báo rõ ngày tối đa được phép: "Latest new checkout: CURDATE() + 24 ngày".
-- ============================================================================

-- Cập nhật kho S-6 sang RENTED
UPDATE units SET status = 'RENTED' WHERE unit_id = 17;

-- 1. Đơn thuê hiện tại BK-2040 của Hoàng Anh trên kho S-6 (hết hạn sau 10 ngày)
INSERT INTO reservations (reservation_id, code, customer_id, unit_id, start_date, end_date,
                          deposit_amount, access_code, status, created_at) VALUES
    (60, 'BK-2040', 8, 17,
        DATE_SUB(CURDATE(), INTERVAL 20 DAY),
        DATE_ADD(CURDATE(), INTERVAL 10 DAY),
        34500, '672910', 'CHECKED_IN', DATE_SUB(NOW(6), INTERVAL 20 DAY));

INSERT INTO contracts (contract_id, code, reservation_id, policy_id, content_snapshot,
                       signed_photo_url, status, supersedes_contract_id, is_latest, created_at) VALUES
    (60, 'CT-2040', 60, 2,
     '{"unit":"S-6","term":"1 month","rent":345000,"deposit":34500,"policy":"v3"}',
     '/storage/contracts/CT-2040-signed.jpg', 'SIGNED', NULL, 1, DATE_SUB(NOW(6), INTERVAL 20 DAY));

INSERT INTO payments (payment_id, receipt_code, payer_id, reservation_id, extension_id,
                      settlement_id, purpose, method, amount, status, created_at) VALUES
    (60, 'RT-2026-0060', 8, 60, NULL, NULL, 'DEPOSIT', 'CARD', 34500,  'SUCCEEDED', DATE_SUB(NOW(6), INTERVAL 20 DAY)),
    (61, 'RT-2026-0061', 8, 60, NULL, NULL, 'RENT',    'CARD', 345000, 'SUCCEEDED', DATE_SUB(NOW(6), INTERVAL 20 DAY));

-- 2. Đơn đặt chỗ kế tiếp BK-2041 của Bảo Ngọc trên cùng kho S-6 (bắt đầu sau 25 ngày)
-- Chính đơn này tạo ra conflict boundary chặn Hoàng Anh không được gia hạn quá ngày (CURDATE + 24)
INSERT INTO reservations (reservation_id, code, customer_id, unit_id, start_date, end_date,
                          deposit_amount, access_code, status, created_at) VALUES
    (61, 'BK-2041', 9, 17,
        DATE_ADD(CURDATE(), INTERVAL 25 DAY),
        DATE_ADD(CURDATE(), INTERVAL 85 DAY),
        34500, NULL, 'RESERVED', DATE_SUB(NOW(6), INTERVAL 2 DAY));

INSERT INTO contracts (contract_id, code, reservation_id, policy_id, content_snapshot,
                       signed_photo_url, status, supersedes_contract_id, is_latest, created_at) VALUES
    (61, 'CT-2041', 61, 2,
     '{"unit":"S-6","term":"2 months","rent":690000,"deposit":34500,"policy":"v3"}',
     NULL, 'DRAFT', NULL, 1, DATE_SUB(NOW(6), INTERVAL 2 DAY));

INSERT INTO payments (payment_id, receipt_code, payer_id, reservation_id, extension_id,
                      settlement_id, purpose, method, amount, status, created_at) VALUES
    (62, 'RT-2026-0062', 9, 61, NULL, NULL, 'DEPOSIT', 'MOMO', 34500, 'SUCCEEDED', DATE_SUB(NOW(6), INTERVAL 2 DAY));
