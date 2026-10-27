-- ============================================================================
-- StorageHub — Flyway V17 (dev only) — Kịch bản Quản trị người dùng SYS-01
-- Phục vụ: US-28 (User Management — SYS-01 / UJ-6 / AD-5)
-- Kịch bản: Admin Nam vào màn hình Quản lý người dùng (/users):
--   1. Tài khoản long@ (status = 0, chưa kích hoạt) -> Nam demo kích hoạt.
--   2. Tài khoản ha@ (STAFF) -> Nam demo phân lại vai trò hoặc khóa tài khoản.
--   3. Tài khoản huy@ (CUSTOMER) -> Nam demo "Reset mật khẩu", hệ thống sinh mật khẩu tạm.
-- ============================================================================

INSERT INTO users (user_id, full_name, email, phone, password_hash, role_id, facility_id, status, created_at) VALUES
    -- Tài khoản chưa kích hoạt (status = 0)
    (11, 'Nguyễn Văn Long', 'long@demo.storagehub.vn', '0912345678',
     '$2a$10$dXJ3SW6G7P50lGmMkkmwe.20cQQubK3.HZWzG3YB1tlRy.fqvM/BG', 1, NULL, 0, DATE_SUB(NOW(6), INTERVAL 3 DAY)),

    -- Nhân viên đang hoạt động sẵn sàng để demo đổi Role hoặc Khóa (status = 1)
    (12, 'Phan Thanh Hà',   'ha@demo.storagehub.vn',   '0913456789',
     '$2a$10$dXJ3SW6G7P50lGmMkkmwe.20cQQubK3.HZWzG3YB1tlRy.fqvM/BG', 2, 1,    1, DATE_SUB(NOW(6), INTERVAL 30 DAY)),

    -- Khách hàng cần cấp lại mật khẩu (status = 1)
    (13, 'Đặng Quốc Huy',   'huy@demo.storagehub.vn',  '0914567890',
     '$2a$10$dXJ3SW6G7P50lGmMkkmwe.20cQQubK3.HZWzG3YB1tlRy.fqvM/BG', 1, NULL, 1, DATE_SUB(NOW(6), INTERVAL 15 DAY));

-- Ghi nhận vết kiểm toán của System Admin Nam trong Activity Log
INSERT INTO activity_logs (actor_id, entity_type, entity_id, action, from_value, to_value, reason, created_at) VALUES
    (5, 'USER', 11, 'CREATED',       NULL,     'INACTIVE', 'User registered via public portal, pending verification', DATE_SUB(NOW(6), INTERVAL 3 DAY)),
    (5, 'USER', 12, 'ROLE_ASSIGNED', 'CUSTOMER','STAFF',   'Promoted to depot operational staff',                     DATE_SUB(NOW(6), INTERVAL 30 DAY));
