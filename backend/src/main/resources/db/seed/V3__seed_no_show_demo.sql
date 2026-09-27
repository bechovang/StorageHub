-- US-10 (FR-36) — dữ liệu demo no-show: khách Lan đã trả cọc giữ S-1
-- nhưng quá hạn nhận kho 2 ngày, chưa check-in.
-- start_date tính tương đối CURDATE() nên luôn "quá hạn" bất kể lúc seed chạy
-- (không sửa V2 đã apply — Flyway sẽ break checksum).
--
-- Lần GET /api/v1/reservations/4 ĐẦU TIÊN sẽ áp side-effect exactly-once (AD-4):
-- mất cọc (ActivityLog), unit S-1 RESERVED -> AVAILABLE, notification
-- RESERVATION_EXPIRED. Không seed contract — closeForNoShow xử lý gracefully.

INSERT INTO reservations (reservation_id, code, customer_id, unit_id, start_date, end_date,
                          deposit_amount, access_code, status, created_at) VALUES
    (4, 'BK-1045', 1, 1,
        DATE_SUB(CURDATE(), INTERVAL 2 DAY),
        DATE_SUB(DATE_ADD(DATE_SUB(CURDATE(), INTERVAL 2 DAY), INTERVAL 3 MONTH), INTERVAL 1 DAY),
        69000, NULL, 'RESERVED', DATE_SUB(NOW(6), INTERVAL 5 DAY));

INSERT INTO payments (payment_id, receipt_code, payer_id, reservation_id, extension_id,
                      settlement_id, purpose, method, amount, status, created_at) VALUES
    (10, 'RT-0879', 1, 4, NULL, NULL, 'DEPOSIT', 'VNPAY', 69000, 'SUCCEEDED',
        DATE_SUB(NOW(6), INTERVAL 5 DAY));

-- Cột unit đang RESERVED (cọc đã trả giữ chỗ). Lưu ý: availability browse là
-- derive-on-read nên cột này chỉ mang nghĩa demo flip RESERVED -> AVAILABLE.
UPDATE units SET status = 'RESERVED' WHERE unit_id = 1;
