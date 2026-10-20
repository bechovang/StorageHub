-- ============================================================================
-- V6: Thu hồi/dọn dẹp dữ liệu thuê kho demo của tài khoản Customer phụ (Trang)
-- Giữ lại tài khoản Lan với 1 kho đang thuê (S-4) và 1 hợp đồng cũ đã kết thúc (S-3)
-- Trả lại các kho S-2, S-3, M-2 về trạng thái AVAILABLE trên danh mục browse
-- Không sửa V2/V5 đã apply — Flyway sẽ break checksum
-- ============================================================================

-- 1. Xóa tasks liên quan đến các mã reservation và ticket của Trang / S-2 chained
DELETE FROM tasks WHERE ref_code IN ('BK-1043', 'BK-1044', 'BK-2032', 'BK-2033', 'SR-0033', 'CT-1043', 'CT-1044');

-- 2. Xóa escalations liên quan đến tickets của Trang
DELETE FROM escalations WHERE ticket_id IN (SELECT ticket_id FROM support_tickets WHERE reservation_id IN (2, 3, 31, 32) OR customer_id = 6);

-- 3. Xóa support tickets của Trang
DELETE FROM support_tickets WHERE reservation_id IN (2, 3, 31, 32) OR code = 'SR-0033' OR customer_id = 6;

-- 4. Xóa phụ lục hợp đồng liên quan đến các contracts / extensions bị xóa
DELETE FROM contract_addendums WHERE contract_id IN (SELECT contract_id FROM contracts WHERE reservation_id IN (2, 3, 31, 32))
   OR extension_id IN (SELECT extension_id FROM extensions WHERE reservation_id IN (2, 3, 31, 32));

-- 5. Xóa payments của các reservation / extension bị hủy / của Trang
DELETE FROM payments WHERE reservation_id IN (2, 3, 31, 32) OR payer_id = 6
   OR extension_id IN (SELECT extension_id FROM extensions WHERE reservation_id IN (2, 3, 31, 32));

-- 6. Xóa extensions của các reservation bị hủy
DELETE FROM extensions WHERE reservation_id IN (2, 3, 31, 32);

-- 7. Xóa checkout_requests của các reservation bị hủy
DELETE FROM checkout_requests WHERE reservation_id IN (2, 3, 31, 32);

-- 8. Xóa inspections của các settlements bị hủy (nếu có)
DELETE FROM inspections WHERE settlement_id IN (SELECT settlement_id FROM settlements WHERE reservation_id IN (2, 3, 31, 32));

-- 9. Xóa settlements của các reservation bị hủy (nếu có)
DELETE FROM settlements WHERE reservation_id IN (2, 3, 31, 32);

-- 10. Xóa contracts của các reservation bị hủy
DELETE FROM contracts WHERE reservation_id IN (2, 3, 31, 32);

-- 11. Xóa reservations của các kho trên / của Trang
DELETE FROM reservations WHERE reservation_id IN (2, 3, 31, 32) OR customer_id = 6;

-- 12. Xóa notifications demo của Trang
DELETE FROM notifications WHERE user_id = 6;

-- 13. Cập nhật các kho đã hết/hủy hợp đồng (S-2, S-3, M-2) về trạng thái AVAILABLE
UPDATE units SET status = 'AVAILABLE' WHERE unit_id IN (2, 3, 6);
