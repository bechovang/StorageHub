-- ============================================================================
-- StorageHub — Flyway V13 (dev only) — Doanh thu 6 tháng & Chuông thông báo
-- Phục vụ: US-31 (Business Overview & Reports), US-32 (Facility Overview), US-17 (Notifications)
-- Flow: Chuyên viên Hằng mở Business Overview xem biểu đồ doanh thu 6 tháng ->
--       Bấm vào KPI drill-down xem danh sách thanh toán -> Các người dùng
--       mở chuông thông báo xem các thông điệp nghiệp vụ tương ứng với vai trò.
-- ============================================================================

-- 1. Bổ sung các khoản thanh toán trong 5 tháng qua cho MonthlyRevenueChart:
INSERT INTO payments (payment_id, receipt_code, payer_id, reservation_id, extension_id,
                      settlement_id, purpose, method, amount, status, created_at) VALUES
    -- Tháng thứ 5 trước (cách 150 ngày)
    (50, 'RT-2026-0050', 1, 1,  NULL, NULL, 'RENT',          'CARD', 1035000, 'SUCCEEDED', DATE_SUB(NOW(6), INTERVAL 150 DAY)),
    -- Tháng thứ 4 trước (cách 120 ngày)
    (51, 'RT-2026-0051', 8, 41, NULL, NULL, 'RENT',          'CARD', 1780000, 'SUCCEEDED', DATE_SUB(NOW(6), INTERVAL 120 DAY)),
    -- Tháng thứ 3 trước (cách 90 ngày)
    (52, 'RT-2026-0052', 6, 40, NULL, NULL, 'RENT',          'MOMO',  890000, 'SUCCEEDED', DATE_SUB(NOW(6), INTERVAL 90 DAY)),
    -- Tháng thứ 2 trước (cách 60 ngày)
    (53, 'RT-2026-0053', 9, 42, NULL, NULL, 'RENT',          'CARD', 1380000, 'SUCCEEDED', DATE_SUB(NOW(6), INTERVAL 60 DAY)),
    -- Tháng trước (cách 10 ngày)
    (54, 'RT-2026-0054', 1, 30, NULL, NULL, 'EXTENSION_FEE', 'CARD',  345000, 'SUCCEEDED', DATE_SUB(NOW(6), INTERVAL 10 DAY));

-- 2. Đơn đặt kho S-5 dự phòng trong tương lai của Lan (giữ chỗ)
INSERT INTO reservations (reservation_id, code, customer_id, unit_id, start_date, end_date,
                          deposit_amount, access_code, status, created_at) VALUES
    (47, 'BK-1057', 1, 16,
        DATE_ADD(CURDATE(), INTERVAL 5 DAY),
        DATE_ADD(CURDATE(), INTERVAL 65 DAY),
        34500, NULL, 'RESERVED', DATE_SUB(NOW(6), INTERVAL 1 DAY));

INSERT INTO payments (payment_id, receipt_code, payer_id, reservation_id, extension_id,
                      settlement_id, purpose, method, amount, status, created_at) VALUES
    (48, 'RT-2026-0048', 1, 47, NULL, NULL, 'DEPOSIT', 'MOMO', 34500, 'SUCCEEDED', DATE_SUB(NOW(6), INTERVAL 1 DAY));

-- 3. Chuỗi thông báo Notification Feed theo vai trò:
INSERT INTO notifications (user_id, type, title, deep_link, is_read, created_at) VALUES
    (1, 'BOOKING_CONFIRMED',    'Đơn đặt kho S-4 đã được xác nhận thành công.',           '/rentals/30', 1, DATE_SUB(NOW(6), INTERVAL 10 DAY)),
    (1, 'ADDENDUM_AWAITING',    'Phụ lục gia hạn CT-2031-A1 đang chờ ký tại quầy.',       '/rentals/30', 0, DATE_SUB(NOW(6), INTERVAL 1 DAY)),
    (1, 'BOOKING_CONFIRMED',    'Đặt chỗ kho S-5 thành công. Hẹn ngày nhận kho sắp tới.', '/rentals/47', 0, DATE_SUB(NOW(6), INTERVAL 1 DAY)),
    (6, 'CHECKOUT_REQUESTED',   'Yêu cầu trả kho M-1 đã được gửi tới nhân viên tiếp nhận.', '/rentals/40', 1, DATE_SUB(NOW(6), INTERVAL 3 HOUR)),
    (9, 'TICKET_RECEIVED',      'Yêu cầu hỗ trợ sự cố SR-0033 đã được tiếp nhận.',        '/support/2',  1, DATE_SUB(NOW(6), INTERVAL 3 HOUR)),
    (9, 'CHECK_IN_COMPLETED',   'Nhận kho S-2 hoàn tất. Mã mở kho của bạn là 918273.',     '/rentals/42', 1, DATE_SUB(NOW(6), INTERVAL 20 DAY)),
    (2, 'TASK_ASSIGNED',        'Bạn có 4 công việc mới cần xử lý trong ca trực sáng.',   '/tasks',      0, DATE_SUB(NOW(6), INTERVAL 4 HOUR)),
    (4, 'ESCALATION_PENDING',   'Có 1 yêu cầu chuyển giao cấp quản lý cần duyệt (SR-0033).', '/facility', 0, DATE_SUB(NOW(6), INTERVAL 2 HOUR)),
    (8, 'BOOKING_CONFIRMED',    'Đơn đặt kho L-1 đã thanh toán cọc thành công.',          '/rentals/41', 1, DATE_SUB(NOW(6), INTERVAL 45 DAY)),
    (8, 'SETTLEMENT_COMPLETED', 'Thanh lý hoàn cọc kho LOCK-3 đã hoàn tất (10.000 ₫).',    '/rentals/45', 1, DATE_SUB(NOW(6), INTERVAL 10 DAY));
