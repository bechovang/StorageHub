-- Task pool: task chưa có người nhận + ca/loại kho để lọc người đủ điều kiện.
ALTER TABLE tasks
    MODIFY assigned_staff_id BIGINT NULL,
    ADD COLUMN shift VARCHAR(20) NULL AFTER assigned_staff_id,
    ADD COLUMN unit_type_id INT NULL AFTER shift,
    ADD COLUMN claimed_at DATETIME(6) NULL AFTER unit_type_id,
    ADD KEY idx_tasks_pool (assigned_staff_id, status, work_date, unit_type_id, shift),
    ADD CONSTRAINT fk_tasks_unit_type FOREIGN KEY (unit_type_id) REFERENCES unit_types(type_id);
