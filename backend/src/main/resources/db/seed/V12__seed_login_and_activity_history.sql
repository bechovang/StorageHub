-- ============================================================================
-- StorageHub — Flyway V12 (dev only) — Nhật ký kiểm toán & Lịch sử đăng nhập
-- Phục vụ: US-27 (Activity Log viewer), US-29 (Login History SYS-02 / UJ-6)
-- Flow: Admin Nam mở màn hình kiểm toán -> Xem các lần đăng nhập LOGIN / LOGIN_FAILED
--       sáng nay -> Thấy chuỗi đăng nhập thất bại của tài khoản nhân viên đã nghỉ (Vũ) ->
--       Lọc theo đối tượng (Unit, Reservation, Ticket) xem đầy đủ actor và lý do bắt buộc.
-- ============================================================================

INSERT INTO activity_logs (actor_id, entity_type, entity_id, action, from_value, to_value, reason, created_at) VALUES
    -- 1. Lịch sử đăng nhập sáng nay của các vai trò (SYS-02)
    (1,  'USER',        1,  'LOGIN',         NULL,              'SUCCESS',            'Khách hàng đăng nhập cổng web',         DATE_SUB(NOW(6), INTERVAL 3 HOUR)),
    (2,  'USER',        2,  'LOGIN',         NULL,              'SUCCESS',            'Nhân viên đăng nhập trạm làm việc',      DATE_SUB(NOW(6), INTERVAL 4 HOUR)),
    (4,  'USER',        4,  'LOGIN',         NULL,              'SUCCESS',            'Quản lý kho đăng nhập cổng vận hành',    DATE_SUB(NOW(6), INTERVAL 2 HOUR)),
    (5,  'USER',        5,  'LOGIN',         NULL,              'SUCCESS',            'Quản trị viên đăng nhập hệ thống',       DATE_SUB(NOW(6), INTERVAL 5 HOUR)),
    (3,  'USER',        3,  'LOGIN',         NULL,              'SUCCESS',            'Chuyên viên kinh doanh đăng nhập xem báo cáo', DATE_SUB(NOW(6), INTERVAL 6 HOUR)),

    -- Chuỗi LOGIN_FAILED sáng nay của nhân viên đã nghỉ (Vũ — UJ-6)
    (7,  'USER',        7,  'LOGIN_FAILED',  NULL,              NULL,                 'Sai mật khẩu lần 1',                     DATE_SUB(NOW(6), INTERVAL 75 MINUTE)),
    (7,  'USER',        7,  'LOGIN_FAILED',  NULL,              NULL,                 'Sai mật khẩu lần 2',                     DATE_SUB(NOW(6), INTERVAL 73 MINUTE)),
    (7,  'USER',        7,  'LOGIN_FAILED',  NULL,              NULL,                 'Tài khoản đã bị khóa (Account locked)',  DATE_SUB(NOW(6), INTERVAL 70 MINUTE)),

    -- 2. Nhật ký thao tác nghiệp vụ gần đây (Activity Log viewer)
    (6,  'RESERVATION', 40, 'STATUS_CHANGE', 'CHECKED_IN',      'CHECKOUT_REQUESTED', 'Khách hàng gửi yêu cầu trả kho M-1',     DATE_SUB(NOW(6), INTERVAL 3 HOUR)),
    (8,  'RESERVATION', 41, 'STATUS_CHANGE', 'RESERVED',        'CHECKED_IN',         'Hoàn tất nhận kho tại quầy',             DATE_SUB(NOW(6), INTERVAL 45 DAY)),
    (9,  'RESERVATION', 42, 'STATUS_CHANGE', 'RESERVED',        'CHECKED_IN',         'Hoàn tất nhận kho kèm ký số',            DATE_SUB(NOW(6), INTERVAL 20 DAY)),
    (9,  'TICKET',      2,  'CREATED',       NULL,              'OPEN',               'Khách báo sự cố ngập nước kho M-2',      DATE_SUB(NOW(6), INTERVAL 3 HOUR)),
    (2,  'TICKET',      2,  'STATUS_CHANGE', 'OPEN',            'ESCALATED',          'Chuyển tiếp quản lý duyệt di dời kho',   DATE_SUB(NOW(6), INTERVAL 2 HOUR)),
    (1,  'TICKET',      3,  'CREATED',       NULL,              'OPEN',               'Báo lỗi ổ khóa điện tử không phản hồi',  DATE_SUB(NOW(6), INTERVAL 5 HOUR)),
    (2,  'TICKET',      3,  'STATUS_CHANGE', 'OPEN',            'IN_PROGRESS',        'Nhân viên đang kiểm tra phần cứng khóa', DATE_SUB(NOW(6), INTERVAL 4 HOUR)),
    (2,  'TASK',        48, 'STATUS_CHANGE', 'IN_PROGRESS',     'DONE',               'Cấp lại mã PIN mở kho S-2 cho khách',    DATE_SUB(NOW(6), INTERVAL 6 HOUR)),
    (2,  'TASK',        49, 'STATUS_CHANGE', 'IN_PROGRESS',     'DONE',               'Hoàn tất tất toán trả kho LOCK-3',       DATE_SUB(NOW(6), INTERVAL 7 HOUR)),
    (10, 'TASK',        50, 'STATUS_CHANGE', 'IN_PROGRESS',     'DONE',               'Hoàn tất vệ sinh bàn giao kho S-1',      DATE_SUB(NOW(6), INTERVAL 8 HOUR));
