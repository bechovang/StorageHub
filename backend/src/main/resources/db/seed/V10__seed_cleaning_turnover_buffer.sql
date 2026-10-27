-- ============================================================================
-- StorageHub — Flyway V10 (dev only) — Kịch bản Vệ sinh kho & Turnover Buffer
-- Phục vụ: US-22 (Cleaning + Turnover buffer / FR-19), US-15 (Check-in IN_PROGRESS)
-- Flow: Kho sau bảo trì / sau checkout chuyển PREPARING -> Thẻ Cleaning xuất hiện
--       trên Kanban -> Nhân viên bấm hoàn tất trực tiếp trên thẻ -> Thẻ chuyển DONE,
--       kho chờ hết thời gian đệm Turnover Buffer (1 ngày) để về AVAILABLE.
-- ============================================================================

-- 1. Thẻ vệ sinh kho M-4 đang chờ thực hiện (TODO)
INSERT INTO tasks (task_id, type, ref_code, assigned_staff_id, work_date, status, created_at) VALUES
    (42, 'CLEANING', 'M-4', 2, CURDATE(), 'TODO', DATE_SUB(NOW(6), INTERVAL 5 HOUR));

-- 2. Thẻ vệ sinh kho S-1 đã dọn dẹp xong (DONE)
INSERT INTO tasks (task_id, type, ref_code, assigned_staff_id, work_date, status, created_at) VALUES
    (50, 'CLEANING', 'S-1', 10, CURDATE(), 'DONE', DATE_SUB(NOW(6), INTERVAL 8 HOUR));

-- 3. Đơn nhận kho BK-1053 của Lan: đang tiến hành nhận kho tại quầy (IN_PROGRESS)
INSERT INTO reservations (reservation_id, code, customer_id, unit_id, start_date, end_date,
                          deposit_amount, access_code, status, created_at) VALUES
    (43, 'BK-1053', 1, 7,
        CURDATE(),
        DATE_ADD(CURDATE(), INTERVAL 60 DAY),
        38000, NULL, 'RESERVED', DATE_SUB(NOW(6), INTERVAL 2 DAY));

INSERT INTO contracts (contract_id, code, reservation_id, policy_id, content_snapshot,
                       signed_photo_url, status, supersedes_contract_id, is_latest, created_at) VALUES
    (43, 'CT-1053', 43, 2,
     '{"unit":"M-3","term":"2 months","rent":760000,"deposit":38000,"policy":"v3"}',
     NULL, 'DRAFT', NULL, 1, DATE_SUB(NOW(6), INTERVAL 2 DAY));

INSERT INTO payments (payment_id, receipt_code, payer_id, reservation_id, extension_id,
                      settlement_id, purpose, method, amount, status, created_at) VALUES
    (46, 'RT-2026-0046', 1, 43, NULL, NULL, 'DEPOSIT', 'CARD', 38000, 'SUCCEEDED', DATE_SUB(NOW(6), INTERVAL 2 DAY));

-- Thẻ Check-in đang làm việc trên Kanban (IN_PROGRESS)
INSERT INTO tasks (task_id, type, ref_code, assigned_staff_id, work_date, status, created_at) VALUES
    (46, 'CHECK_IN', 'BK-1053', 2, CURDATE(), 'IN_PROGRESS', DATE_SUB(NOW(6), INTERVAL 1 HOUR));
