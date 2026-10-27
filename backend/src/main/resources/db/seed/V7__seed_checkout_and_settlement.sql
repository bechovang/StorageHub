-- ============================================================================
-- StorageHub — Flyway V7 (dev only) — Kịch bản Checkout Request & Tất toán
-- Phục vụ: US-20 (Checkout Request), US-21 (Checkout Task — climax tất toán)
-- Flow: Khách gửi yêu cầu trả kho -> Task Checkout trên Kanban -> Nhân viên
--       chạy checklist tình trạng (Inspections), nhập phí hư hại nếu có ->
--       Tất toán Settlement hoàn cọc hoặc thu thêm.
-- ============================================================================

-- 1. Ca LIVE hôm nay: Trang (user 6) thuê M-1 (BK-1050) yêu cầu trả kho hôm nay (PENDING)
INSERT INTO reservations (reservation_id, code, customer_id, unit_id, start_date, end_date,
                          deposit_amount, access_code, status, created_at) VALUES
    (40, 'BK-1050', 6, 5,
        DATE_SUB(CURDATE(), INTERVAL 30 DAY),
        CURDATE(),
        38000, '739102', 'CHECKOUT_REQUESTED', DATE_SUB(NOW(6), INTERVAL 30 DAY));

INSERT INTO contracts (contract_id, code, reservation_id, policy_id, content_snapshot,
                       signed_photo_url, status, supersedes_contract_id, is_latest, created_at) VALUES
    (40, 'CT-1050', 40, 2,
     '{"unit":"M-1","term":"1 month","rent":380000,"deposit":38000,"policy":"v3"}',
     '/storage/contracts/CT-1050-signed.jpg', 'SIGNED', NULL, 1, DATE_SUB(NOW(6), INTERVAL 30 DAY));

INSERT INTO payments (payment_id, receipt_code, payer_id, reservation_id, extension_id,
                      settlement_id, purpose, method, amount, status, created_at) VALUES
    (40, 'RT-2026-0040', 6, 40, NULL, NULL, 'DEPOSIT', 'MOMO', 38000,  'SUCCEEDED', DATE_SUB(NOW(6), INTERVAL 30 DAY)),
    (41, 'RT-2026-0041', 6, 40, NULL, NULL, 'RENT',    'CARD', 380000, 'SUCCEEDED', DATE_SUB(NOW(6), INTERVAL 30 DAY));

INSERT INTO checkout_requests (request_id, reservation_id, requested_date, status, created_at) VALUES
    (2, 40, CURDATE(), 'PENDING', DATE_SUB(NOW(6), INTERVAL 2 HOUR));

-- Thẻ Checkout TODO hôm nay cho nhân viên Minh trên Kanban
INSERT INTO tasks (task_id, type, ref_code, assigned_staff_id, work_date, status, created_at) VALUES
    (40, 'CHECKOUT', 'BK-1050', 2, CURDATE(), 'TODO', DATE_SUB(NOW(6), INTERVAL 2 HOUR));

-- 2. Ca LỊCH SỬ đã đóng: Hoàng Anh (user 8) thuê LOCK-3 (BK-1055) đã tất toán hoàn cọc tuần trước
INSERT INTO reservations (reservation_id, code, customer_id, unit_id, start_date, end_date,
                          deposit_amount, access_code, status, created_at) VALUES
    (45, 'BK-1055', 8, 14,
        DATE_SUB(CURDATE(), INTERVAL 40 DAY),
        DATE_SUB(CURDATE(), INTERVAL 10 DAY),
        10000, '492019', 'CLOSED', DATE_SUB(NOW(6), INTERVAL 40 DAY));

INSERT INTO contracts (contract_id, code, reservation_id, policy_id, content_snapshot,
                       signed_photo_url, status, supersedes_contract_id, is_latest, created_at) VALUES
    (45, 'CT-1055', 45, 2,
     '{"unit":"LOCK-3","term":"1 month","rent":100000,"deposit":10000,"policy":"v3"}',
     '/storage/contracts/CT-1055-signed.jpg', 'CLOSED', NULL, 1, DATE_SUB(NOW(6), INTERVAL 40 DAY));

INSERT INTO payments (payment_id, receipt_code, payer_id, reservation_id, extension_id,
                      settlement_id, purpose, method, amount, status, created_at) VALUES
    (49, 'RT-2026-0049', 8, 45, NULL, NULL, 'RENT', 'VNPAY', 100000, 'SUCCEEDED', DATE_SUB(NOW(6), INTERVAL 40 DAY));

INSERT INTO checkout_requests (request_id, reservation_id, requested_date, status, created_at) VALUES
    (4, 45, DATE_SUB(CURDATE(), INTERVAL 10 DAY), 'DONE', DATE_SUB(NOW(6), INTERVAL 11 DAY));

INSERT INTO settlements (settlement_id, reservation_id, contract_id, staff_id, damage_fee, damage_reason, refund_amount, receipt_code, created_at) VALUES
    (2, 45, 45, 2, 0, NULL, 10000, 'TL-0045', DATE_SUB(NOW(6), INTERVAL 10 DAY));

INSERT INTO inspections (settlement_id, item, result, note) VALUES
    (2, 'ACCESS_CARD', 'OK', NULL),
    (2, 'PADLOCK',     'OK', NULL),
    (2, 'CLEANLINESS', 'OK', 'Kho sạch sẽ, đúng hiện trạng bàn giao'),
    (2, 'STRUCTURE',   'OK', NULL);

-- Thẻ Checkout đã hoàn tất ở cột DONE
INSERT INTO tasks (task_id, type, ref_code, assigned_staff_id, work_date, status, created_at) VALUES
    (49, 'CHECKOUT', 'BK-1055', 2, CURDATE(), 'DONE', DATE_SUB(NOW(6), INTERVAL 7 HOUR));
