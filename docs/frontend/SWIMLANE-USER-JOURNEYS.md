# Ánh Xạ Luồng Nghiệp Vụ Swimlane (Swimlane User Journeys)

Tài liệu này đối chiếu chi tiết giữa **7 tài liệu luồng tương tác (Swimlane Flows)** tại thư mục [`docs/models/flows/`](file:///D:/Workspace/StorageHub/docs/models/flows/) với các màn hình và logic xử lý thực tế trên phân hệ Frontend.

---

## Bảng Ánh Xạ Tổng Thể

| Mã Luồng (Flow Docs) | Tên Nghiệp Vụ | Vai Trò Tham Gia | Màn Hình Frontend Tương Ứng | API Endpoints Gọi Thực Tế |
|---|---|---|---|---|
| `F1-01`, `F1-02` | Tìm kiếm, Đặt giữ chỗ & Thanh toán cọc | CUSTOMER | `BrowsePage.jsx`<br/>`UnitDetailPage.jsx`<br/>`PaymentPage.jsx` | `GET /api/v1/units`<br/>`GET /api/v1/units/{id}/quote`<br/>`POST /api/v1/reservations`<br/>`POST /api/v1/payments` |
| `F2-01`, `F2-02` | Khách lấy Check-in Pass & Nhân viên nhận kho | CUSTOMER<br/>STAFF | `CheckInPassPage.jsx`<br/>`TaskBoardPage.jsx` | `GET /api/v1/reservations/{id}/check-in-pass`<br/>`GET /api/v1/tasks`<br/>`PATCH /api/v1/tasks/{id}/status` |
| `F6-01` | Gia hạn hợp đồng & Kiểm tra va chạm lịch | CUSTOMER | `RentalDetailPage.jsx`<br/>`PaymentPage.jsx` | `POST /api/v1/reservations/{id}/extensions`<br/>`POST /api/v1/payments` |
| `F3-01`, `F3-02` | Gửi yêu cầu trả kho & Nghi thức tất toán | CUSTOMER<br/>STAFF | `RentalDetailPage.jsx`<br/>`TaskBoardPage.jsx` | `POST /api/v1/reservations/{id}/checkout-request`<br/>`PATCH /api/v1/tasks/{id}/status` |
| `F5-01` – `F5-05` | Giám sát cơ sở, Bảo trì kho & Phân ca trực | FACILITY_MANAGER | `FacilityOverviewPage.jsx`<br/>`UnitManagementPage.jsx`<br/>`StaffShiftsPage.jsx`<br/>`ActivityLogPage.jsx` | `GET /api/v1/facility/overview`<br/>`GET /api/v1/shifts`<br/>`POST /api/v1/shifts`<br/>`GET /api/v1/activity-logs` |
| `F4-01` – `F4-03` | Quản trị chính sách giá & Báo cáo doanh thu | BUSINESS_OPS | `BusinessOverviewPage.jsx`<br/>`PolicyManagementPage.jsx`<br/>`ReportsPage.jsx` | `GET /api/v1/reports/financial-summary`<br/>`GET /api/v1/reports/monthly-revenue`<br/>`GET /api/v1/reports/export` |
| `F7-01` – `F7-05`, `SYS-01` | Hỗ trợ sự cố, Thông báo & Quản trị User | CUSTOMER, STAFF, SYSTEM_ADMIN | `SupportPage.jsx`<br/>`UserManagementPage.jsx` | `GET /api/v1/users`<br/>`PATCH /api/v1/users/{id}/status`<br/>`POST /api/v1/users/{id}/reset-password`<br/>`GET /api/v1/notifications` |

---

## Chi Tiết Từng Luồng Nghiệp Vụ

### 1. Luồng 1: Tìm Kiếm, Đặt Giữ Chỗ & Thanh Toán (F1-01, F1-02)
- **Tác nhân**: Khách hàng Lan (`lan@demo.storagehub.vn`).
- **Trình tự tương tác trên UI**:
  1. Khách hàng vào trang Tìm kho (`/browse`), sử dụng thanh công cụ lọc theo chi nhánh (Tân Bình Depot), loại kho (Small, Medium, Large) hoặc tìm mã kho (`S-2`).
  2. Bấm vào thẻ kho để xem chi tiết (`/units/2`). Màn hình hiển thị thông số diện tích, tiện ích và công cụ tính giá tự động (`PricingEngine`).
  3. Chọn ngày bắt đầu và thời hạn thuê (1, 3, 6, 12 tháng) ➔ Hệ thống tính ra tổng tiền thuê và tiền đặt cọc (10%).
  4. Bấm **"Tiến hành đặt chỗ"** ➔ Điều hướng sang trang Thanh toán (`/payment/50`).
  5. Chọn phương thức:
     - **PAYOS thật**: Quét mã QR VietQR tự động cập nhật qua webhook / polling.
     - **MOMO demo**: Nhập SĐT và mã OTP giả lập `123456`.
     - **CARD demo**: Nhập số thẻ, hạn thẻ, mã CVC ➔ Hệ thống tự động chuyển sang trạng thái thành công.
- **Ràng buộc an toàn**: Nếu kho vừa bị khách hàng khác đặt trong lúc đang thao tác, API trả về `409 UNIT_ALREADY_RESERVED` ➔ Giao diện thông báo rõ ràng và đề xuất kho tương đương.

---

### 2. Luồng 2: Check-in Pass & Nghi Thức Nhận Kho Tại Quầy (F2-01, F2-02)
- **Tác nhân**: Khách hàng Lan & Nhân viên Minh (`minh@demo.storagehub.vn`).
- **Trình tự tương tác trên UI**:
  1. Sau khi cọc thành công, Lan vào **Đơn thuê của tôi** (`/rentals`) hoặc xem trực tiếp thẻ nhận kho (`/rentals/30/check-in-pass`).
  2. Màn hình sinh mã QR động chứa chuỗi `STORAGEHUB:CHECKIN:BK-2031:482913` cùng mã PIN dự phòng gồm 6 chữ số (`482913`).
  3. Lan đến cơ sở gặp nhân viên Minh. Minh mở **Bảng công việc** (`/tasks`), thấy thẻ `CHECKIN` của Lan ở cột `TODO`.
  4. Minh mở Drawer tác nghiệp:
     - Đối soát thông tin khách hàng và mã đơn đặt chỗ.
     - Kiểm tra tiền cọc đã khớp.
     - Đính kèm ảnh hợp đồng giấy đã ký (`/storage/contracts/CT-2031-signed.jpg`).
     - Bấm **"Hoàn tất bàn giao kho"**.
- **Ràng buộc an toàn (Snap-Back Guard)**: Nếu Minh cố tình chuyển thẻ sang cột `DONE` mà chưa upload ảnh hợp đồng hoặc chưa xác nhận phương thức thanh toán tiền thuê, hệ thống sẽ chặn lại và đẩy thẻ về cột `IN_PROGRESS` (kèm cảnh báo đỏ).

---

### 3. Luồng 3: Tự Gia Hạn Thuê Kho & Kiểm Tra Va Chạm Lịch (F6-01)
- **Tác nhân**: Khách hàng Lan.
- **Trình tự tương tác trên UI**:
  1. Tại màn hình chi tiết đơn thuê (`/rentals/30`), Lan bấm nút **"Gia hạn thuê kho"**.
  2. Một Drawer trượt ra, cho phép Lan chọn ngày trả kho mới.
  3. **Kiểm tra va chạm lịch (Collision Boundary Check)**:
     - *Trường hợp A (Kho S-4)*: Không có ai đặt trước ➔ Lan được gia hạn tùy ý, hệ thống tính phí thuê tháng mới + tiền bù cọc (top-up deposit).
     - *Trường hợp B (Kho S-2)*: Đã có đơn kế tiếp bắt đầu từ ngày `2026-12-05` ➔ Hệ thống cắm cờ đỏ chặn không cho chọn ngày vượt quá `2026-12-04`, thông báo *"Ngày trả kho muộn nhất là 04/12/2026 do kho đã có khách đặt trước"*.
  4. Lan xác nhận thanh toán phí gia hạn ➔ Hợp đồng tự động sinh phụ lục mới (`CT-2031-A1`) và dời hạn trả kho ngay lập tức.

---

### 4. Luồng 4: Yêu Cầu Trả Kho & Tất Toán Đặt Cọc (F3-01, F3-02)
- **Tác nhân**: Khách hàng Trang (`trang@demo.storagehub.vn`) & Nhân viên Minh.
- **Trình tự tương tác trên UI**:
  1. Trang vào đơn thuê kho `M-1` (`BK-1050`), bấm **"Yêu cầu trả kho"**, chọn ngày mong muốn và ghi chú lý do.
  2. Thẻ công việc `CHECKOUT` tự động xuất hiện trên bảng Kanban của nhân viên Minh.
  3. Minh đến kho kiểm tra hiện trạng theo checklist 3 bước:
     - Đã dọn sạch đồ đạc?
     - Sàn kho và vách ngăn nguyên vẹn?
     - Đã bàn giao lại ổ khóa / thẻ từ?
  4. Minh nhập chi phí hư hại (nếu có, ví dụ 50.000đ móp khóa) ➔ Hệ thống tính toán tất toán tiền cọc:
     - `Tiền hoàn trả = Tiền cọc gốc (38.000đ) - Phí hư hại (50.000đ) = Thu thêm 12.000đ`.
  5. Minh bấm hoàn tất ➔ Hợp đồng chuyển sang `CLOSED`, kho tự động chuyển sang trạng thái chờ vệ sinh và kích hoạt nghi thức `CLEANING`.

---

### 5. Luồng 5: Giám Sát Cơ Sở & Lịch Ca Trực Tuần (F5-01 – F5-05)
- **Tác nhân**: Quản lý cơ sở Tuấn (`tuan@demo.storagehub.vn`).
- **Trình tự tương tác trên UI**:
  1. Tuấn vào `/facility`, xem biểu đồ tỷ lệ lấp đầy kho (75%), phân bổ trạng thái (`AVAILABLE`, `RENTED`, `MAINTENANCE`).
  2. Vào `/facility/units`: Tuấn có thể chuyển kho sang trạng thái bảo trì hoặc đưa vào vận hành lại. Có Guard chặn không cho đưa kho đang có người thuê vào diện thanh lý (`RETIRED`).
  3. Vào `/facility/shifts`: Xem ma trận lịch trực theo tuần của đội ngũ nhân viên.
  4. Tuấn kéo thả hoặc phân công ca trực mới ➔ Hệ thống chạy thuật toán phát hiện xung đột (`detectShiftConflict`). Nếu nhân viên bị trùng giờ hoặc phân 2 ca cùng lúc, hệ thống báo đỏ ngay trên giao diện.

---

### 6. Luồng 6: Quản Trị Chính Sách & Báo Cáo Doanh Thu (F4-01 – F4-03)
- **Tác nhân**: Vận hành kinh doanh Hằng (`hang@demo.storagehub.vn`).
- **Trình tự tương tác trên UI**:
  1. Hằng vào `/overview` để nắm bắt tổng doanh thu quý, phân tích dòng tiền thuê và tiền cọc đang giữ hộ.
  2. Vào `/policy`: Xem phiên bản chính sách `v3` đang kích hoạt và bản nháp `v4`.
     - Hằng có thể điều chỉnh slider phụ thu quá giờ.
     - Nếu chỉnh phụ thu vượt trần 10% (ví dụ kéo lên 15%), hệ thống lập tức hiển thị cảnh báo đỏ vi phạm quy định (`15% exceeds the 10% cap`).
  3. Vào `/reports`: Xem biểu đồ cột doanh thu theo tháng sử dụng bảng màu **Swiss Red Monochromatic** đồng nhất, và xuất báo cáo kiểm toán tài chính ra file CSV.

---

### 7. Luồng 7: Quản Trị Người Dùng & Phân Quyền (SYS-01)
- **Tác nhân**: Quản trị viên Nam (`nam@demo.storagehub.vn`).
- **Trình tự tương tác trên UI**:
  1. Nam vào `/users`, lọc danh sách người dùng theo vai trò hoặc trạng thái (chưa kích hoạt / đang hoạt động / bị khóa).
  2. Thao tác kích hoạt tài khoản cho người dùng mới đăng ký (`long@demo.storagehub.vn`).
  3. Đổi vai trò cho nhân viên (`ha@demo.storagehub.vn`) từ `CUSTOMER` lên `STAFF`.
  4. Cấp lại mật khẩu tạm cho tài khoản bị quên (`huy@demo.storagehub.vn`) ➔ Hệ thống sinh mật khẩu an toàn và gửi thông báo.
  5. Mọi thao tác của Nam đều được ghi nhận vào Nhật ký hoạt động kiểm toán (`/login-history` và `/facility/activity`).
