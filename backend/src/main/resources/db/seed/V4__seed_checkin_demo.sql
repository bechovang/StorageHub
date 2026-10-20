-- US-15 (FR-11/14/15) — dữ liệu demo check-in: khách Lan đã trả cọc giữ LOCK-1,
-- đến hạn nhận kho HÔM NAY (CURDATE()) nhưng chưa trả rent và chưa ký hợp đồng.
-- Demo flow: staff xem Task Board (task 20 TODO) → khách trả 100% rent qua
-- Payment Modal (CARD 4242... purpose RENT) → staff POST check-in kèm ảnh ký.
-- Mai chạy seed lại thì start_date đã quá hạn → rơi vào nhánh no-show FR-36.

INSERT IGNORE INTO reservations (reservation_id, code, customer_id, unit_id, start_date, end_date,
                          deposit_amount, access_code, status, created_at) VALUES
    (20, 'BK-1046', 1, 12,
        CURDATE(),
        DATE_SUB(DATE_ADD(CURDATE(), INTERVAL 3 MONTH), INTERVAL 1 DAY),
        30000, NULL, 'RESERVED', DATE_SUB(NOW(6), INTERVAL 3 DAY));

INSERT IGNORE INTO payments (payment_id, receipt_code, payer_id, reservation_id, extension_id,
                      settlement_id, purpose, method, amount, status, created_at) VALUES
    (20, 'RT-0880', 1, 20, NULL, NULL, 'DEPOSIT', 'MOMO', 30000, 'SUCCEEDED',
        DATE_SUB(NOW(6), INTERVAL 3 DAY));

-- Shape như auto-draft sinh ra lúc deposit thành công (DRAFT, is_latest).
INSERT IGNORE INTO contracts (contract_id, code, reservation_id, policy_id, content_snapshot,
                       signed_photo_url, status, supersedes_contract_id, is_latest, created_at) VALUES
    (20, 'CT-1046', 20, 2,
     '{"unit":"LOCK-1","term":"3 months","rent":300000,"deposit":30000,"policy":"v3"}',
     NULL, 'DRAFT', NULL, 1, DATE_SUB(NOW(6), INTERVAL 3 DAY));

INSERT IGNORE INTO tasks (task_id, type, ref_code, assigned_staff_id, work_date, status, created_at) VALUES
    (20, 'CHECK_IN', 'BK-1046', 2, CURDATE(), 'TODO', DATE_SUB(NOW(6), INTERVAL 3 DAY));

-- Cột unit đang RESERVED (cọc đã trả giữ chỗ) — check-in sẽ flip RESERVED → RENTED.
UPDATE units SET status = 'RESERVED' WHERE unit_id = 12;
