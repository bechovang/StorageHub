-- ============================================================================
-- StorageHub — V29 (dev only): lịch trực tuần ICT (sửa V28 lệch tuần do UTC)
-- Mỗi staff FULL_DAY 1 loại kho cố định cả tuần.
-- ============================================================================

SET @ict_today = DATE(CONVERT_TZ(UTC_TIMESTAMP(), '+00:00', '+07:00'));
SET @week_start = DATE_SUB(@ict_today, INTERVAL WEEKDAY(@ict_today) DAY);

DELETE FROM staff_assignments;

INSERT INTO staff_assignments (staff_id, shift, work_date)
SELECT m.staff_id, 'FULL_DAY', DATE_ADD(@week_start, INTERVAL d.n DAY)
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
