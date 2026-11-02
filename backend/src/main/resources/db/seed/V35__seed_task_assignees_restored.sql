-- V35 (dev): bỏ pool, gán lại task active theo loại kho cho seed.
UPDATE tasks
SET assigned_staff_id = CASE unit_type_id
    WHEN 1 THEN 12 -- LOCK → Hà
    WHEN 2 THEN 2  -- S → Minh
    WHEN 3 THEN 10 -- M → Bảo
    WHEN 4 THEN 14 -- L → Khoa
    ELSE 2
END
WHERE assigned_staff_id IS NULL;
