-- Task completion audit: cột Done phải truy được ngày/người hoàn tất,
-- không phụ thuộc work_date (check-in sớm/trễ vẫn hiện đúng ngày hoàn tất).
ALTER TABLE tasks
    ADD COLUMN completed_at DATETIME(6) NULL AFTER claimed_at,
    ADD COLUMN completed_by BIGINT NULL AFTER completed_at,
    ADD CONSTRAINT fk_tasks_completed_by FOREIGN KEY (completed_by) REFERENCES users (user_id);

-- Backfill dữ liệu cũ: task DONE lấy created_at làm mốc gần đúng.
UPDATE tasks
SET completed_at = created_at
WHERE status = 'DONE' AND completed_at IS NULL;

UPDATE tasks
SET completed_by = assigned_staff_id
WHERE status = 'DONE' AND completed_by IS NULL;
