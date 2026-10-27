-- ============================================================================
-- StorageHub — Flyway V9 (dev only) — Kịch bản Hỗ trợ sự cố & Escalation Quản lý
-- Phục vụ: US-23 (Support Ticket — route & resolve), US-24 (Severity Decision + Relocation / UJ-5)
-- Flow: Khách gửi báo cáo sự cố (SR-..) -> Định tuyến thẻ Support cho nhân viên
--       trực ca -> Nhân viên xử lý hoặc Escalate kèm ghi chú bắt buộc lên
--       Facility Manager -> Quản lý ra quyết định (PENDING / RETURN / RELOCATE).
-- ============================================================================

-- Đơn thuê M-2 của Bảo Ngọc (ngữ cảnh phát sinh sự cố ngập nước)
INSERT INTO reservations (reservation_id, code, customer_id, unit_id, start_date, end_date,
                          deposit_amount, access_code, status, created_at) VALUES
    (46, 'BK-1056', 9, 6,
        DATE_SUB(CURDATE(), INTERVAL 10 DAY),
        DATE_ADD(CURDATE(), INTERVAL 50 DAY),
        38000, '382910', 'CHECKED_IN', DATE_SUB(NOW(6), INTERVAL 10 DAY));

INSERT INTO contracts (contract_id, code, reservation_id, policy_id, content_snapshot,
                       signed_photo_url, status, supersedes_contract_id, is_latest, created_at) VALUES
    (46, 'CT-1056', 46, 2,
     '{"unit":"M-2","term":"2 months","rent":760000,"deposit":38000,"policy":"v3"}',
     '/storage/contracts/CT-1056-signed.jpg', 'SIGNED', NULL, 1, DATE_SUB(NOW(6), INTERVAL 10 DAY));

-- Danh sách vé hỗ trợ với đủ các loại sự cố và trạng thái:
INSERT INTO support_tickets (ticket_id, code, customer_id, unit_id, reservation_id,
                             incident_type, status, assigned_staff_id, created_at) VALUES
    -- 1. Sự cố nghiêm trọng UJ-5: ngập nước M-2 (đang chờ quản lý Tuấn duyệt di dời)
    (2, 'SR-0033', 9, 6,  46, 'CLEANLINESS',  'OPEN',        2,  DATE_SUB(NOW(6), INTERVAL 3 HOUR)),
    -- 2. Khóa thông minh chập chờn (đang xử lý)
    (3, 'SR-0034', 1, 7,  NULL, 'DEVICE_ISSUE', 'IN_PROGRESS', 2,  DATE_SUB(NOW(6), INTERVAL 5 HOUR)),
    -- 3. Quên mã PIN (đã giải quyết xong)
    (4, 'SR-0035', 9, 2,  42, 'LOST_ACCESS',  'RESOLVED',    2,  DATE_SUB(NOW(6), INTERVAL 1 DAY)),
    -- 4. Bụi bẩn khu vực Locker (chờ xử lý)
    (5, 'SR-0036', 6, 13, NULL, 'CLEANLINESS',  'OPEN',        10, DATE_SUB(NOW(6), INTERVAL 2 HOUR)),
    -- 5. Đèn hành lang Zone B chập chờn (chờ quản lý)
    (6, 'SR-0037', 8, 10, 41, 'OTHER',        'OPEN',        2,  DATE_SUB(NOW(6), INTERVAL 4 HOUR)),
    -- 6. Cửa kho phát tiếng kêu (đang tra dầu)
    (7, 'SR-0038', 1, 4,  30, 'DEVICE_ISSUE', 'IN_PROGRESS', 10, DATE_SUB(NOW(6), INTERVAL 6 HOUR)),
    -- 7. Camera an ninh bị che (đã chỉnh góc quay)
    (8, 'SR-0039', 8, 14, 45, 'SECURITY',     'RESOLVED',    2,  DATE_SUB(NOW(6), INTERVAL 2 DAY));

-- Bảng Escalations với 3 trường hợp quyết định:
INSERT INTO escalations (escalation_id, ticket_id, escalated_by_staff_id, manager_id,
                         note, decision, created_at) VALUES
    -- Quyết định PENDING: Tuấn demo chọn severe -> M-2 bảo trì + di dời khách sang M-5
    (1, 2, 2, 4,
     'Nước ngập từ trần xuống sàn kho M-2, nguy cơ ẩm mốc hàng hóa. Đề xuất di dời khách sang kho trống M-5 và đưa M-2 vào bảo trì.',
     'PENDING', DATE_SUB(NOW(6), INTERVAL 2 HOUR)),
    -- Quyết định RETURN_TO_STAFF: Quản lý yêu cầu nhân viên tự xử lý kỹ thuật trước
    (2, 3, 2, 4,
     'Khách báo ổ khóa thông minh chập chờn. Quản lý yêu cầu thay pin và kiểm tra kết nối mạng trước khi đổi khóa.',
     'RETURN_TO_STAFF', DATE_SUB(NOW(6), INTERVAL 4 HOUR)),
    -- Quyết định MAINTENANCE_RELOCATE: Cần bảo trì hạ tầng điện khu B
    (3, 6, 2, 4,
     'Bóng đèn hành lang Zone B chập chờn có nguy cơ chập cháy, đề xuất ngắt điện tạm thời để thay bóng.',
     'MAINTENANCE_RELOCATE', DATE_SUB(NOW(6), INTERVAL 3 HOUR));

-- Các thẻ Support trên Kanban của nhân viên:
INSERT INTO tasks (task_id, type, ref_code, assigned_staff_id, work_date, status, created_at) VALUES
    (41, 'SUPPORT', 'SR-0033', 2,  CURDATE(), 'TODO',        DATE_SUB(NOW(6), INTERVAL 3 HOUR)),
    (44, 'SUPPORT', 'SR-0034', 2,  CURDATE(), 'IN_PROGRESS', DATE_SUB(NOW(6), INTERVAL 4 HOUR)),
    (45, 'SUPPORT', 'SR-0038', 10, CURDATE(), 'IN_PROGRESS', DATE_SUB(NOW(6), INTERVAL 3 HOUR)),
    (48, 'SUPPORT', 'SR-0035', 2,  CURDATE(), 'DONE',        DATE_SUB(NOW(6), INTERVAL 6 HOUR));
