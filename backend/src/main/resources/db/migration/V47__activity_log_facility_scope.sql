-- ============================================================================
-- StorageHub — V47: phạm vi cơ sở cho audit trail (FR-28 / NFR-4)
-- Facility Manager chỉ được thấy log thuộc cơ sở mình; SYSTEM_ADMIN /
-- BUSINESS_OPS thấy toàn hệ thống.
-- facility_id NULL = sự kiện cấp hệ thống hoặc không suy được cơ sở.
-- ============================================================================

ALTER TABLE activity_logs
    ADD COLUMN facility_id INT NULL AFTER actor_id;

ALTER TABLE activity_logs
    ADD CONSTRAINT fk_activity_logs_facility
        FOREIGN KEY (facility_id) REFERENCES facilities (facility_id);

CREATE INDEX idx_activity_logs_facility ON activity_logs (facility_id, created_at);

-- ------------------------------------------------ BACKFILL (best effort) ----
-- Đơn vị kho: units.zone_id -> zones.facility_id
UPDATE activity_logs l
    JOIN units u ON u.unit_id = l.entity_id
    JOIN zones z ON z.zone_id = u.zone_id
SET l.facility_id = z.facility_id
WHERE l.entity_type = 'UNIT' AND l.facility_id IS NULL;

-- Đơn thuê: reservations.unit_id -> units -> zones
UPDATE activity_logs l
    JOIN reservations r ON r.reservation_id = l.entity_id
    JOIN units u ON u.unit_id = r.unit_id
    JOIN zones z ON z.zone_id = u.zone_id
SET l.facility_id = z.facility_id
WHERE l.entity_type = 'RESERVATION' AND l.facility_id IS NULL;

-- Hợp đồng: contracts.reservation_id -> reservations -> units -> zones
UPDATE activity_logs l
    JOIN contracts c ON c.contract_id = l.entity_id
    JOIN reservations r ON r.reservation_id = c.reservation_id
    JOIN units u ON u.unit_id = r.unit_id
    JOIN zones z ON z.zone_id = u.zone_id
SET l.facility_id = z.facility_id
WHERE l.entity_type = 'CONTRACT' AND l.facility_id IS NULL;

-- Phụ lục hợp đồng: contract_addendums.contract_id -> contracts -> ...
UPDATE activity_logs l
    JOIN contract_addendums a ON a.addendum_id = l.entity_id
    JOIN contracts c ON c.contract_id = a.contract_id
    JOIN reservations r ON r.reservation_id = c.reservation_id
    JOIN units u ON u.unit_id = r.unit_id
    JOIN zones z ON z.zone_id = u.zone_id
SET l.facility_id = z.facility_id
WHERE l.entity_type IN ('ADDENDUM', 'CONTRACT_ADDENDUM') AND l.facility_id IS NULL;

-- Thanh toán: ưu tiên payments.unit_id, sau đó payments.reservation_id
UPDATE activity_logs l
    JOIN payments p ON p.payment_id = l.entity_id
    JOIN units u ON u.unit_id = p.unit_id
    JOIN zones z ON z.zone_id = u.zone_id
SET l.facility_id = z.facility_id
WHERE l.entity_type = 'PAYMENT' AND l.facility_id IS NULL;

UPDATE activity_logs l
    JOIN payments p ON p.payment_id = l.entity_id
    JOIN reservations r ON r.reservation_id = p.reservation_id
    JOIN units u ON u.unit_id = r.unit_id
    JOIN zones z ON z.zone_id = u.zone_id
SET l.facility_id = z.facility_id
WHERE l.entity_type = 'PAYMENT' AND l.facility_id IS NULL;

-- Gia hạn: extensions.reservation_id -> ...
UPDATE activity_logs l
    JOIN extensions e ON e.extension_id = l.entity_id
    JOIN reservations r ON r.reservation_id = e.reservation_id
    JOIN units u ON u.unit_id = r.unit_id
    JOIN zones z ON z.zone_id = u.zone_id
SET l.facility_id = z.facility_id
WHERE l.entity_type = 'EXTENSION' AND l.facility_id IS NULL;

-- Trả muộn: late_checkout_cases.reservation_id -> ...
UPDATE activity_logs l
    JOIN late_checkout_cases c ON c.case_id = l.entity_id
    JOIN reservations r ON r.reservation_id = c.reservation_id
    JOIN units u ON u.unit_id = r.unit_id
    JOIN zones z ON z.zone_id = u.zone_id
SET l.facility_id = z.facility_id
WHERE l.entity_type = 'LATE_CHECKOUT_CASE' AND l.facility_id IS NULL;

-- Sự cố: support_tickets.unit_id -> ...
UPDATE activity_logs l
    JOIN support_tickets t ON t.ticket_id = l.entity_id
    JOIN units u ON u.unit_id = t.unit_id
    JOIN zones z ON z.zone_id = u.zone_id
SET l.facility_id = z.facility_id
WHERE l.entity_type = 'TICKET' AND l.facility_id IS NULL;

-- Công việc: tasks.facility_id
UPDATE activity_logs l
    JOIN tasks t ON t.task_id = l.entity_id
SET l.facility_id = t.facility_id
WHERE l.entity_type = 'TASK' AND l.facility_id IS NULL;

-- Ca trực: staff_assignments.staff_id -> users.facility_id
UPDATE activity_logs l
    JOIN staff_assignments s ON s.assignment_id = l.entity_id
    JOIN users u ON u.user_id = s.staff_id
SET l.facility_id = u.facility_id
WHERE l.entity_type = 'STAFF_ASSIGNMENT' AND l.facility_id IS NULL;

-- Tài khoản: users.facility_id của đối tượng bị tác động
UPDATE activity_logs l
    JOIN users u ON u.user_id = l.entity_id
SET l.facility_id = u.facility_id
WHERE l.entity_type = 'USER' AND l.facility_id IS NULL;
