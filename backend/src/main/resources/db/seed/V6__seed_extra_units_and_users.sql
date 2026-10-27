-- ============================================================================
-- StorageHub — Flyway V6 (dev only) — Thêm Units & Users mở rộng cơ sở Tân Bình
-- Phục vụ: Danh mục duyệt kho (US-6), Quản trị người dùng (US-28 / SYS-01)
-- ============================================================================

-- 1. Bổ sung các khách hàng và nhân viên phụ
INSERT INTO users (user_id, full_name, email, phone, password_hash, role_id, facility_id, status, created_at) VALUES
    (8,  'Đỗ Hoàng Anh',   'hoanganh@demo.storagehub.vn', '0908123456', '$2a$10$dXJ3SW6G7P50lGmMkkmwe.20cQQubK3.HZWzG3YB1tlRy.fqvM/BG', 1, NULL, 1, DATE_SUB(NOW(6), INTERVAL 90 DAY)),
    (9,  'Trần Bảo Ngọc',  'baongoc@demo.storagehub.vn',  '0909234567', '$2a$10$dXJ3SW6G7P50lGmMkkmwe.20cQQubK3.HZWzG3YB1tlRy.fqvM/BG', 1, NULL, 1, DATE_SUB(NOW(6), INTERVAL 60 DAY)),
    (10, 'Lê Quốc Bảo',    'bao@demo.storagehub.vn',      '0910345678', '$2a$10$dXJ3SW6G7P50lGmMkkmwe.20cQQubK3.HZWzG3YB1tlRy.fqvM/BG', 2, 1,    1, DATE_SUB(NOW(6), INTERVAL 120 DAY));

-- 2. Thêm các kho bổ sung tại các tầng và khu vực (Zone A, B, C)
INSERT INTO units (unit_id, code, type_id, zone_id, size_m2, floor, access_type, status) VALUES
    (16, 'S-5',    2, 1, 5.00,  1, 'QR',         'AVAILABLE'),
    (17, 'S-6',    2, 1, 5.00,  1, 'PIN',        'AVAILABLE'),
    (18, 'M-6',    3, 2, 8.00,  2, 'smart lock', 'AVAILABLE'),
    (19, 'L-3',    4, 2, 15.00, 2, 'smart lock', 'AVAILABLE'),
    (20, 'LOCK-5', 1, 3, 1.50,  1, 'QR',         'AVAILABLE'),
    (21, 'LOCK-6', 1, 3, 1.50,  1, 'QR',         'AVAILABLE');

-- 3. Cập nhật trạng thái một số kho cho thuê thực tế
UPDATE units SET status = 'RENTED'      WHERE unit_id = 5;  -- M-1 (khách đang thuê)
UPDATE units SET status = 'RENTED'      WHERE unit_id = 6;  -- M-2 (khách đang thuê)
UPDATE units SET status = 'RENTED'      WHERE unit_id = 10; -- L-1 (khách đang thuê)
UPDATE units SET status = 'RENTED'      WHERE unit_id = 2;  -- S-2 (khách đang thuê)
UPDATE units SET status = 'RENTED'      WHERE unit_id = 13; -- LOCK-2 (khách đang thuê)
UPDATE units SET status = 'PREPARING'   WHERE unit_id = 8;  -- M-4 (kho vừa sửa xong, đang dọn)
UPDATE units SET status = 'MAINTENANCE' WHERE unit_id = 11; -- L-2 (bảo trì máy hút ẩm)
UPDATE units SET status = 'RETIRED'     WHERE unit_id = 15; -- LOCK-4 (khu C ngừng dùng)
