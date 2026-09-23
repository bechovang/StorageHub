-- ============================================================================
-- StorageHub — Flyway V2 (dev only) — seed demo chuẩn
-- Nguồn: ARCHITECTURE-SPINE.md (mock chuẩn: Lan/Minh/Hằng/Tuấn/Nam;
--        S-3/M-2/M-5; BK-1042, RT-0871, SR-0032, CT-1042, CT-1042-A1; policy v3)
--        + PRD UJ-1..6 + EXPERIENCE.md Flow 1..6.
--
-- SNAPSHOT = 2026-10-20 (thứ Ba) — chọn để mọi beat demo còn "chơi được live":
--   * Arc trọn vẹn của Lan đã KHÉP (settlement receipt 132.500 hiển thị được).
--   * M-2 đang stuck Rented (khách đã rời Oct 1, desk chưa xử lý checkout)
--     → Tuấn demo fix status + reason, lọt Activity Log (UJ-4).
--   * M-4 vừa hết maintenance → Preparing + Cleaning task hôm nay (kanban sống).
--   * SR-0033 OPEN hôm nay gán Minh → beat xử lý ticket live (UJ-2).
--   * S-2 AVAILABLE → demo Retire live; M-5 AVAILABLE → đích relocation (UJ-5).
--   * Vũ (staff đã nghỉ, status 2 locked) + 3 lần LOGIN_FAILED sáng nay
--     → Nam demo User Management + Login History (UJ-6).
--
-- Timeline (tất cả số tiền khớp PRD UJ-1 đến đồng):
--   2026-04-20  Lan đặt S-3: 05-18 → 08-18 (3 tháng × 345.000 = 1.035.000),
--               cọc 10% = 103.500 MoMo (RT-0871, sau 1 lần VNPAY fail);
--               BK-1042 RESERVED, CT-1042 DRAFT.
--   2026-05-18  Check-in (Minh): trả rent 1.035.000 CARD, ký CT-1042,
--               nhận PIN; S-3 → RENTED.
--   2026-06-30  SR-0032 "cửa kẹt" → Minh RESOLVED (07-01).
--   2026-07-20  Trang đặt S-3 (BK-1044) start 10-19 → 12-19 (2 tháng
--               × 345.000 = 690.000, cọc 69.000 VNPAY) — chính reservation
--               này chặn extension của Lan ở Oct 19 (microcopy chuẩn).
--   2026-08-05  Lan gia hạn: muốn 10-20, bị chặn (BK-1044 start 10-19)
--               → chọn 10-18: phí 690.000 + top-up cọc 69.000 (cọc giữ
--               103.500 → 172.500 = 10% × 1.725.000); phụ lục CT-1042-A1
--               hạn ký 08-12, ký 08-10.
--   2026-08-01  Trang check-in M-2: BK-1043 (3 tháng × 380.000 = 1.140.000,
--               cọc 114.000), CT-1043.
--   2026-10-01  Trang rời M-2 sớm (downsize) — desk quên xử lý checkout.
--   2026-10-10  Lan gửi Checkout Request cho 10-18.
--   2026-10-18  Checkout (Minh): STRUCTURE MAJOR → phí hư hại 40.000 (kèm
--               lý do), hoàn 132.500, TL-0042; BK-1042 CLOSED, S-3 Preparing.
--   2026-10-19  Trang check-in S-3 (BK-1044), S-3 → RENTED lại.
--
-- Tài khoản demo: password chung "password" (bcrypt), email * @demo.storagehub.vn.
-- Users ngoài 5 persona chuẩn: Trang (CUSTOMER —_keep M-2/S-3 story chạy được)
-- và Vũ (STAFF locked — dữ liệu cho User Mgmt của Nam).
-- ============================================================================

-- ------------------------------------------------------------- CƠ SỞ ----

INSERT INTO facilities (facility_id, name, address, phone, status) VALUES
    (1, 'Tân Bình Depot', '144 Nguyễn Thái Bình, Phường 4, Tân Bình, TP.HCM', '02839998877', 1);

INSERT INTO zones (zone_id, facility_id, code, floor) VALUES
    (1, 1, 'A', 1),   -- S-1..S-4, M-1, M-2
    (2, 1, 'B', 2),   -- M-3..M-5, L-1, L-2
    (3, 1, 'C', 1);   -- LOCK-1..LOCK-4

INSERT INTO unit_types (type_id, name, description) VALUES
    (1, 'Locker', 'Ô tủ 1,5 m² cho đồ nhỏ, hành lang C'),
    (2, 'S',      'Kho nhỏ 5 m², indoor'),
    (3, 'M',      'Kho trung 8 m², indoor'),
    (4, 'L',      'Kho lớn 15 m², lầu 2');

-- ----------------------------------------------------------- CHÍNH SÁCH ----
-- v2 = ngừng (chỉ còn ở history + report theo kỳ); v3 = đang dùng — mọi
-- contract seed đều khoá v3. Rent: Locker 100k / S 345k / M 380k / L 890k
-- (khớp bảng giá F4-02). Buffer 1 ngày → "checkout 10-18, khách kế 10-19".

INSERT INTO rental_policies (policy_id, version, effective_date, status) VALUES
    (1, 'v2', '2026-01-01', 2),
    (2, 'v3', '2026-04-01', 1);

INSERT INTO policy_rules (policy_id, type_id, rule_type, surcharge_type, value, cap) VALUES
    -- v2 (giá cũ, ngừng dùng)
    (1, 1, 'RENT_RATE',       NULL, 100000, NULL),
    (1, 2, 'RENT_RATE',       NULL, 330000, NULL),
    (1, 3, 'RENT_RATE',       NULL, 360000, NULL),
    (1, 4, 'RENT_RATE',       NULL, 850000, NULL),
    (1, 1, 'DEPOSIT_RATE',    NULL, 10,     NULL),
    (1, 2, 'DEPOSIT_RATE',    NULL, 10,     NULL),
    (1, 3, 'DEPOSIT_RATE',    NULL, 10,     NULL),
    (1, 4, 'DEPOSIT_RATE',    NULL, 10,     NULL),
    (1, 1, 'TURNOVER_BUFFER', NULL, 1,      NULL),
    (1, 2, 'TURNOVER_BUFFER', NULL, 1,      NULL),
    (1, 3, 'TURNOVER_BUFFER', NULL, 1,      NULL),
    (1, 4, 'TURNOVER_BUFFER', NULL, 1,      NULL),
    -- v3 (đang dùng)
    (2, 1, 'RENT_RATE',       NULL,   100000, NULL),   -- Locker /mo
    (2, 2, 'RENT_RATE',       NULL,   345000, NULL),   -- S /mo (chuẩn UJ-1)
    (2, 3, 'RENT_RATE',       NULL,   380000, NULL),   -- M /mo
    (2, 4, 'RENT_RATE',       NULL,   890000, NULL),   -- L /mo
    (2, 1, 'DEPOSIT_RATE',    NULL,   10,     NULL),   -- % tổng tiền thuê
    (2, 2, 'DEPOSIT_RATE',    NULL,   10,     NULL),
    (2, 3, 'DEPOSIT_RATE',    NULL,   10,     NULL),
    (2, 4, 'DEPOSIT_RATE',    NULL,   10,     NULL),
    (2, 1, 'TURNOVER_BUFFER', NULL,   1,      NULL),   -- ngày dọn sau checkout
    (2, 2, 'TURNOVER_BUFFER', NULL,   1,      NULL),
    (2, 3, 'TURNOVER_BUFFER', NULL,   1,      NULL),
    (2, 4, 'TURNOVER_BUFFER', NULL,   1,      NULL),
    (2, 1, 'LATE_FEE',        NULL,   10000,  NULL),   -- /ngày trễ quá EndDate
    (2, 2, 'LATE_FEE',        NULL,   35000,  NULL),
    (2, 3, 'LATE_FEE',        NULL,   38000,  NULL),
    (2, 4, 'LATE_FEE',        NULL,   90000,  NULL),
    (2, 1, 'SURCHARGE',       'PERCENT', 5,   10),     -- late-checkout 5%,
    (2, 2, 'SURCHARGE',       'PERCENT', 5,   10),     -- trần 10% (Hằng bị
    (2, 3, 'SURCHARGE',       'PERCENT', 5,   10),     -- chặn ở 15% — UJ-3)
    (2, 4, 'SURCHARGE',       'PERCENT', 5,   10),
    (2, 3, 'DISCOUNT',        'PERCENT', 5,   NULL),   -- FR-40 giảm giá theo type
    (2, 4, 'DISCOUNT',        'PERCENT', 10,  NULL),
    (2, 1, 'WAIVER_CAP',      NULL,   50000,  NULL),   -- FR-41 trần miễn phí
    (2, 2, 'WAIVER_CAP',      NULL,   50000,  NULL),
    (2, 3, 'WAIVER_CAP',      NULL,   50000,  NULL),
    (2, 4, 'WAIVER_CAP',      NULL,   50000,  NULL);

-- -------------------------------------------------------------- USERS ----
-- roles 1..5 đã có ở V1. Password hash = bcrypt("password").

INSERT INTO users (user_id, full_name, email, phone, password_hash, role_id, facility_id, status, created_at) VALUES
    (1, 'Nguyễn Thị Lan',    'lan@demo.storagehub.vn',    '0901234567', '$2a$10$dXJ3SW6G7P50lGmMkkmwe.20cQQubK3.HZWzG3YB1tlRy.fqvM/BG', 1, NULL, 1, '2026-04-18 08:00:00.000000'),
    (2, 'Trần Minh',         'minh@demo.storagehub.vn',   '0902345678', '$2a$10$dXJ3SW6G7P50lGmMkkmwe.20cQQubK3.HZWzG3YB1tlRy.fqvM/BG', 2, 1,    1, '2026-01-05 08:00:00.000000'),
    (3, 'Lê Thị Hằng',       'hang@demo.storagehub.vn',   '0903456789', '$2a$10$dXJ3SW6G7P50lGmMkkmwe.20cQQubK3.HZWzG3YB1tlRy.fqvM/BG', 4, NULL, 1, '2026-01-05 08:00:00.000000'),
    (4, 'Phạm Tuấn',         'tuan@demo.storagehub.vn',   '0904567890', '$2a$10$dXJ3SW6G7P50lGmMkkmwe.20cQQubK3.HZWzG3YB1tlRy.fqvM/BG', 3, 1,    1, '2026-01-05 08:00:00.000000'),
    (5, 'Hoàng Nam',         'nam@demo.storagehub.vn',    '0905678901', '$2a$10$dXJ3SW6G7P50lGmMkkmwe.20cQQubK3.HZWzG3YB1tlRy.fqvM/BG', 5, NULL, 1, '2026-01-05 08:00:00.000000'),
    (6, 'Phạm Thị Trang',    'trang@demo.storagehub.vn',  '0906789012', '$2a$10$dXJ3SW6G7P50lGmMkkmwe.20cQQubK3.HZWzG3YB1tlRy.fqvM/BG', 1, NULL, 1, '2026-07-15 08:00:00.000000'),
    (7, 'Vũ Văn Vũ',         'vu@demo.storagehub.vn',     '0907890123', '$2a$10$dXJ3SW6G7P50lGmMkkmwe.20cQQubK3.HZWzG3YB1tlRy.fqvM/BG', 2, 1,    2, '2026-02-01 08:00:00.000000'); -- departed, locked (UJ-6)

-- -------------------------------------------------------------- UNITS ----
-- Trạng thái tại 2026-10-20:
--   S-3 RENTED (Trang, BK-1044) · M-2 RENTED stuck (Trang đã rời 10-01)
--   M-4 PREPARING (vừa hết maintenance) · L-2 MAINTENANCE · LOCK-4 RETIRED
--   S-2 AVAILABLE (demo Retire) · M-5 AVAILABLE (đích relocation) · còn lại AVAILABLE

INSERT INTO units (unit_id, code, type_id, zone_id, size_m2, floor, access_type, status) VALUES
    (1,  'S-1',    2, 1, 5.00,    1, 'QR',         'AVAILABLE'),
    (2,  'S-2',    2, 1, 5.00,    1, 'PIN',        'AVAILABLE'), -- beat Retire (UJ-4)
    (3,  'S-3',    2, 1, 5.00,    1, 'PIN',        'RENTED'),    -- Trang BK-1044
    (4,  'S-4',    2, 1, 5.00,    1, 'QR',         'AVAILABLE'),
    (5,  'M-1',    3, 1, 8.00,    1, 'QR',         'AVAILABLE'),
    (6,  'M-2',    3, 1, 8.00,    1, 'PIN',        'RENTED'),    -- stuck — beat fix status (UJ-4)
    (7,  'M-3',    3, 2, 8.00,    2, 'QR',         'AVAILABLE'),
    (8,  'M-4',    3, 2, 8.00,    2, 'smart lock', 'PREPARING'), -- cleaning task hôm nay
    (9,  'M-5',    3, 2, 8.00,    2, 'smart lock', 'AVAILABLE'), -- đích relocation (UJ-5)
    (10, 'L-1',    4, 2, 15.00,   2, 'smart lock', 'AVAILABLE'),
    (11, 'L-2',    4, 2, 15.00,   2, 'smart lock', 'MAINTENANCE'),
    (12, 'LOCK-1', 1, 3, 1.50,    1, 'QR',         'AVAILABLE'),
    (13, 'LOCK-2', 1, 3, 1.50,    1, 'QR',         'AVAILABLE'),
    (14, 'LOCK-3', 1, 3, 1.50,    1, 'QR',         'AVAILABLE'),
    (15, 'LOCK-4', 1, 3, 1.50,    1, 'QR',         'RETIRED');

-- ------------------------------------------------- LỊCH TRỰC (Minh) ----
-- 10-12 Zone B = ngày collision trong microcopy chuẩn (UJ-4); tuần hiện tại
-- cho lưới lịch + định tuyến ticket theo unit + shift.

INSERT INTO staff_assignments (staff_id, zone_id, shift, work_date) VALUES
    (2, 2, 'MORNING',   '2026-10-12'),
    (2, 1, 'MORNING',   '2026-10-19'),
    (2, 1, 'MORNING',   '2026-10-20'),
    (2, 2, 'MORNING',   '2026-10-21'),
    (2, 2, 'MORNING',   '2026-10-22'),
    (2, 1, 'MORNING',   '2026-10-23');

-- -------------------------------------------------------- RESERVATIONS ----
-- deposit_amount = cọc đang giữ cuối cùng (BK-1042: 172.500 sau top-up).

INSERT INTO reservations (reservation_id, code, customer_id, unit_id, start_date, end_date, deposit_amount, access_code, status, created_at) VALUES
    (1, 'BK-1042', 1, 3,  '2026-05-18', '2026-10-18', 172500, '482913', 'CLOSED',            '2026-04-20 09:12:00.000000'),
    (2, 'BK-1043', 6, 6,  '2026-08-01', '2026-11-01', 114000, '731905', 'CHECKED_IN',        '2026-07-28 10:30:00.000000'), -- M-2: khách rời 10-01, desk chưa xử lý
    (3, 'BK-1044', 6, 3,  '2026-10-19', '2026-12-19',  69000, '159034', 'CHECKED_IN',        '2026-07-20 14:05:00.000000');

INSERT INTO extensions (reservation_id, old_end_date, new_end_date, extension_fee, status, created_at) VALUES
    (1, '2026-08-18', '2026-10-18', 690000, 'APPLIED', '2026-08-05 11:20:00.000000');

INSERT INTO checkout_requests (reservation_id, requested_date, status, created_at) VALUES
    (1, '2026-10-18', 'DONE', '2026-10-10 15:40:00.000000');

-- ---------------------------------------------------------- CONTRACTS ----

INSERT INTO contracts (contract_id, code, reservation_id, policy_id, content_snapshot, signed_photo_url, status, supersedes_contract_id, is_latest, created_at) VALUES
    (1, 'CT-1042', 1, 2,
     '{"unit":"S-3","term":"2026-05-18/2026-10-18 (sau gia hạn)","rent":1725000,"deposit":172500,"policy":"v3","late_fee":"35000/day","surcharge":"5% cap 10%"}',
     '/storage/contracts/CT-1042-signed.jpg', 'CLOSED', NULL, 1, '2026-04-20 09:13:00.000000'),
    (2, 'CT-1043', 2, 2,
     '{"unit":"M-2","term":"2026-08-01/2026-11-01","rent":1140000,"deposit":114000,"policy":"v3"}',
     '/storage/contracts/CT-1043-signed.jpg', 'ACTIVE', NULL, 1, '2026-07-28 10:31:00.000000'),
    (3, 'CT-1044', 3, 2,
     '{"unit":"S-3","term":"2026-10-19/2026-12-19","rent":690000,"deposit":69000,"policy":"v3"}',
     '/storage/contracts/CT-1044-signed.jpg', 'ACTIVE', NULL, 1, '2026-07-20 14:06:00.000000');

INSERT INTO contract_addendums (contract_id, extension_id, code, content_snapshot, signed_photo_url, signature_due_date, status, created_at) VALUES
    (1, 1, 'CT-1042-A1',
     '{"change":"extend 2026-08-18 -> 2026-10-18","extension_fee":690000,"deposit_topup":69000,"deposit_held":172500,"policy":"v3"}',
     '/storage/contracts/CT-1042-A1-signed.jpg', '2026-08-12', 'SIGNED', '2026-08-05 11:21:00.000000');

-- ------------------------------------------------- SETTLEMENT & CHECK ----

INSERT INTO settlements (settlement_id, reservation_id, contract_id, staff_id, damage_fee, damage_reason, refund_amount, receipt_code, created_at) VALUES
    (1, 1, 1, 2, 40000, 'Tường trầy xước dưới kệ, đã sơn lại (STRUCTURE MAJOR)', 132500, 'TL-0042', '2026-10-18 16:05:00.000000');

INSERT INTO inspections (settlement_id, item, result, note) VALUES
    (1, 'ACCESS_CARD',  'OK',    NULL),
    (1, 'PADLOCK',      'OK',    NULL),
    (1, 'CLEANLINESS',  'OK',    NULL),
    (1, 'STRUCTURE',    'MAJOR', 'Vết trầy tường ~40cm dưới kệ');

-- ---------------------------------------------------------- PAYMENTS ----
-- RT-0871 = biên lai chuẩn trong mock. RT-0870 = lần VNPAY fail trước đó
-- (payment modal retry story). CHECK: mỗi payment đúng 1 nguồn.

INSERT INTO payments (payment_id, receipt_code, payer_id, reservation_id, extension_id, settlement_id, purpose, method, amount, status, created_at) VALUES
    (1, 'RT-0870', 1, 1, NULL, NULL, 'DEPOSIT',       'VNPAY', 103500,  'FAILED',    '2026-04-20 09:10:00.000000'),
    (2, 'RT-0871', 1, 1, NULL, NULL, 'DEPOSIT',       'MOMO',  103500,  'SUCCEEDED', '2026-04-20 09:12:00.000000'),
    (3, 'RT-0872', 1, 1, NULL, NULL, 'RENT',          'CARD',  1035000, 'SUCCEEDED', '2026-05-18 08:45:00.000000'),
    (4, 'RT-0873', 1, NULL, 1, NULL, 'EXTENSION_FEE', 'MOMO',  690000,  'SUCCEEDED', '2026-08-05 11:20:00.000000'),
    (5, 'RT-0874', 1, 1, NULL, NULL, 'DEPOSIT',       'MOMO',  69000,   'SUCCEEDED', '2026-08-05 11:22:00.000000'), -- top-up cọc
    (6, 'RT-0875', 6, 3, NULL, NULL, 'DEPOSIT',       'VNPAY', 69000,   'SUCCEEDED', '2026-07-20 14:05:00.000000'),
    (7, 'RT-0876', 6, 3, NULL, NULL, 'RENT',          'CARD',  690000,  'SUCCEEDED', '2026-10-19 09:05:00.000000'),
    (8, 'RT-0877', 6, 2, NULL, NULL, 'DEPOSIT',       'MOMO',  114000,  'SUCCEEDED', '2026-07-28 10:30:00.000000'),
    (9, 'RT-0878', 6, 2, NULL, NULL, 'RENT',          'CARD',  1140000, 'SUCCEEDED', '2026-08-01 08:40:00.000000');

-- ------------------------------------------------------------ TICKETS ----

INSERT INTO support_tickets (ticket_id, code, customer_id, unit_id, reservation_id, incident_type, status, assigned_staff_id, created_at) VALUES
    (1, 'SR-0032', 1, 3, 1, 'DEVICE_ISSUE', 'RESOLVED',   2, '2026-06-30 10:15:00.000000'), -- cửa kẹt — Minh xử lý xong
    (2, 'SR-0033', 6, 3, 3, 'LOST_ACCESS',  'OPEN',       2, '2026-10-20 08:05:00.000000'); -- quên PIN — card hỗ trợ hôm nay

-- ------------------------------------------------------------- TASKS ----
-- Kanban hôm 2026-10-20: SUPPORT (TODO) + CLEANING (TODO); còn lại là history.

INSERT INTO tasks (task_id, type, ref_code, assigned_staff_id, work_date, status, created_at) VALUES
    (1, 'CHECK_IN',  'BK-1043', 2, '2026-08-01',  'DONE', '2026-08-01 07:00:00.000000'),
    (2, 'CHECK_IN',  'BK-1044', 2, '2026-10-19',  'DONE', '2026-10-19 07:00:00.000000'),
    (3, 'CHECKOUT',  'BK-1042', 2, '2026-10-18',  'DONE', '2026-10-18 07:00:00.000000'),
    (4, 'CLEANING',  NULL,      2, '2026-10-20',  'TODO', '2026-10-19 18:00:00.000000'), -- M-4 sau maintenance
    (5, 'SUPPORT',   'SR-0033', 2, '2026-10-20',  'TODO', '2026-10-20 08:05:00.000000');

-- ------------------------------------------------------ NOTIFICATIONS ----

INSERT INTO notifications (user_id, type, title, deep_link, is_read, created_at) VALUES
    (1, 'BOOKING_CONFIRMED',     'Unit S-3 reserved. Deposit 103.500 ₫ received.',   '/rentals/1',     1, '2026-04-20 09:12:00.000000'),
    (1, 'CHECK_IN_COMPLETED',    'Rental active. Your access code is ready.',         '/rentals/1',     1, '2026-05-18 08:50:00.000000'),
    (1, 'TICKET_RESOLVED',       'SR-0032 resolved — sticky door fixed.',             '/support/1',     1, '2026-07-01 09:00:00.000000'),
    (1, 'EXTENSION_APPLIED',     'New checkout: Oct 18. Receipt 690.000 ₫ + 69.000 ₫ deposit top-up.', '/rentals/1', 1, '2026-08-05 11:22:00.000000'),
    (1, 'ADDENDUM_SIGNED',       'Addendum CT-1042-A1 signed.',                       '/rentals/1',     1, '2026-08-10 10:00:00.000000'),
    (1, 'SETTLEMENT_COMPLETED',  'Checkout closed. Refund 132.500 ₫ after damage fee 40.000 ₫.',      '/rentals/1',  0, '2026-10-18 16:05:00.000000'),
    (6, 'BOOKING_CONFIRMED',     'Unit S-3 reserved for Oct 19. Deposit 69.000 ₫ received.', '/rentals/3', 1, '2026-07-20 14:05:00.000000'),
    (6, 'CHECK_IN_COMPLETED',    'Rental active. Your access code is ready.',         '/rentals/3',     0, '2026-10-19 09:06:00.000000'),
    (6, 'TICKET_CREATED',        'SR-0033 received — staff will contact you soon.',   '/support/2',     0, '2026-10-20 08:05:00.000000');

-- ------------------------------------------------------ ACTIVITY LOGS ----
-- Append-only: chỉ những write có thật trong timeline; M-2 KHÔNG có dòng
-- fix (im lặng) — beat của Tuấn sẽ sinh log live kèm reason.

INSERT INTO activity_logs (actor_id, entity_type, entity_id, action, from_value, to_value, reason, created_at) VALUES
    (1, 'RESERVATION', 1, 'CREATED',         NULL,        'PENDING_PAYMENT', 'Booking S-3 2026-05-18/2026-08-18',        '2026-04-20 09:12:00.000000'),
    (1, 'UNIT',        3, 'STATUS_CHANGE',   'AVAILABLE', 'RESERVED',        'Booking BK-1042 deposit paid',             '2026-04-20 09:12:00.000000'),
    (1, 'CONTRACT',    1, 'CREATED',         NULL,        'DRAFT',           'Auto-draft from booking BK-1042, policy v3','2026-04-20 09:13:00.000000'),
    (2, 'RESERVATION', 1, 'STATUS_CHANGE',   'RESERVED',  'CHECKED_IN',      'Check-in BK-1042, rent 1.035.000 paid',    '2026-05-18 08:50:00.000000'),
    (2, 'CONTRACT',    1, 'STATUS_CHANGE',   'PRINTED',   'SIGNED',          'Signed photo uploaded at desk',            '2026-05-18 08:52:00.000000'),
    (2, 'UNIT',        3, 'STATUS_CHANGE',   'RESERVED',  'RENTED',          'Check-in BK-1042',                         '2026-05-18 08:52:00.000000'),
    (2, 'TICKET',      1, 'STATUS_CHANGE',   'OPEN',      'RESOLVED',        'Lock re-lubricated, door swings freely',   '2026-07-01 09:00:00.000000'),
    (1, 'RESERVATION', 1, 'EXTENDED',        '2026-08-18','2026-10-18',      'Extension fee 690.000 + deposit top-up 69.000', '2026-08-05 11:22:00.000000'),
    (4, 'UNIT',        15,'STATUS_CHANGE',   'AVAILABLE', 'RETIRED',         'Locker section C remodeled',               '2026-09-02 14:00:00.000000'),
    (4, 'UNIT',        11,'STATUS_CHANGE',   'AVAILABLE', 'MAINTENANCE',     'Dehumidifier replacement',                 '2026-10-08 09:30:00.000000'),
    (1, 'RESERVATION', 1, 'STATUS_CHANGE',   'CHECKED_IN','CHECKOUT_REQUESTED', 'Checkout requested for 2026-10-18',     '2026-10-10 15:40:00.000000'),
    (4, 'UNIT',        8, 'STATUS_CHANGE',   'MAINTENANCE','PREPARING',      'Maintenance done, cleaning buffer',        '2026-10-19 17:55:00.000000'),
    (2, 'RESERVATION', 1, 'STATUS_CHANGE',   'CHECKOUT_REQUESTED', 'CLOSED', 'Settlement TL-0042: refund 132.500',       '2026-10-18 16:05:00.000000'),
    (2, 'UNIT',        3, 'STATUS_CHANGE',   'RENTED',    'PREPARING',       'Checkout BK-1042, turnover buffer 1 day',  '2026-10-18 16:05:00.000000'),
    (2, 'RESERVATION', 3, 'STATUS_CHANGE',   'RESERVED',  'CHECKED_IN',      'Check-in BK-1044, rent 690.000 paid',      '2026-10-19 09:05:00.000000'),
    (2, 'UNIT',        3, 'STATUS_CHANGE',   'PREPARING', 'RENTED',          'Check-in BK-1044',                         '2026-10-19 09:06:00.000000'),
    -- UJ-6: chuỗi login fail sáng nay của tài khoản locked
    (7, 'USER', 7, 'LOGIN_FAILED', NULL, NULL, 'Wrong password',        '2026-10-20 07:58:12.000000'),
    (7, 'USER', 7, 'LOGIN_FAILED', NULL, NULL, 'Wrong password',        '2026-10-20 07:58:40.000000'),
    (7, 'USER', 7, 'LOGIN_FAILED', NULL, NULL, 'Account locked',        '2026-10-20 07:59:05.000000');
