-- ============================================================================
-- StorageHub — V48: seed nhật ký kiểm toán demo (US-27 / FR-28 / FR-38)
-- Chạy SAU V40 (V40 TRUNCATE activity_logs). Dữ liệu trải đều 3 cơ sở,
-- facility_id khớp với đơn vị / nhân sự được nhắc tới để màn hình lọc theo
-- cơ sở hoạt động đúng ngay sau khi reset dev.
-- ============================================================================

INSERT INTO activity_logs
    (actor_id, facility_id, entity_type, entity_id, action, from_value, to_value, reason, created_at)
VALUES
-- ------------------------------------------------ LÕI HỆ THỐNG (facility NULL) ----
(1, NULL, 'USER', 1,  'LOGIN',        NULL, 'SUCCESS', 'Quản trị viên đăng nhập hệ thống', DATE_SUB(NOW(6), INTERVAL 15 MINUTE)),
(1, 2,    'USER', 10, 'ROLE_CHANGED', 'CUSTOMER', 'STAFF', 'Bổ sung vai trò nhân viên ca tối', DATE_SUB(NOW(6), INTERVAL 2 DAY)),
(1, 3,    'USER', 14, 'STATUS_CHANGED', '0', '1', 'Kích hoạt tài khoản nhân viên mới', DATE_SUB(NOW(6), INTERVAL 4 DAY)),
(1, 1,    'USER', 7,  'STATUS_CHANGED', '1', '2', 'Khóa tài khoản do vi phạm quy trình nhận kho', DATE_SUB(NOW(6), INTERVAL 9 DAY)),

-- ------------------------------------------------ CƠ SỞ TÂN BÌNH (facility 1) ----
(2, 1, 'USER', 2, 'LOGIN', NULL, 'SUCCESS', 'Quản lý cơ sở đăng nhập cổng vận hành', DATE_SUB(NOW(6), INTERVAL 40 MINUTE)),
(5, 1, 'USER', 5, 'LOGIN', NULL, 'SUCCESS', 'Nhân viên đăng nhập trạm làm việc', DATE_SUB(NOW(6), INTERVAL 3 HOUR)),
(5, 1, 'USER', 5, 'LOGOUT', NULL, 'SUCCESS', 'Kết thúc ca sáng', DATE_SUB(NOW(6), INTERVAL 90 MINUTE)),
(6, 1, 'USER', 6, 'LOGIN', NULL, 'SUCCESS', 'Nhân viên đăng nhập trạm làm việc', DATE_SUB(NOW(6), INTERVAL 5 HOUR)),
(7, 1, 'USER', 7, 'LOGIN_FAILED', NULL, 'FAILED', 'Sai mật khẩu lần 1', DATE_SUB(NOW(6), INTERVAL 26 HOUR)),
(7, 1, 'USER', 7, 'LOGIN_FAILED', NULL, 'FAILED', 'Tài khoản đã bị khóa (Account locked)', DATE_SUB(NOW(6), INTERVAL 25 HOUR)),

(2, 1, 'UNIT', 3,  'STATUS_CHANGED', 'AVAILABLE', 'MAINTENANCE', 'Cửa cuốn kẹt, tạm ngưng khai thác để sửa', DATE_SUB(NOW(6), INTERVAL 20 MINUTE)),
(2, 1, 'UNIT', 7,  'STATUS_CHANGED', 'MAINTENANCE', 'AVAILABLE', 'Đã thay ray cửa, kiểm tra vận hành ổn định', DATE_SUB(NOW(6), INTERVAL 2 HOUR)),
(2, 1, 'UNIT', 12, 'UPDATE_SPECS', NULL, '8.0 m²', 'Đo lại diện tích thực tế sau cải tạo', DATE_SUB(NOW(6), INTERVAL 4 HOUR)),
(2, 1, 'UNIT', 18, 'STATUS_CHANGED', 'RENTED', 'PREPARING', 'Khách trả kho sớm, chưa kịp cập nhật tại quầy', DATE_SUB(NOW(6), INTERVAL 6 HOUR)),
(2, 1, 'UNIT', 24, 'SET_MAINTENANCE', 'AVAILABLE', 'MAINTENANCE', 'Bảo trì dàn lạnh định kỳ', DATE_SUB(NOW(6), INTERVAL 9 HOUR)),
(2, 1, 'UNIT', 31, 'FINISH_MAINTENANCE', 'MAINTENANCE', 'AVAILABLE', 'Hoàn tất vệ sinh và cân chỉnh nhiệt độ', DATE_SUB(NOW(6), INTERVAL 11 HOUR)),
(2, 1, 'UNIT', 37, 'STATUS_CHANGED', 'RESERVED', 'AVAILABLE', 'Khách không đến nhận kho trong ngày hẹn', DATE_SUB(NOW(6), INTERVAL 20 HOUR)),
(2, 1, 'UNIT', 42, 'RETIRE_UNIT', 'AVAILABLE', 'RETIRED', 'Ngừng khai thác do hư hỏng kết cấu', DATE_SUB(NOW(6), INTERVAL 1 DAY)),
(2, 1, 'UNIT', 49, 'UPDATE_SPECS', NULL, '12.5 m²', 'Gộp vách ngăn với kho kế cận', DATE_SUB(NOW(6), INTERVAL 30 HOUR)),
(2, 1, 'UNIT', 55, 'STATUS_CHANGED', 'AVAILABLE', 'MAINTENANCE', 'Cảm biến độ ẩm báo sai, cần kiểm tra', DATE_SUB(NOW(6), INTERVAL 2 DAY)),
(2, 1, 'UNIT', 61, 'STATUS_CHANGED', 'MAINTENANCE', 'AVAILABLE', 'Thay cảm biến độ ẩm, hiệu chuẩn lại', DATE_SUB(NOW(6), INTERVAL 52 HOUR)),
(2, 1, 'UNIT', 68, 'SET_MAINTENANCE', 'AVAILABLE', 'MAINTENANCE', 'Sơn lại sàn và khử mùi', DATE_SUB(NOW(6), INTERVAL 3 DAY)),
(2, 1, 'UNIT', 73, 'FINISH_MAINTENANCE', 'MAINTENANCE', 'AVAILABLE', 'Hoàn tất sơn sàn, nghiệm thu nội bộ', DATE_SUB(NOW(6), INTERVAL 77 HOUR)),
(2, 1, 'UNIT', 79, 'STATUS_CHANGED', 'RENTED', 'CHECKOUT_REQUESTED', 'Khách gửi yêu cầu trả kho trên cổng web', DATE_SUB(NOW(6), INTERVAL 4 DAY)),
(2, 1, 'UNIT', 84, 'STATUS_CHANGED', 'RENTED', 'PREPARING', 'Trả kho đúng hạn, chờ bàn giao lại', DATE_SUB(NOW(6), INTERVAL 5 DAY)),
(2, 1, 'UNIT', 90, 'UPDATE_SPECS', NULL, '6.0 m²', 'Cập nhật lại mã kho theo sơ đồ mới', DATE_SUB(NOW(6), INTERVAL 6 DAY)),
(2, 1, 'UNIT', 92, 'STATUS_CHANGED', 'AVAILABLE', 'MAINTENANCE', 'Chống thấm trần sau mưa lớn', DATE_SUB(NOW(6), INTERVAL 7 DAY)),
(2, 1, 'UNIT', 95, 'STATUS_CHANGED', 'MAINTENANCE', 'AVAILABLE', 'Hoàn tất chống thấm, kiểm tra rò rỉ', DATE_SUB(NOW(6), INTERVAL 8 DAY)),
(2, 1, 'UNIT', 97, 'RETIRE_UNIT', 'AVAILABLE', 'RETIRED', 'Thu hồi mặt bằng theo yêu cầu chủ kho', DATE_SUB(NOW(6), INTERVAL 10 DAY)),
(2, 1, 'UNIT', 99, 'STATUS_CHANGED', 'AVAILABLE', 'MAINTENANCE', 'Kiểm tra định kỳ hệ thống điện', DATE_SUB(NOW(6), INTERVAL 12 DAY)),

(2, 1, 'STAFF_ASSIGNMENT', 1000, 'CREATED', NULL, 'MORNING', 'Phân ca sáng cho nhân viên trực zone A', DATE_SUB(NOW(6), INTERVAL 45 MINUTE)),
(2, 1, 'STAFF_ASSIGNMENT', 1001, 'CREATED', NULL, 'AFTERNOON', 'Phân ca chiều cho nhân viên trực zone A', DATE_SUB(NOW(6), INTERVAL 44 MINUTE)),
(2, 1, 'STAFF_ASSIGNMENT', 1004, 'STATUS_CHANGED', 'MORNING', 'FULL_DAY', 'Đổi sang ca hành chính do thiếu người', DATE_SUB(NOW(6), INTERVAL 1 DAY)),
(2, 1, 'STAFF_ASSIGNMENT', 1006, 'CREATED', NULL, 'MORNING', 'Bổ sung ca sáng cho nhân viên mới', DATE_SUB(NOW(6), INTERVAL 2 DAY)),
(2, 1, 'STAFF_ASSIGNMENT', 1010, 'CREATED', NULL, 'MORNING', 'Phân ca sáng cuối tuần', DATE_SUB(NOW(6), INTERVAL 3 DAY)),
(2, 1, 'STAFF_ASSIGNMENT', 1011, 'STATUS_CHANGED', 'AFTERNOON', 'ON_CALL', 'Chuyển sang trực dự phòng', DATE_SUB(NOW(6), INTERVAL 74 HOUR)),

-- ------------------------------------------------ CƠ SỞ THỦ ĐỨC (facility 2) ----
(3, 2, 'USER', 3,  'LOGIN', NULL, 'SUCCESS', 'Quản lý cơ sở đăng nhập cổng vận hành', DATE_SUB(NOW(6), INTERVAL 50 MINUTE)),
(9, 2, 'USER', 9,  'LOGIN', NULL, 'SUCCESS', 'Nhân viên đăng nhập trạm làm việc', DATE_SUB(NOW(6), INTERVAL 4 HOUR)),
(10, 2, 'USER', 10, 'LOGIN', NULL, 'SUCCESS', 'Nhân viên đăng nhập trạm làm việc', DATE_SUB(NOW(6), INTERVAL 7 HOUR)),
(11, 2, 'USER', 11, 'LOGIN_FAILED', NULL, 'FAILED', 'Sai mật khẩu lần 1', DATE_SUB(NOW(6), INTERVAL 30 HOUR)),
(11, 2, 'USER', 11, 'LOGIN', NULL, 'SUCCESS', 'Đăng nhập thành công sau khi đặt lại mật khẩu', DATE_SUB(NOW(6), INTERVAL 29 HOUR)),

(3, 2, 'UNIT', 101, 'STATUS_CHANGED', 'AVAILABLE', 'MAINTENANCE', 'Dàn lạnh rò gas, cần nạp lại', DATE_SUB(NOW(6), INTERVAL 35 MINUTE)),
(3, 2, 'UNIT', 108, 'STATUS_CHANGED', 'MAINTENANCE', 'AVAILABLE', 'Đã nạp gas và chạy thử 2 giờ', DATE_SUB(NOW(6), INTERVAL 3 HOUR)),
(3, 2, 'UNIT', 114, 'UPDATE_SPECS', NULL, '10.0 m²', 'Đo lại diện tích sau khi tháo vách', DATE_SUB(NOW(6), INTERVAL 5 HOUR)),
(3, 2, 'UNIT', 121, 'STATUS_CHANGED', 'RENTED', 'PREPARING', 'Khách trả kho trước hạn', DATE_SUB(NOW(6), INTERVAL 8 HOUR)),
(3, 2, 'UNIT', 129, 'SET_MAINTENANCE', 'AVAILABLE', 'MAINTENANCE', 'Vệ sinh tổng thể theo lịch', DATE_SUB(NOW(6), INTERVAL 12 HOUR)),
(3, 2, 'UNIT', 134, 'FINISH_MAINTENANCE', 'MAINTENANCE', 'AVAILABLE', 'Hoàn tất vệ sinh, sẵn sàng khai thác', DATE_SUB(NOW(6), INTERVAL 13 HOUR)),
(3, 2, 'UNIT', 141, 'STATUS_CHANGED', 'RESERVED', 'AVAILABLE', 'Khách hủy nhận kho, hoàn cọc theo chính sách', DATE_SUB(NOW(6), INTERVAL 22 HOUR)),
(3, 2, 'UNIT', 148, 'UPDATE_SPECS', NULL, '9.0 m²', 'Cập nhật chiều cao thông thủy', DATE_SUB(NOW(6), INTERVAL 26 HOUR)),
(3, 2, 'UNIT', 155, 'STATUS_CHANGED', 'AVAILABLE', 'MAINTENANCE', 'Cửa kho bị xệ, cần căn chỉnh', DATE_SUB(NOW(6), INTERVAL 2 DAY)),
(3, 2, 'UNIT', 162, 'STATUS_CHANGED', 'MAINTENANCE', 'AVAILABLE', 'Căn chỉnh cửa, tra dầu bản lề', DATE_SUB(NOW(6), INTERVAL 54 HOUR)),
(3, 2, 'UNIT', 168, 'RETIRE_UNIT', 'AVAILABLE', 'RETIRED', 'Kết cấu nứt, không đủ điều kiện khai thác', DATE_SUB(NOW(6), INTERVAL 3 DAY)),
(3, 2, 'UNIT', 174, 'SET_MAINTENANCE', 'AVAILABLE', 'MAINTENANCE', 'Thay bóng đèn UV', DATE_SUB(NOW(6), INTERVAL 4 DAY)),
(3, 2, 'UNIT', 179, 'FINISH_MAINTENANCE', 'MAINTENANCE', 'AVAILABLE', 'Đã thay đèn, kiểm tra cường độ UV', DATE_SUB(NOW(6), INTERVAL 99 HOUR)),
(3, 2, 'UNIT', 183, 'STATUS_CHANGED', 'AVAILABLE', 'MAINTENANCE', 'Chống mối cho vách gỗ', DATE_SUB(NOW(6), INTERVAL 5 DAY)),
(3, 2, 'UNIT', 188, 'STATUS_CHANGED', 'MAINTENANCE', 'AVAILABLE', 'Hoàn tất xử lý mối', DATE_SUB(NOW(6), INTERVAL 127 HOUR)),
(3, 2, 'UNIT', 191, 'UPDATE_SPECS', NULL, '7.5 m²', 'Điều chỉnh diện tích sau kiểm định', DATE_SUB(NOW(6), INTERVAL 6 DAY)),
(3, 2, 'UNIT', 194, 'STATUS_CHANGED', 'RENTED', 'CHECKOUT_REQUESTED', 'Khách báo trả kho qua cổng web', DATE_SUB(NOW(6), INTERVAL 7 DAY)),
(3, 2, 'UNIT', 196, 'STATUS_CHANGED', 'AVAILABLE', 'MAINTENANCE', 'Sửa hệ thống thông gió', DATE_SUB(NOW(6), INTERVAL 9 DAY)),
(3, 2, 'UNIT', 199, 'STATUS_CHANGED', 'MAINTENANCE', 'AVAILABLE', 'Thông gió hoạt động ổn định', DATE_SUB(NOW(6), INTERVAL 10 DAY)),

(3, 2, 'STAFF_ASSIGNMENT', 1056, 'CREATED', NULL, 'MORNING', 'Phân ca sáng cho nhân viên trực zone B', DATE_SUB(NOW(6), INTERVAL 55 MINUTE)),
(3, 2, 'STAFF_ASSIGNMENT', 1058, 'CREATED', NULL, 'AFTERNOON', 'Phân ca chiều cho nhân viên trực zone B', DATE_SUB(NOW(6), INTERVAL 54 MINUTE)),
(3, 2, 'STAFF_ASSIGNMENT', 1061, 'STATUS_CHANGED', 'AFTERNOON', 'FULL_DAY', 'Đổi ca do nhân viên xin nghỉ', DATE_SUB(NOW(6), INTERVAL 1 DAY)),
(3, 2, 'STAFF_ASSIGNMENT', 1065, 'CREATED', NULL, 'EVENING', 'Bổ sung ca tối cao điểm', DATE_SUB(NOW(6), INTERVAL 2 DAY)),
(3, 2, 'STAFF_ASSIGNMENT', 1068, 'CREATED', NULL, 'MORNING', 'Phân ca sáng cho nhân viên mới', DATE_SUB(NOW(6), INTERVAL 4 DAY)),
(3, 2, 'STAFF_ASSIGNMENT', 1071, 'STATUS_CHANGED', 'MORNING', 'ON_CALL', 'Chuyển sang trực dự phòng', DATE_SUB(NOW(6), INTERVAL 98 HOUR)),

-- ------------------------------------------------ CƠ SỞ BÌNH THẠNH (facility 3) ----
(4, 3, 'USER', 4,  'LOGIN', NULL, 'SUCCESS', 'Quản lý cơ sở đăng nhập cổng vận hành', DATE_SUB(NOW(6), INTERVAL 1 HOUR)),
(13, 3, 'USER', 13, 'LOGIN', NULL, 'SUCCESS', 'Nhân viên đăng nhập trạm làm việc', DATE_SUB(NOW(6), INTERVAL 2 HOUR)),
(14, 3, 'USER', 14, 'LOGIN', NULL, 'SUCCESS', 'Nhân viên đăng nhập trạm làm việc', DATE_SUB(NOW(6), INTERVAL 6 HOUR)),
(15, 3, 'USER', 15, 'LOGIN_FAILED', NULL, 'FAILED', 'Sai mật khẩu lần 1', DATE_SUB(NOW(6), INTERVAL 28 HOUR)),

(4, 3, 'UNIT', 201, 'STATUS_CHANGED', 'AVAILABLE', 'MAINTENANCE', 'Máy hút ẩm hỏng phao', DATE_SUB(NOW(6), INTERVAL 30 MINUTE)),
(4, 3, 'UNIT', 207, 'STATUS_CHANGED', 'MAINTENANCE', 'AVAILABLE', 'Thay phao và chạy thử 4 giờ', DATE_SUB(NOW(6), INTERVAL 3 HOUR)),
(4, 3, 'UNIT', 213, 'UPDATE_SPECS', NULL, '11.0 m²', 'Cập nhật diện tích sau khi mở rộng', DATE_SUB(NOW(6), INTERVAL 5 HOUR)),
(4, 3, 'UNIT', 220, 'SET_MAINTENANCE', 'AVAILABLE', 'MAINTENANCE', 'Khử trùng định kỳ bằng UV', DATE_SUB(NOW(6), INTERVAL 7 HOUR)),
(4, 3, 'UNIT', 226, 'FINISH_MAINTENANCE', 'MAINTENANCE', 'AVAILABLE', 'Hoàn tất khử trùng, dán tem nghiệm thu', DATE_SUB(NOW(6), INTERVAL 8 HOUR)),
(4, 3, 'UNIT', 233, 'STATUS_CHANGED', 'RENTED', 'PREPARING', 'Khách trả kho đúng hạn', DATE_SUB(NOW(6), INTERVAL 10 HOUR)),
(4, 3, 'UNIT', 239, 'STATUS_CHANGED', 'AVAILABLE', 'MAINTENANCE', 'Sửa khóa điện tử không phản hồi', DATE_SUB(NOW(6), INTERVAL 1 DAY)),
(4, 3, 'UNIT', 245, 'STATUS_CHANGED', 'MAINTENANCE', 'AVAILABLE', 'Thay bộ điều khiển khóa', DATE_SUB(NOW(6), INTERVAL 29 HOUR)),
(4, 3, 'UNIT', 251, 'UPDATE_SPECS', NULL, '5.5 m²', 'Đo lại diện tích thực tế', DATE_SUB(NOW(6), INTERVAL 2 DAY)),
(4, 3, 'UNIT', 257, 'STATUS_CHANGED', 'RESERVED', 'AVAILABLE', 'Khách không đến nhận kho trong ngày hẹn', DATE_SUB(NOW(6), INTERVAL 3 DAY)),
(4, 3, 'UNIT', 263, 'RETIRE_UNIT', 'AVAILABLE', 'RETIRED', 'Ngừng khai thác do ngập cục bộ', DATE_SUB(NOW(6), INTERVAL 4 DAY)),
(4, 3, 'UNIT', 268, 'SET_MAINTENANCE', 'AVAILABLE', 'MAINTENANCE', 'Xử lý ẩm mốc tường phía sau', DATE_SUB(NOW(6), INTERVAL 5 DAY)),
(4, 3, 'UNIT', 271, 'FINISH_MAINTENANCE', 'MAINTENANCE', 'AVAILABLE', 'Sơn chống ẩm và kiểm tra độ ẩm 48 giờ', DATE_SUB(NOW(6), INTERVAL 128 HOUR)),
(4, 3, 'UNIT', 276, 'STATUS_CHANGED', 'AVAILABLE', 'MAINTENANCE', 'Thay quạt thông gió trần', DATE_SUB(NOW(6), INTERVAL 6 DAY)),
(4, 3, 'UNIT', 281, 'STATUS_CHANGED', 'MAINTENANCE', 'AVAILABLE', 'Quạt mới chạy êm, lưu lượng đạt', DATE_SUB(NOW(6), INTERVAL 150 HOUR)),
(4, 3, 'UNIT', 285, 'UPDATE_SPECS', NULL, '13.0 m²', 'Cập nhật sức chứa theo kiểm định', DATE_SUB(NOW(6), INTERVAL 8 DAY)),
(4, 3, 'UNIT', 289, 'STATUS_CHANGED', 'RENTED', 'CHECKOUT_REQUESTED', 'Khách gửi yêu cầu trả kho', DATE_SUB(NOW(6), INTERVAL 9 DAY)),
(4, 3, 'UNIT', 292, 'STATUS_CHANGED', 'AVAILABLE', 'MAINTENANCE', 'Bảo trì hệ thống chiếu sáng', DATE_SUB(NOW(6), INTERVAL 11 DAY)),
(4, 3, 'UNIT', 295, 'STATUS_CHANGED', 'MAINTENANCE', 'AVAILABLE', 'Hoàn tất thay đèn LED', DATE_SUB(NOW(6), INTERVAL 12 DAY)),
(4, 3, 'UNIT', 298, 'UPDATE_SPECS', NULL, '4.5 m²', 'Điều chỉnh sau kiểm tra hiện trạng', DATE_SUB(NOW(6), INTERVAL 14 DAY)),

(4, 3, 'STAFF_ASSIGNMENT', 1112, 'CREATED', NULL, 'MORNING', 'Phân ca sáng cho nhân viên trực zone C', DATE_SUB(NOW(6), INTERVAL 65 MINUTE)),
(4, 3, 'STAFF_ASSIGNMENT', 1114, 'CREATED', NULL, 'AFTERNOON', 'Phân ca chiều cho nhân viên trực zone C', DATE_SUB(NOW(6), INTERVAL 64 MINUTE)),
(4, 3, 'STAFF_ASSIGNMENT', 1117, 'STATUS_CHANGED', 'MORNING', 'FULL_DAY', 'Đổi ca do nhân viên đăng ký', DATE_SUB(NOW(6), INTERVAL 1 DAY)),
(4, 3, 'STAFF_ASSIGNMENT', 1120, 'CREATED', NULL, 'EVENING', 'Bổ sung ca tối cuối tuần', DATE_SUB(NOW(6), INTERVAL 2 DAY)),
(4, 3, 'STAFF_ASSIGNMENT', 1123, 'CREATED', NULL, 'MORNING', 'Phân ca sáng bổ sung', DATE_SUB(NOW(6), INTERVAL 3 DAY)),
(4, 3, 'STAFF_ASSIGNMENT', 1127, 'STATUS_CHANGED', 'AFTERNOON', 'ON_CALL', 'Chuyển sang trực dự phòng', DATE_SUB(NOW(6), INTERVAL 4 DAY));
