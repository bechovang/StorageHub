-- ============================================================================
-- StorageHub — Flyway V19 (dev only) — Bổ sung đủ 40 kho khả dụng cho danh mục
-- Phục vụ: Phân trang danh mục kho (US-6, FR-4) với 4 trang (12 kho / trang)
-- ============================================================================

-- Bổ sung 34 kho trống mới (Unit 22 đến 55) kết hợp cùng 6 kho sẵn sàng hiện có
-- để đạt đúng 40 kho khả dụng (AVAILABLE) trên trang Duyệt kho.

INSERT INTO units (unit_id, code, type_id, zone_id, size_m2, floor, access_type, status) VALUES
    -- 1. Dãy tủ lưu trữ nhỏ (Locker - 1.5 m² - Zone C - Tầng 1)
    (22, 'LOCK-7',  1, 3, 1.50,  1, 'QR',         'AVAILABLE'),
    (23, 'LOCK-8',  1, 3, 1.50,  1, 'QR',         'AVAILABLE'),
    (24, 'LOCK-9',  1, 3, 1.50,  1, 'QR',         'AVAILABLE'),
    (25, 'LOCK-10', 1, 3, 1.50,  1, 'QR',         'AVAILABLE'),
    (26, 'LOCK-11', 1, 3, 1.50,  1, 'QR',         'AVAILABLE'),
    (27, 'LOCK-12', 1, 3, 1.50,  1, 'QR',         'AVAILABLE'),
    (28, 'LOCK-13', 1, 3, 1.50,  1, 'QR',         'AVAILABLE'),
    (29, 'LOCK-14', 1, 3, 1.50,  1, 'QR',         'AVAILABLE'),

    -- 2. Dãy kho nhỏ tiêu chuẩn (Hạng S - 5.0 m² - Zone A - Tầng 1)
    (30, 'S-7',     2, 1, 5.00,  1, 'PIN',        'AVAILABLE'),
    (31, 'S-8',     2, 1, 5.00,  1, 'PIN',        'AVAILABLE'),
    (32, 'S-9',     2, 1, 5.00,  1, 'PIN',        'AVAILABLE'),
    (33, 'S-10',    2, 1, 5.00,  1, 'QR',         'AVAILABLE'),
    (34, 'S-11',    2, 1, 5.00,  1, 'QR',         'AVAILABLE'),
    (35, 'S-12',    2, 1, 5.00,  1, 'PIN',        'AVAILABLE'),
    (36, 'S-13',    2, 1, 5.00,  1, 'PIN',        'AVAILABLE'),
    (37, 'S-14',    2, 1, 5.00,  1, 'QR',         'AVAILABLE'),
    (38, 'S-15',    2, 1, 5.00,  1, 'PIN',        'AVAILABLE'),
    (39, 'S-16',    2, 1, 5.00,  1, 'QR',         'AVAILABLE'),

    -- 3. Dãy kho vừa (Hạng M - 8.0 m² - Zone B - Tầng 2)
    (40, 'M-7',     3, 2, 8.00,  2, 'smart lock', 'AVAILABLE'),
    (41, 'M-8',     3, 2, 8.00,  2, 'smart lock', 'AVAILABLE'),
    (42, 'M-9',     3, 2, 8.00,  2, 'smart lock', 'AVAILABLE'),
    (43, 'M-10',    3, 2, 8.00,  2, 'PIN',        'AVAILABLE'),
    (44, 'M-11',    3, 2, 8.00,  2, 'PIN',        'AVAILABLE'),
    (45, 'M-12',    3, 2, 8.00,  2, 'smart lock', 'AVAILABLE'),
    (46, 'M-13',    3, 2, 8.00,  2, 'smart lock', 'AVAILABLE'),
    (47, 'M-14',    3, 2, 8.00,  2, 'PIN',        'AVAILABLE'),
    (48, 'M-15',    3, 2, 8.00,  2, 'smart lock', 'AVAILABLE'),
    (49, 'M-16',    3, 2, 8.00,  2, 'smart lock', 'AVAILABLE'),

    -- 4. Dãy kho lớn (Hạng L - 15.0 m² - Zone B - Tầng 2)
    (50, 'L-4',     4, 2, 15.00, 2, 'smart lock', 'AVAILABLE'),
    (51, 'L-5',     4, 2, 15.00, 2, 'smart lock', 'AVAILABLE'),
    (52, 'L-6',     4, 2, 15.00, 2, 'smart lock', 'AVAILABLE'),
    (53, 'L-7',     4, 2, 15.00, 2, 'smart lock', 'AVAILABLE'),
    (54, 'L-8',     4, 2, 15.00, 2, 'smart lock', 'AVAILABLE'),
    (55, 'L-9',     4, 2, 15.00, 2, 'smart lock', 'AVAILABLE');
