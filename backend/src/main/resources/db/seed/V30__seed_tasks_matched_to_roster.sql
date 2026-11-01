-- ============================================================================
-- StorageHub — V30 (dev only): task khớp lịch phân công theo loại kho
--   Minh (2)  → S      Bảo (10) → M
--   Hà (12)   → LOCK   Khoa (14) → L
-- Active task hôm nay (ICT); DONE hôm qua.
-- ============================================================================

SET @ict_today = DATE(CONVERT_TZ(UTC_TIMESTAMP(), '+00:00', '+07:00'));
SET @ict_yesterday = DATE_SUB(@ict_today, INTERVAL 1 DAY);

-- Reassign task theo unit type thực tế của ref.
UPDATE tasks SET assigned_staff_id = CASE
    WHEN task_id IN (20, 49) THEN 12              -- LOCK-1, LOCK-3
    WHEN task_id IN (40, 41, 42, 44, 46) THEN 10   -- M-1/M-2/M-3/M-4
    WHEN task_id IN (45, 47, 50) THEN 2            -- S-4/S-2/S-1
    WHEN task_id = 51 THEN 14                      -- L-1
    ELSE assigned_staff_id
END;

-- Active việc hôm nay; việc xong để hôm qua.
UPDATE tasks SET work_date = CASE
    WHEN status = 'DONE' THEN @ict_yesterday
    ELSE @ict_today
END;

-- Thêm việc cho Hà (LOCK) và Khoa (L) để demo.
INSERT INTO tasks (type, ref_code, assigned_staff_id, work_date, status, created_at) VALUES
    ('SUPPORT', 'SR-0036', 12, @ict_today, 'TODO',        NOW(6)),
    ('SUPPORT', 'SR-0037', 14, @ict_today, 'IN_PROGRESS', NOW(6));
