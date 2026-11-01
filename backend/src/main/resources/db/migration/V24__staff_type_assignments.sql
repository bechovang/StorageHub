-- ============================================================================
-- StorageHub — V24: phân ca theo LOẠI KHO thay vì Zone
-- Full-time staff được chia theo nhóm LOCK / S / M / L; Zone chỉ còn dùng
-- cho bản đồ vật lý, không dùng để xếp lịch.
-- ============================================================================

ALTER TABLE staff_assignments
    ADD COLUMN unit_type_id INT NULL AFTER staff_id;

-- Map dữ liệu cũ: Zone A→S, Zone B→M, Zone C→LOCK.
UPDATE staff_assignments sa
JOIN zones z ON sa.zone_id = z.zone_id
SET sa.unit_type_id = CASE z.code
    WHEN 'A' THEN 2
    WHEN 'B' THEN 3
    WHEN 'C' THEN 1
    ELSE 2
END;

UPDATE staff_assignments SET unit_type_id = 2 WHERE unit_type_id IS NULL;

ALTER TABLE staff_assignments
    DROP FOREIGN KEY fk_staff_assignments_zone,
    DROP INDEX idx_staff_assignments_zone_date_shift,
    DROP COLUMN zone_id,
    MODIFY unit_type_id INT NOT NULL,
    ADD CONSTRAINT fk_staff_assignments_unit_type
        FOREIGN KEY (unit_type_id) REFERENCES unit_types (type_id),
    ADD KEY idx_staff_assignments_type_date_shift (unit_type_id, work_date, shift);
