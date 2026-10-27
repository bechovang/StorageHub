-- ============================================================================
-- StorageHub — Flyway V15 (dev only) — Chính sách giá v4 nháp cho Business Ops
-- Phục vụ: US-30 (Policy Management — validate trước khi lưu / FR-29/30 / UJ-3)
-- Kịch bản: Hằng (Business Ops) vào màn hình /policy thấy lịch sử chính sách:
--           v2 (đã ngừng), v3 (đang dùng), v4 (bản nháp áp dụng tháng tới).
--           Hằng có thể thử chỉnh sửa phụ thu late-checkout lên 15% để thấy
--           hệ thống cắm cờ và chặn vi phạm trần 10%: "15% exceeds the 10% cap".
-- ============================================================================

-- 1. Tạo chính sách v4 ở trạng thái nháp (status = 0)
INSERT INTO rental_policies (policy_id, version, effective_date, status) VALUES
    (3, 'v4', DATE_ADD(CURDATE(), INTERVAL 1 MONTH), 0);

-- 2. Bộ quy tắc giá mới cho phiên bản v4
INSERT INTO policy_rules (policy_id, type_id, rule_type, surcharge_type, value, cap) VALUES
    -- Giá thuê cơ bản (Rent rate / tháng)
    (100, 3, 1, 'RENT_RATE',       NULL,   120000, NULL),   -- Locker: 120.000 ₫
    (101, 3, 2, 'RENT_RATE',       NULL,   360000, NULL),   -- S: 360.000 ₫
    (102, 3, 3, 'RENT_RATE',       NULL,   400000, NULL),   -- M: 400.000 ₫
    (103, 3, 4, 'RENT_RATE',       NULL,   920000, NULL),   -- L: 920.000 ₫

    -- Tỷ lệ cọc (% tổng tiền thuê hợp đồng)
    (104, 3, 1, 'DEPOSIT_RATE',    NULL,   10,     NULL),
    (105, 3, 2, 'DEPOSIT_RATE',    NULL,   10,     NULL),
    (106, 3, 3, 'DEPOSIT_RATE',    NULL,   10,     NULL),
    (107, 3, 4, 'DEPOSIT_RATE',    NULL,   10,     NULL),

    -- Thời gian đệm dọn dẹp Turnover buffer (ngày)
    (108, 3, 1, 'TURNOVER_BUFFER', NULL,   1,      NULL),
    (109, 3, 2, 'TURNOVER_BUFFER', NULL,   1,      NULL),
    (110, 3, 3, 'TURNOVER_BUFFER', NULL,   1,      NULL),
    (111, 3, 4, 'TURNOVER_BUFFER', NULL,   1,      NULL),

    -- Phí trễ hạn nhận/trả kho (/ngày)
    (112, 3, 1, 'LATE_FEE',        NULL,   15000,  NULL),
    (113, 3, 2, 'LATE_FEE',        NULL,   40000,  NULL),
    (114, 3, 3, 'LATE_FEE',        NULL,   45000,  NULL),
    (115, 3, 4, 'LATE_FEE',        NULL,   95000,  NULL),

    -- Phụ thu quá giờ (Surcharge 5%, trần khống chế 10%)
    (116, 3, 1, 'SURCHARGE',       'PERCENT', 5,   10),
    (117, 3, 2, 'SURCHARGE',       'PERCENT', 5,   10),
    (118, 3, 3, 'SURCHARGE',       'PERCENT', 5,   10),
    (119, 3, 4, 'SURCHARGE',       'PERCENT', 5,   10),

    -- Giảm giá ưu đãi theo loại kho (FR-40)
    (120, 3, 3, 'DISCOUNT',        'PERCENT', 5,   NULL),
    (121, 3, 4, 'DISCOUNT',        'PERCENT', 10,  NULL),

    -- Trần miễn giảm chi phí (Waiver cap - FR-41)
    (122, 3, 1, 'WAIVER_CAP',      NULL,   60000,  NULL),
    (123, 3, 2, 'WAIVER_CAP',      NULL,   60000,  NULL),
    (124, 3, 3, 'WAIVER_CAP',      NULL,   60000,  NULL),
    (125, 3, 4, 'WAIVER_CAP',      NULL,   60000,  NULL);
