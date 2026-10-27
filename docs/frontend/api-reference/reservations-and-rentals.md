# API Reference: Đơn Đặt Chỗ, Hợp Đồng & Gia Hạn (Reservations & Rentals)

Các API quản lý vòng đời đơn thuê từ lúc đặt cọc, lấy mã nhận kho, xem hợp đồng pháp lý điện tử, gia hạn đến khi yêu cầu trả kho.

---

## 1. Tạo Đơn Đặt Chỗ Kho (Khởi tạo yêu cầu - Chưa khóa chỗ)

- **Method / URL**: `POST /api/v1/reservations`
- **Quyền hạn**: `CUSTOMER`, `SYSTEM_ADMIN`
- **Hàm Service**: `src/services/paymentService.js` ➔ `createReservation(body)`
- **Request Body**:
```json
{
  "unitId": 2,
  "startDate": "2026-11-01",
  "durationMonths": 3
}
```
- **Response Thành Công (`201 Created`)**:
```json
{
  "id": 50,
  "code": "BK-2050",
  "customerId": 1,
  "unitId": 2,
  "startDate": "2026-11-01",
  "endDate": "2027-02-01",
  "depositAmount": 34500,
  "status": "PENDING_PAYMENT"
}
```

> [!IMPORTANT]
> **Quy Tắc Nghiệp Vụ Khóa Chỗ (Reservation Business Rule)**:
> - Việc gọi API `POST /api/v1/reservations` chỉ tạo bản ghi ở trạng thái `PENDING_PAYMENT` và lưu snapshot báo giá. **Hệ thống TUYỆT ĐỐI CHƯA GIỮ CHỖ hay khóa ô kho ở bước này**.
> - Khách hàng khác vẫn có thể nhìn thấy ô kho này khả dụng trên danh mục tìm kiếm (`/browse`).
> - Ô kho chỉ chính thức được chuyển sang trạng thái `RESERVED` (khóa chỗ thành công, không ai được đặt đè) **SAU KHI KHÁCH HÀNG HOÀN TẤT THANH TOÁN TIỀN CỌC** (khi giao dịch thanh toán cọc chuyển sang `SUCCEEDED`).
> - Nếu khách hàng chưa thanh toán và có người khác thanh toán cọc thành công trước cho ô kho đó trong cùng khoảng thời gian, đơn thanh toán sau sẽ nhận thông báo lỗi xung đột lịch (`RESERVATION_CONFLICT` / `409 Conflict`).

---

## 2. Lấy Thông Tin Check-in Pass (Mã QR & PIN Nhận Kho)

- **Method / URL**: `GET /api/v1/reservations/{reservationId}/check-in-pass`
- **Quyền hạn**: `CUSTOMER`, `STAFF`, `SYSTEM_ADMIN`
- **Hàm Service**: `src/services/rentalService.js` ➔ `getCheckInPass(reservationId)`
- **Response Thành Công (`200 OK`)**:
```json
{
  "reservationId": 30,
  "reservationCode": "BK-2031",
  "customerName": "Nguyễn Thị Lan",
  "unitCode": "S-4",
  "facilityName": "Tân Bình Depot",
  "startDate": "2026-10-17",
  "checkInDeadline": "2026-10-20",
  "accessCode": "482913",
  "qrPayload": "STORAGEHUB:CHECKIN:BK-2031:482913",
  "status": "READY"
}
```

---

## 3. Hợp Đồng Thuê Kho Điện Tử Chuẩn Hóa (`ContractViewerModal.jsx`)

- **Component**: `src/components/ContractModal/ContractViewerModal.jsx`
- **Tích hợp tại**:
  - `src/features/rentals/components/ContractsSection.jsx` (Trang Kho của tôi)
  - `src/pages/customer/RentalDetailPage.jsx` (Trang Chi tiết đơn thuê)
  - `src/features/booking/components/BookingReview.jsx` (Trang Đặt kho & Xác nhận cọc)
  - `src/features/tasks/components/CheckinRitualDrawer.jsx` & `CheckoutRitualDrawer.jsx` (Nghi thức nhân viên quầy)
- **Nội dung pháp lý**:
  - **Bên Cho Thuê (Bên A)**: CÔNG TY CỔ PHẦN DỊCH VỤ LƯU TRỮ THÔNG MINH STORAGEHUB VIỆT NAM (Đại diện, MST, Trụ sở).
  - **Bên Thuê (Bên B)**: Họ và tên khách hàng, Số CCCD / Hộ chiếu, Số điện thoại liên hệ.
  - **Điều 1 - Thông tin ô kho & Thời hạn**: Mã kho, diện tích (m²), kích thước (Dài × Rộng × Cao), chi nhánh kho bãi, ngày bắt đầu và kết thúc thuê.
  - **Điều 2 - Giá thuê & Tiền đặt cọc 10%**: Giá thuê niêm yết hàng tháng, tỷ lệ đặt cọc 10% giữ chỗ, quy chế thanh toán phần còn lại khi làm thủ tục Check-in nhận kho.
  - **Điều 3 - Quy chế ra vào & An toàn an ninh**: Bàn giao mã PIN cá nhân mở khóa cửa cuốn 24/7, cấm lưu trữ chất cháy nổ / hóa chất độc hại, cam kết không tự ý thay đổi kết cấu vách ngăn.
  - **Điều 4 - Bồi thường & Thanh lý hợp đồng**: Quy tắc khấu trừ tiền cọc theo biên bản kiểm tra cơ sở vật chất (4 hạng mục), đối soát hoàn cọc hoặc truy thu phụ phí khi checkout.
  - **Chữ ký & Con dấu số**: Dấu mộc số đỏ StorageHub Verified Digital Signature kèm ô chữ ký điện tử của khách hàng.
  - **Hỗ trợ In & Xuất PDF**: Tích hợp nút *"In hợp đồng / Lưu PDF"* kích hoạt lệnh in chuẩn hóa trình duyệt (`window.print()`).

---

## 4. Tự Gia Hạn Hợp Đồng Thuê Kho (Self Extension)

- **Method / URL**: `POST /api/v1/reservations/{reservationId}/extensions`
- **Quyền hạn**: `CUSTOMER`, `SYSTEM_ADMIN`
- **Request Body**:
```json
{
  "newEndDate": "2027-03-01",
  "paymentMethod": "CARD"
}
```
- **Response Thành Công (`201 Created`)**:
```json
{
  "extensionId": 5,
  "reservationId": 30,
  "oldEndDate": "2026-11-30",
  "newEndDate": "2027-03-01",
  "extensionFee": 345000,
  "topUpDeposit": 34500,
  "totalDue": 379500,
  "status": "SUCCEEDED",
  "addendumCode": "CT-2031-A1"
}
```
- **Lỗi va chạm lịch**: `409 EXTENSION_COLLISION` (Kho đã có đơn đặt trước từ ngày X).

---

## 5. Gửi Yêu Cầu Trả Kho (Checkout Request)

- **Method / URL**: `POST /api/v1/reservations/{reservationId}/checkout-request`
- **Quyền hạn**: `CUSTOMER`, `SYSTEM_ADMIN`
- **Hàm Service**: `src/services/rentalService.js` ➔ `createCheckoutRequest(id, body)`
- **Request Body**:
```json
{
  "expectedCheckoutDate": "2026-11-20",
  "reason": "Hoàn tất việc lưu trữ đồ chuyển nhà"
}
```
- **Response Thành Công (`200 OK`)**: Trạng thái đơn chuyển sang `CHECKOUT_PENDING` và tự động sinh thẻ công việc Checkout cho ca trực nhân viên.

---

## 6. Liên Kết Nhanh "Thanh Toán & Hóa Đơn" Từ Kho Của Tôi

- Khi khách hàng truy cập trang **Kho của tôi** (`/rentals`), giao diện bổ sung nút hành động liên kết nhanh:
  `<Link to="/payment">Thanh toán & Hóa đơn</Link>`
- Nút này được đặt trực tiếp trong khu vực hành động của trang `/rentals`, không đặt trên thanh điều hướng Header, giúp khách hàng thuận tiện kiểm tra lịch sử thanh toán cọc, hóa đơn định kỳ và trạng thái tất toán khi có nhu cầu.
