-- V31 (dev): đưa task active vào pool, gán ca + loại kho cho seed.
UPDATE tasks SET shift = 'FULL_DAY';

UPDATE tasks SET unit_type_id = CASE
    WHEN task_id IN (3, 6, 7, 8, 10, 43, 45, 47, 48, 50) THEN 2 -- S
    WHEN task_id IN (40, 41, 42, 44, 46) THEN 3                 -- M
    WHEN task_id IN (20, 49, 52) THEN 1                         -- LOCK
    WHEN task_id IN (51, 53) THEN 4                             -- L
    ELSE unit_type_id
END;

UPDATE tasks
SET assigned_staff_id = NULL, claimed_at = NULL
WHERE status <> 'DONE';
