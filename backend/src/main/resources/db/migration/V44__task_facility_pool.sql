-- Task pool needs a facility even when no staff is assigned.
ALTER TABLE tasks
    ADD COLUMN facility_id INT NULL AFTER unit_type_id,
    ADD KEY idx_tasks_facility_status_date (facility_id, status, work_date),
    ADD CONSTRAINT fk_tasks_facility FOREIGN KEY (facility_id) REFERENCES facilities (facility_id);

-- Backfill existing assigned tasks from their staff's facility.
UPDATE tasks t
JOIN users u ON u.user_id = t.assigned_staff_id
SET t.facility_id = u.facility_id
WHERE t.facility_id IS NULL;

-- Backfill pool tasks that have no assignee yet, by resolving their ref code.
UPDATE tasks t
JOIN reservations r ON r.code = t.ref_code
JOIN units u ON u.unit_id = r.unit_id
JOIN zones z ON z.zone_id = u.zone_id
SET t.facility_id = z.facility_id
WHERE t.facility_id IS NULL;

UPDATE tasks t
JOIN support_tickets st ON st.code = t.ref_code
JOIN units u ON u.unit_id = st.unit_id
JOIN zones z ON z.zone_id = u.zone_id
SET t.facility_id = z.facility_id
WHERE t.facility_id IS NULL;

UPDATE tasks t
JOIN contracts c ON c.code = t.ref_code
JOIN reservations r ON r.reservation_id = c.reservation_id
JOIN units u ON u.unit_id = r.unit_id
JOIN zones z ON z.zone_id = u.zone_id
SET t.facility_id = z.facility_id
WHERE t.facility_id IS NULL;

UPDATE tasks t
JOIN contract_addendums a ON a.code = t.ref_code
JOIN contracts c ON c.contract_id = a.contract_id
JOIN reservations r ON r.reservation_id = c.reservation_id
JOIN units u ON u.unit_id = r.unit_id
JOIN zones z ON z.zone_id = u.zone_id
SET t.facility_id = z.facility_id
WHERE t.facility_id IS NULL;
