-- V20: bổ sung cột cho Policy/Ticket/Unit management APIs (sprint API hoá FE)
-- + rationale cho forced checkout (early checkout / đổi kho).

-- Policy API: audit ai/cập nhật lúc nào trên rental_policies
ALTER TABLE rental_policies
    ADD COLUMN updated_at DATETIME(6) NULL AFTER status,
    ADD COLUMN updated_by VARCHAR(150) NULL AFTER updated_at;

-- Ticket API: mô tả sự cố + ghi chú xử lý/điều phối/kết quả
ALTER TABLE support_tickets
    ADD COLUMN description VARCHAR(1000) NULL AFTER incident_type,
    ADD COLUMN manager_plan VARCHAR(1000) NULL AFTER description,
    ADD COLUMN severity_mode VARCHAR(20) NULL AFTER manager_plan,
    ADD COLUMN relocated_unit_code VARCHAR(20) NULL AFTER severity_mode,
    ADD COLUMN resolution_note VARCHAR(1000) NULL AFTER relocated_unit_code,
    ADD COLUMN escalation_reason VARCHAR(1000) NULL AFTER resolution_note,
    ADD COLUMN resolved_at DATETIME(6) NULL AFTER escalation_reason;

-- Unit management: ghi chú vận hành (không có trường giá — giá thuộc policy)
ALTER TABLE units
    ADD COLUMN notes VARCHAR(500) NULL AFTER access_type;

-- Forced checkout / đổi kho: lý do buộc checkout sớm
-- (VIOLATION = đuổi vi phạm, TRANSFER = đổi kho; NULL = checkout thường)
ALTER TABLE checkout_requests
    ADD COLUMN checkout_type VARCHAR(20) NULL AFTER status;
