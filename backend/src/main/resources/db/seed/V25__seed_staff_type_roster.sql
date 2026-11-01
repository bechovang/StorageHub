-- ============================================================================
-- StorageHub — V25 (dev only): thêm 1 nhân viên full-time + lịch trực theo
-- loại kho (LOCK / S / M / L). Mật khẩu demo: password.
-- ============================================================================

INSERT INTO users (user_id, full_name, email, phone, password_hash, role_id, facility_id, status, created_at) VALUES
    (14, 'Võ Minh Khoa', 'khoa@demo.storagehub.vn', '0915678901',
     '$2a$10$dXJ3SW6G7P50lGmMkkmwe.20cQQubK3.HZWzG3YB1tlRy.fqvM/BG', 2, 1, 1, DATE_SUB(NOW(6), INTERVAL 7 DAY));

-- Staff 14 phụ trách kho L; staff 12 phụ trách LOCK.
INSERT IGNORE INTO staff_assignments (staff_id, unit_type_id, shift, work_date) VALUES
    (14, 4, 'MORNING',   CURDATE()),
    (14, 4, 'AFTERNOON', DATE_ADD(CURDATE(), INTERVAL 1 DAY)),
    (14, 4, 'MORNING',   DATE_ADD(CURDATE(), INTERVAL 2 DAY)),
    (12, 1, 'MORNING',   CURDATE()),
    (12, 1, 'AFTERNOON', DATE_SUB(CURDATE(), INTERVAL 1 DAY)),
    (12, 1, 'MORNING',   DATE_ADD(CURDATE(), INTERVAL 1 DAY));
