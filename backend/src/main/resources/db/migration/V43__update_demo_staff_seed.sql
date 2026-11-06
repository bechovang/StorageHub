-- Update the demo staff names and weekly roster without editing V40.
-- V40 stays immutable; this migration applies after V42.
UPDATE users SET full_name = 'Nguyễn Văn An' WHERE user_id = 5;
UPDATE users SET full_name = 'Trần Minh Bình' WHERE user_id = 6;
UPDATE users SET full_name = 'Lê Hoàng Cường' WHERE user_id = 7;
UPDATE users SET full_name = 'Phạm Quốc Dũng' WHERE user_id = 8;
UPDATE users SET full_name = 'Võ Thành Đạt' WHERE user_id = 9;
UPDATE users SET full_name = 'Đặng Hữu Khang' WHERE user_id = 10;
UPDATE users SET full_name = 'Bùi Tuấn Kiệt' WHERE user_id = 11;
UPDATE users SET full_name = 'Hồ Nhật Long' WHERE user_id = 12;
UPDATE users SET full_name = 'Ngô Gia Huy' WHERE user_id = 13;
UPDATE users SET full_name = 'Dương Bảo Nam' WHERE user_id = 14;
UPDATE users SET full_name = 'Trịnh Đức Phúc' WHERE user_id = 15;
UPDATE users SET full_name = 'Lý Minh Quân' WHERE user_id = 16;

-- V40 seeded 42 round-robin shifts. Replace only demo staff assignments
-- with the requested 168 full-week assignments (4 staff x 14 shifts/facility).
DELETE FROM staff_assignments WHERE staff_id BETWEEN 5 AND 16;

INSERT INTO staff_assignments (assignment_id, staff_id, shift, work_date, created_at)
SELECT
    1000 + (u.user_id - 5) * 14 + d.n * 2 + sh.o,
    u.user_id,
    IF(sh.o = 0, 'MORNING', 'AFTERNOON'),
    DATE_ADD(DATE_SUB(CURDATE(), INTERVAL WEEKDAY(CURDATE()) DAY), INTERVAL d.n DAY),
    NOW(6)
FROM users u
JOIN (
    SELECT 0 AS n UNION ALL SELECT 1 UNION ALL SELECT 2 UNION ALL SELECT 3
    UNION ALL SELECT 4 UNION ALL SELECT 5 UNION ALL SELECT 6
) d
JOIN (SELECT 0 AS o UNION ALL SELECT 1) sh
WHERE u.role_id = 2 AND u.unit_type_id IS NOT NULL
ORDER BY u.user_id, d.n, sh.o;

INSERT INTO staff_assignment_types (assignment_id, unit_type_id)
SELECT sa.assignment_id, u.unit_type_id
FROM staff_assignments sa
JOIN users u ON u.user_id = sa.staff_id
WHERE u.role_id = 2 AND u.unit_type_id IS NOT NULL;
