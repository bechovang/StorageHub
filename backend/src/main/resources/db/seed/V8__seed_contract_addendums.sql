-- ============================================================================
-- StorageHub — Flyway V8 (dev only) — Kịch bản Phụ lục hợp đồng & Thẻ ký giấy
-- Phục vụ: US-19 (Addendum giấy + Contract-signature card trên Kanban)
-- Flow: Gia hạn kho -> Tự sinh Addendum CT-..-A1 (AWAITING_SIGNATURE) ->
--       Hẹn ký tại quầy 7 ngày -> Nhân viên mở thẻ Contract trên Kanban
--       để upload ảnh bản ký -> Addendum chuyển SIGNED -> Thẻ chuyển DONE.
-- ============================================================================

-- 1. Hợp đồng CT-1051 của Hoàng Anh (L-1): đã gia hạn và đã ký phụ lục (SIGNED)
INSERT INTO reservations (reservation_id, code, customer_id, unit_id, start_date, end_date,
                          deposit_amount, access_code, status, created_at) VALUES
    (41, 'BK-1051', 8, 10,
        DATE_SUB(CURDATE(), INTERVAL 45 DAY),
        DATE_ADD(CURDATE(), INTERVAL 45 DAY),
        89000, '829401', 'CHECKED_IN', DATE_SUB(NOW(6), INTERVAL 45 DAY));

INSERT INTO contracts (contract_id, code, reservation_id, policy_id, content_snapshot,
                       signed_photo_url, status, supersedes_contract_id, is_latest, created_at) VALUES
    (41, 'CT-1051', 41, 2,
     '{"unit":"L-1","term":"3 months","rent":2670000,"deposit":89000,"policy":"v3"}',
     '/storage/contracts/CT-1051-signed.jpg', 'SIGNED', NULL, 1, DATE_SUB(NOW(6), INTERVAL 45 DAY));

INSERT INTO payments (payment_id, receipt_code, payer_id, reservation_id, extension_id,
                      settlement_id, purpose, method, amount, status, created_at) VALUES
    (42, 'RT-2026-0042', 8, 41, NULL, NULL, 'DEPOSIT', 'VNPAY', 89000,   'SUCCEEDED', DATE_SUB(NOW(6), INTERVAL 45 DAY)),
    (43, 'RT-2026-0043', 8, 41, NULL, NULL, 'RENT',    'CARD',  2670000, 'SUCCEEDED', DATE_SUB(NOW(6), INTERVAL 45 DAY));

INSERT INTO contract_addendums (addendum_id, contract_id, extension_id, code, content_snapshot,
                                signed_photo_url, signature_due_date, status, created_at) VALUES
    (3, 41, NULL, 'CT-1051-A1',
     '{"change":"extend +1 month","extension_fee":890000,"deposit_topup":0,"policy":"v3"}',
     '/storage/contracts/CT-1051-A1-signed.jpg', DATE_SUB(CURDATE(), INTERVAL 5 DAY), 'SIGNED', DATE_SUB(NOW(6), INTERVAL 15 DAY));

-- Thẻ Contract đã hoàn tất (DONE)
INSERT INTO tasks (task_id, type, ref_code, assigned_staff_id, work_date, status, created_at) VALUES
    (51, 'CONTRACT', 'CT-1051-A1', 2, CURDATE(), 'DONE', DATE_SUB(NOW(6), INTERVAL 1 DAY));

-- 2. Hợp đồng CT-1052 của Bảo Ngọc (S-2): đang trong quá trình đối chiếu ký (IN_PROGRESS)
INSERT INTO reservations (reservation_id, code, customer_id, unit_id, start_date, end_date,
                          deposit_amount, access_code, status, created_at) VALUES
    (42, 'BK-1052', 9, 2,
        DATE_SUB(CURDATE(), INTERVAL 20 DAY),
        DATE_ADD(CURDATE(), INTERVAL 40 DAY),
        34500, '918273', 'CHECKED_IN', DATE_SUB(NOW(6), INTERVAL 20 DAY));

INSERT INTO contracts (contract_id, code, reservation_id, policy_id, content_snapshot,
                       signed_photo_url, status, supersedes_contract_id, is_latest, created_at) VALUES
    (42, 'CT-1052', 42, 2,
     '{"unit":"S-2","term":"2 months","rent":690000,"deposit":34500,"policy":"v3"}',
     '/storage/contracts/CT-1052-signed.jpg', 'SIGNED', NULL, 1, DATE_SUB(NOW(6), INTERVAL 20 DAY));

INSERT INTO payments (payment_id, receipt_code, payer_id, reservation_id, extension_id,
                      settlement_id, purpose, method, amount, status, created_at) VALUES
    (44, 'RT-2026-0044', 9, 42, NULL, NULL, 'DEPOSIT', 'MOMO', 34500,  'SUCCEEDED', DATE_SUB(NOW(6), INTERVAL 20 DAY)),
    (45, 'RT-2026-0045', 9, 42, NULL, NULL, 'RENT',    'CARD', 690000, 'SUCCEEDED', DATE_SUB(NOW(6), INTERVAL 20 DAY));

INSERT INTO contract_addendums (addendum_id, contract_id, extension_id, code, content_snapshot,
                                signed_photo_url, signature_due_date, status, created_at) VALUES
    (4, 42, NULL, 'CT-1052-A1',
     '{"change":"extend +1 month","extension_fee":345000,"deposit_topup":34500,"policy":"v3"}',
     NULL, DATE_ADD(CURDATE(), INTERVAL 3 DAY), 'AWAITING_SIGNATURE', DATE_SUB(NOW(6), INTERVAL 2 DAY));

-- Thẻ Contract đang xử lý tại quầy (IN_PROGRESS)
INSERT INTO tasks (task_id, type, ref_code, assigned_staff_id, work_date, status, created_at) VALUES
    (47, 'CONTRACT', 'CT-1052-A1', 10, CURDATE(), 'IN_PROGRESS', DATE_SUB(NOW(6), INTERVAL 2 HOUR));

-- 3. Phụ lục CT-2031-A1 của Lan (S-4 ở V5): đang chờ khách đến ký (TODO)
INSERT INTO contract_addendums (addendum_id, contract_id, extension_id, code, content_snapshot,
                                signed_photo_url, signature_due_date, status, created_at) VALUES
    (2, 30, NULL, 'CT-2031-A1',
     '{"change":"extend +1 month","extension_fee":345000,"deposit_topup":34500,"deposit_held":69000,"policy":"v3"}',
     NULL, DATE_ADD(CURDATE(), INTERVAL 7 DAY), 'AWAITING_SIGNATURE', DATE_SUB(NOW(6), INTERVAL 1 DAY));

-- Thẻ Contract chờ xử lý (TODO)
INSERT INTO tasks (task_id, type, ref_code, assigned_staff_id, work_date, status, created_at) VALUES
    (43, 'CONTRACT', 'CT-2031-A1', 2, CURDATE(), 'TODO', DATE_SUB(NOW(6), INTERVAL 1 DAY));
