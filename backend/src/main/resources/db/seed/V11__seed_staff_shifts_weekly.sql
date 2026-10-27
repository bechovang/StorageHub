-- ============================================================================
-- StorageHub — Flyway V11 (dev only) — Lịch trực Staff & Ca làm việc tuần này
-- Phục vụ: US-26 (Staff & Shifts + conflict detection / FR-27 / UJ-4)
-- Flow: Quản lý Tuấn phân công ca trực theo Nhân viên x Khu vực x Ca trực x Ngày ->
--       Hệ thống chặn trùng người-ca-ngày trước khi lưu (409 Conflict) ->
--       Nhân viên đăng nhập xem lịch trực cá nhân và danh sách công việc.
-- ============================================================================

-- Phân công ca trực cho 2 nhân viên (Trần Minh: 2, Lê Quốc Bảo: 10) trong tuần hiện tại:
INSERT IGNORE INTO staff_assignments (staff_id, zone_id, shift, work_date) VALUES
    -- Hôm qua (CURDATE - 1)
    (2,  1, 'MORNING',   DATE_SUB(CURDATE(), INTERVAL 1 DAY)),
    (10, 2, 'AFTERNOON', DATE_SUB(CURDATE(), INTERVAL 1 DAY)),

    -- Hôm nay (CURDATE) — ca sáng và ca chiều
    (2,  1, 'MORNING',   CURDATE()),
    (10, 2, 'AFTERNOON', CURDATE()),
    (2,  3, 'EVENING',   CURDATE()),

    -- Ngày mai (CURDATE + 1)
    (2,  1, 'MORNING',   DATE_ADD(CURDATE(), INTERVAL 1 DAY)),
    (10, 2, 'AFTERNOON', DATE_ADD(CURDATE(), INTERVAL 1 DAY)),

    -- Ngày kia (CURDATE + 2)
    (2,  2, 'MORNING',   DATE_ADD(CURDATE(), INTERVAL 2 DAY)),
    (10, 1, 'AFTERNOON', DATE_ADD(CURDATE(), INTERVAL 2 DAY)),

    -- 3 ngày nữa (CURDATE + 3)
    (2,  1, 'MORNING',   DATE_ADD(CURDATE(), INTERVAL 3 DAY)),
    (10, 2, 'AFTERNOON', DATE_ADD(CURDATE(), INTERVAL 3 DAY));
