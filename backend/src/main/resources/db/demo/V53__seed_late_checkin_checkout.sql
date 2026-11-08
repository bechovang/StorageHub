-- ============================================================================
-- V53 (demo profile only) — Kịch bản check-in trễ / no-show / checkout trễ
-- Chạy sau V52 (late fee percent) trên môi trường demo. Không chạy prod.
-- TB type 1 = 30.000 ₫/ngày; staff TB = user 5; manager TB = user 2.
-- ============================================================================

-- 1. Check-in trễ 2 ngày (trong grace 3 ngày)
INSERT INTO reservations (reservation_id, code, customer_id, unit_id, policy_id,
                          start_date, end_date, deposit_amount, access_code, status, created_at) VALUES
    (7001, 'BK-7001', 17, 1, 1,
        DATE_SUB(CURDATE(), INTERVAL 2 DAY),
        DATE_ADD(CURDATE(), INTERVAL 27 DAY),
        90000, NULL, 'RESERVED', DATE_SUB(NOW(6), INTERVAL 4 DAY));

INSERT INTO contracts (contract_id, code, reservation_id, policy_id, content_snapshot,
                       signed_photo_url, status, supersedes_contract_id, is_latest, created_at) VALUES
    (7001, 'CT-7001', 7001, 1,
     '{"unit":"TB-1A-01","term":"30 days","rent":900000,"deposit":90000,"policy":"v4"}',
     NULL, 'DRAFT', NULL, 1, DATE_SUB(NOW(6), INTERVAL 4 DAY));

INSERT INTO payments (payment_id, receipt_code, payer_id, reservation_id, purpose, method,
                      amount, status, created_at) VALUES
    (7001, 'RT-7001-DEP', 17, 7001, 'DEPOSIT', 'MOMO', 90000, 'SUCCEEDED', DATE_SUB(NOW(6), INTERVAL 4 DAY));

INSERT INTO tasks (task_id, type, ref_code, assigned_staff_id, shift, unit_type_id, facility_id,
                   work_date, expires_on, status, created_at) VALUES
    (7001, 'CHECK_IN', 'BK-7001', 5, 'MORNING', 1, 1,
        CURDATE(), DATE_ADD(DATE_SUB(CURDATE(), INTERVAL 2 DAY), INTERVAL 3 DAY),
        'TODO', DATE_SUB(NOW(6), INTERVAL 4 DAY));

UPDATE units SET status = 'RESERVED' WHERE unit_id = 1;

-- 2. No-show quá 3 ngày (task hết hạn -> EXPIRED, mất cọc)
INSERT INTO reservations (reservation_id, code, customer_id, unit_id, policy_id,
                          start_date, end_date, deposit_amount, access_code, status, created_at) VALUES
    (7002, 'BK-7002', 18, 2, 1,
        DATE_SUB(CURDATE(), INTERVAL 5 DAY),
        DATE_ADD(CURDATE(), INTERVAL 24 DAY),
        90000, NULL, 'RESERVED', DATE_SUB(NOW(6), INTERVAL 7 DAY));

INSERT INTO contracts (contract_id, code, reservation_id, policy_id, content_snapshot,
                       signed_photo_url, status, supersedes_contract_id, is_latest, created_at) VALUES
    (7002, 'CT-7002', 7002, 1,
     '{"unit":"TB-1A-02","term":"30 days","rent":900000,"deposit":90000,"policy":"v4"}',
     NULL, 'DRAFT', NULL, 1, DATE_SUB(NOW(6), INTERVAL 7 DAY));

INSERT INTO payments (payment_id, receipt_code, payer_id, reservation_id, purpose, method,
                      amount, status, created_at) VALUES
    (7002, 'RT-7002-DEP', 18, 7002, 'DEPOSIT', 'VNPAY', 90000, 'SUCCEEDED', DATE_SUB(NOW(6), INTERVAL 7 DAY));

INSERT INTO tasks (task_id, type, ref_code, assigned_staff_id, shift, unit_type_id, facility_id,
                   work_date, expires_on, status, created_at) VALUES
    (7002, 'CHECK_IN', 'BK-7002', 5, 'MORNING', 1, 1,
        CURDATE(), DATE_SUB(CURDATE(), INTERVAL 2 DAY),
        'TODO', DATE_SUB(NOW(6), INTERVAL 7 DAY));

UPDATE units SET status = 'RESERVED' WHERE unit_id = 2;

-- 3. Checkout trễ 2 ngày (trong ngưỡng 3 ngày, staff tất toán được)
INSERT INTO reservations (reservation_id, code, customer_id, unit_id, policy_id,
                          start_date, end_date, deposit_amount, access_code, status, created_at) VALUES
    (7003, 'BK-7003', 19, 3, 1,
        DATE_SUB(CURDATE(), INTERVAL 30 DAY),
        DATE_SUB(CURDATE(), INTERVAL 2 DAY),
        87000, '445566', 'CHECKOUT_REQUESTED', DATE_SUB(NOW(6), INTERVAL 30 DAY));

INSERT INTO contracts (contract_id, code, reservation_id, policy_id, content_snapshot,
                       signed_photo_url, status, supersedes_contract_id, is_latest, created_at) VALUES
    (7003, 'CT-7003', 7003, 1,
     '{"unit":"TB-1A-03","term":"29 days","rent":870000,"deposit":87000,"policy":"v4"}',
     '/storage/contracts/CT-7003-signed.jpg', 'SIGNED', NULL, 1, DATE_SUB(NOW(6), INTERVAL 30 DAY));

INSERT INTO payments (payment_id, receipt_code, payer_id, reservation_id, purpose, method,
                      amount, status, created_at) VALUES
    (7003, 'RT-7003-DEP', 19, 7003, 'DEPOSIT', 'MOMO', 87000, 'SUCCEEDED', DATE_SUB(NOW(6), INTERVAL 30 DAY)),
    (7004, 'RT-7003-RENT', 19, 7003, 'RENT', 'CARD', 870000, 'SUCCEEDED', DATE_SUB(NOW(6), INTERVAL 30 DAY));

INSERT INTO checkout_requests (request_id, reservation_id, requested_date, time_slot, status,
                               checkout_type, reason, created_at) VALUES
    (7003, 7003, CURDATE(), 'MORNING', 'PENDING', 'NORMAL', NULL, DATE_SUB(NOW(6), INTERVAL 4 HOUR));

INSERT INTO tasks (task_id, type, ref_code, assigned_staff_id, shift, unit_type_id, facility_id,
                   work_date, expires_on, status, created_at) VALUES
    (7003, 'CHECKOUT', 'BK-7003', 5, 'MORNING', 1, 1,
        CURDATE(), NULL, 'TODO', DATE_SUB(NOW(6), INTERVAL 4 HOUR));

UPDATE units SET status = 'RENTED' WHERE unit_id = 3;

-- 4. Checkout trễ 5 ngày (quá ngưỡng -> PENDING_MANAGER)
INSERT INTO reservations (reservation_id, code, customer_id, unit_id, policy_id,
                          start_date, end_date, deposit_amount, access_code, status, created_at) VALUES
    (7004, 'BK-7004', 20, 4, 1,
        DATE_SUB(CURDATE(), INTERVAL 32 DAY),
        DATE_SUB(CURDATE(), INTERVAL 5 DAY),
        84000, '778899', 'CHECKOUT_REQUESTED', DATE_SUB(NOW(6), INTERVAL 32 DAY));

INSERT INTO contracts (contract_id, code, reservation_id, policy_id, content_snapshot,
                       signed_photo_url, status, supersedes_contract_id, is_latest, created_at) VALUES
    (7004, 'CT-7004', 7004, 1,
     '{"unit":"TB-1A-04","term":"28 days","rent":840000,"deposit":84000,"policy":"v4"}',
     '/storage/contracts/CT-7004-signed.jpg', 'SIGNED', NULL, 1, DATE_SUB(NOW(6), INTERVAL 32 DAY));

INSERT INTO payments (payment_id, receipt_code, payer_id, reservation_id, purpose, method,
                      amount, status, created_at) VALUES
    (7005, 'RT-7004-DEP', 20, 7004, 'DEPOSIT', 'MOMO', 84000, 'SUCCEEDED', DATE_SUB(NOW(6), INTERVAL 32 DAY)),
    (7006, 'RT-7004-RENT', 20, 7004, 'RENT', 'CARD', 840000, 'SUCCEEDED', DATE_SUB(NOW(6), INTERVAL 32 DAY));

INSERT INTO checkout_requests (request_id, reservation_id, requested_date, time_slot, status,
                               checkout_type, reason, created_at) VALUES
    (7004, 7004, CURDATE(), 'MORNING', 'PENDING', 'NORMAL', NULL, DATE_SUB(NOW(6), INTERVAL 6 HOUR));

INSERT INTO tasks (task_id, type, ref_code, assigned_staff_id, shift, unit_type_id, facility_id,
                   work_date, expires_on, status, created_at) VALUES
    (7004, 'CHECKOUT', 'BK-7004', 5, 'MORNING', 1, 1,
        CURDATE(), NULL, 'TODO', DATE_SUB(NOW(6), INTERVAL 6 HOUR));

UPDATE units SET status = 'RENTED' WHERE unit_id = 4;

-- 5. Contract/gia hạn trễ 2 ngày
INSERT INTO reservations (reservation_id, code, customer_id, unit_id, policy_id,
                          start_date, end_date, deposit_amount, access_code, status, created_at) VALUES
    (7005, 'BK-7005', 17, 5, 1,
        DATE_SUB(CURDATE(), INTERVAL 60 DAY),
        DATE_ADD(CURDATE(), INTERVAL 27 DAY),
        174000, '112233', 'CHECKED_IN', DATE_SUB(NOW(6), INTERVAL 60 DAY));

INSERT INTO contracts (contract_id, code, reservation_id, policy_id, content_snapshot,
                       signed_photo_url, status, supersedes_contract_id, is_latest, created_at) VALUES
    (7005, 'CT-7005', 7005, 1,
     '{"unit":"TB-1A-05","term":"88 days","rent":2640000,"deposit":174000,"policy":"v4"}',
     '/storage/contracts/CT-7005-signed.jpg', 'SIGNED', NULL, 1, DATE_SUB(NOW(6), INTERVAL 60 DAY));

INSERT INTO payments (payment_id, receipt_code, payer_id, reservation_id, purpose, method,
                      amount, status, created_at) VALUES
    (7007, 'RT-7005-DEP', 17, 7005, 'DEPOSIT', 'MOMO', 174000, 'SUCCEEDED', DATE_SUB(NOW(6), INTERVAL 60 DAY)),
    (7008, 'RT-7005-RENT', 17, 7005, 'RENT', 'CARD', 1740000, 'SUCCEEDED', DATE_SUB(NOW(6), INTERVAL 60 DAY));

INSERT INTO extensions (extension_id, reservation_id, policy_id, old_end_date, new_end_date,
                        old_deposit, new_deposit, extension_fee, status, created_at) VALUES
    (7005, 7005, 1,
        DATE_SUB(CURDATE(), INTERVAL 3 DAY),
        DATE_ADD(CURDATE(), INTERVAL 27 DAY),
        174000, 174000, 900000, 'PENDING_CONTRACT', DATE_SUB(NOW(6), INTERVAL 4 DAY));

INSERT INTO contract_addendums (addendum_id, contract_id, policy_id, extension_id, code,
                                content_snapshot, signed_photo_url, signature_due_date, status, created_at) VALUES
    (7005, 7005, 1, 7005, 'CT-7005-A1',
     '{"change":"extend 30 days","extension_fee":900000,"deposit_held":174000,"policy":"v4"}',
     NULL, DATE_ADD(CURDATE(), INTERVAL 5 DAY), 'AWAITING_SIGNATURE', DATE_SUB(NOW(6), INTERVAL 4 DAY));

INSERT INTO tasks (task_id, type, ref_code, assigned_staff_id, shift, unit_type_id, facility_id,
                   note, work_date, expires_on, status, created_at) VALUES
    (7005, 'CONTRACT', 'CT-7005-A1', 5, 'MORNING', 1, 1,
        'Hạn ký phụ lục: ngày thứ 7 sau khi tạo',
        CURDATE(), DATE_ADD(DATE_SUB(CURDATE(), INTERVAL 3 DAY), INTERVAL 4 DAY),
        'TODO', DATE_SUB(NOW(6), INTERVAL 4 DAY));

UPDATE units SET status = 'RENTED' WHERE unit_id = 5;
