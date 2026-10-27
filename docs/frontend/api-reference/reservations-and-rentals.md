# API Reference: Đơn Đặt Chỗ, Hợp Đồng & Gia Hạn (Reservations & Rentals)

Các API quản lý vòng đời đơn thuê từ lúc đặt cọc, lấy mã nhận kho, gia hạn đến khi yêu cầu trả kho.

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

## 3. Tự Gia Hạn Hợp Đồng Thuê Kho (Self Extension)

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

## 4. Gửi Yêu Cầu Trả Kho (Checkout Request)

- **Method / URL**: `POST /api/v1/reservations/{reservationId}/checkout-request`
- **Quyền hạn**: `CUSTOMER`, `SYSTEM_ADMIN`
- **Hàm Service**: `src/services/rentalService.js` ➔ `createCheckoutRequest(id, body)`
- **Request Body**:
```json
{
  "requestedDate": "2026-10-27",
  "timeSlot": "09:00 - 11:00",
  "reason": "Hoàn tất chuyển nhà."
}
```
- **Response Thành Công (`201 Created`)**:
```json
{
  "requestId": 12,
  "reservationId": 30,
  "requestedDate": "2026-10-27",
  "status": "PENDING"
}
```
