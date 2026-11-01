-- ============================================================================
-- StorageHub — V26: một ca trực có thể phụ trách NHIỀU loại kho.
-- Tách unit_type_id khỏi staff_assignments thành bảng nối nhiều-nhiều.
-- ============================================================================

CREATE TABLE staff_assignment_types (
    assignment_id BIGINT NOT NULL,
    unit_type_id  INT    NOT NULL,
    PRIMARY KEY (assignment_id, unit_type_id),
    KEY idx_staff_assignment_types_type (unit_type_id),
    CONSTRAINT fk_sat_assignment FOREIGN KEY (assignment_id)
        REFERENCES staff_assignments (assignment_id) ON DELETE CASCADE,
    CONSTRAINT fk_sat_unit_type FOREIGN KEY (unit_type_id)
        REFERENCES unit_types (type_id)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci;

INSERT INTO staff_assignment_types (assignment_id, unit_type_id)
SELECT assignment_id, unit_type_id FROM staff_assignments;

ALTER TABLE staff_assignments
    DROP FOREIGN KEY fk_staff_assignments_unit_type,
    DROP INDEX idx_staff_assignments_type_date_shift,
    DROP COLUMN unit_type_id;
