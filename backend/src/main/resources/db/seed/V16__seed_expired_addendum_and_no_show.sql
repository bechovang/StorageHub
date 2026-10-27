-- ============================================================================
-- StorageHub — Flyway V16 (dev only) — Kịch bản Phụ lục Expired/Voided & Đơn No-show
-- Phục vụ: US-19 (Đóng phụ lục không ký: EXPIRED & VOIDED), US-10 (Tịch thu cọc No-show)
-- Kịch bản:
--   1. Phụ lục CT-1050-A1 quá hạn ký 7 ngày -> chuyển EXPIRED (đóng hồ sơ).
--   2. Phụ lục CT-1050-A2 bị nhân viên hủy chủ động do khách trả kho sớm -> VOIDED.
--   3. Đơn đặt kho BK-1048 trên LOCK-5 quá hạn nhận kho 5 ngày -> EXPIRED (mất cọc).
-- ============================================================================

-- 1. Phụ lục EXPIRED và VOIDED thuộc hợp đồng CT-1050 (M-1)
INSERT INTO contract_addendums (addendum_id, contract_id, extension_id, code, content_snapshot,
                                signed_photo_url, signature_due_date, status, created_at) VALUES
    -- Phụ lục quá hạn 7 ngày khách không đến ký, nhân viên đóng hồ sơ (EXPIRED)
    (6, 40, NULL, 'CT-1050-A1',
     '{"change":"extend +15 days","extension_fee":190000,"policy":"v3"}',
     NULL, DATE_SUB(CURDATE(), INTERVAL 2 DAY), 'EXPIRED', DATE_SUB(NOW(6), INTERVAL 10 DAY)),

    -- Phụ lục nhân viên hủy chủ động do khách thay đổi kế hoạch (VOIDED)
    (7, 40, NULL, 'CT-1050-A2',
     '{"change":"extend +1 month draft cancelled","extension_fee":380000,"policy":"v3"}',
     NULL, DATE_SUB(CURDATE(), INTERVAL 1 DAY), 'VOIDED', DATE_SUB(NOW(6), INTERVAL 5 DAY));

-- 2. Đơn đặt cọc LOCK-5 quá hạn nhận kho (No-show EXPIRED, tịch thu cọc giữ chỗ)
INSERT INTO reservations (reservation_id, code, customer_id, unit_id, start_date, end_date,
                          deposit_amount, access_code, status, created_at) VALUES
    (62, 'BK-1048', 6, 20,
        DATE_SUB(CURDATE(), INTERVAL 5 DAY),
        DATE_ADD(DATE_SUB(CURDATE(), INTERVAL 5 DAY), INTERVAL 30 DAY),
        10000, NULL, 'EXPIRED', DATE_SUB(NOW(6), INTERVAL 10 DAY));

INSERT INTO contracts (contract_id, code, reservation_id, policy_id, content_snapshot,
                       signed_photo_url, status, supersedes_contract_id, is_latest, created_at) VALUES
    (62, 'CT-1048', 62, 2,
     '{"unit":"LOCK-5","term":"1 month","rent":100000,"deposit":10000,"policy":"v3"}',
     NULL, 'CLOSED', NULL, 1, DATE_SUB(NOW(6), INTERVAL 10 DAY));

INSERT INTO payments (payment_id, receipt_code, payer_id, reservation_id, extension_id,
                      settlement_id, purpose, method, amount, status, created_at) VALUES
    (63, 'RT-2026-0063', 6, 62, NULL, NULL, 'DEPOSIT', 'VNPAY', 10000, 'SUCCEEDED', DATE_SUB(NOW(6), INTERVAL 10 DAY));

-- Ghi nhận vết kiểm toán tịch thu cọc No-show
INSERT INTO activity_logs (actor_id, entity_type, entity_id, action, from_value, to_value, reason, created_at) VALUES
    (5, 'RESERVATION', 62, 'STATUS_CHANGE', 'RESERVED', 'EXPIRED', 'No-show after check-in window expired, deposit forfeited', DATE_SUB(NOW(6), INTERVAL 4 DAY));
