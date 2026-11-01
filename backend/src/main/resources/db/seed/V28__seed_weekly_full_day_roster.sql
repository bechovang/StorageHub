-- ============================================================================
-- StorageHub — V28 (dev only): lịch trực tuần này dễ test
-- Mỗi nhân viên FULL_DAY (07:00–23:00) 1 loại kho cố định cả tuần:
--   Trần Minh   → S
--   Lê Quốc Bảo → M
--   Phan Thanh Hà → LOCK
--   Võ Minh Khoa → L
-- Dùng cho demo; production không nên xếp 16h/ngày liên tục.
-- ============================================================================

DELETE FROM staff_assignments;

INSERT INTO staff_assignments (staff_id, shift, work_date)
SELECT m.staff_id, 'FULL_DAY',
       DATE_ADD(DATE_SUB(CURDATE(), INTERVAL WEEKDAY(CURDATE()) DAY), INTERVAL d.n DAY)
FROM (
    SELECT 2 AS staff_id, 2 AS type_id
    UNION ALL SELECT 10, 3
    UNION ALL SELECT 12, 1
    UNION ALL SELECT 14, 4
) m
CROSS JOIN (
    SELECT 0 AS n UNION ALL SELECT 1 UNION ALL SELECT 2 UNION ALL SELECT 3
    UNION ALL SELECT 4 UNION ALL SELECT 5 UNION ALL SELECT 6
) d;

INSERT INTO staff_assignment_types (assignment_id, unit_type_id)
SELECT sa.assignment_id, m.type_id
FROM staff_assignments sa
JOIN (
    SELECT 2 AS staff_id, 2 AS type_id
    UNION ALL SELECT 10, 3
    UNION ALL SELECT 12, 1
    UNION ALL SELECT 14, 4
) m ON m.staff_id = sa.staff_id;
