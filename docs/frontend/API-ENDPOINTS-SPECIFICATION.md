# Đặc Tả Chi Tiết Các API Endpoints Tích Hợp (API Endpoints Specification)

Tài liệu này cung cấp đặc tả kỹ thuật chi tiết của toàn bộ các API Endpoints mà phân hệ **Frontend StorageHub** tích hợp với máy chủ **Backend Spring Boot** (chuẩn hóa 100% theo hợp đồng `contracts/openapi.yaml`).

> **Quy ước xuyên suốt:**
> - Mọi endpoint (trừ 3 endpoint xác thực công khai) đều yêu cầu Header: `Authorization: Bearer <JWT_TOKEN>`.
> - Tiền tệ: Đơn vị VNĐ là số nguyên (`number`), không dùng số thập phân (AD-7).
> - Ngày tháng: Định dạng `"YYYY-MM-DD"` (lịch ICT); Thời gian: Chuỗi ISO-8601 UTC (AD-7).
> - Danh sách phân trang theo envelope: `{ items, page, pageSize, total }` (AD-8).
> - Lỗi theo envelope: `{ code, message, fieldErrors: [{ field, message }] }` (AD-8).

---

## Danh Mục Phân Loại Endpoints

1. [1. Xác Thực & Phiên Đăng Nhập (Auth & Session)](#1-xác-thực--phiên-đăng-nhập-auth--session)
2. [2. Danh Mục Kho & Báo Giá (Units & Catalog)](#2-danh-mục-kho--báo-giá-units--catalog)
3. [3. Đơn Đặt Chỗ, Hợp Đồng & Check-in Pass (Reservations & Rentals)](#3-đơn-đặt-chỗ-hợp-đồng--check-in-pass-reservations--rentals)
4. [4. Thanh Toán & Cổng Thanh Toán (Payments & Gateways)](#4-thanh-toán--cổng-thanh-toán-payments--gateways)
5. [5. Bảng Công Việc & 4 Nghi Thức Tác Nghiệp (Tasks & Operational Rituals)](#5-bảng-công-việc--4-nghi-thức-tác-nghiệp-tasks--operational-rituals)
6. [6. Quản Lý Cơ Sở & Phân Ca Trực (Facility Management & Shifts)](#6-quản-lý-cơ-sở--phân-ca-trực-facility-management--shifts)
7. [7. Báo Cáo Tài Chính & Quản Lý Chính Sách Giá (Business Ops & Reports)](#7-báo-cáo-tài-chính--quản-lý-chính-sách-giá-business-ops--reports)
8. [8. Quản Trị Người Dùng & Phân Quyền (User Management & RBAC)](#8-quản-trị-người-dùng--phân-quyền-user-management--rbac)
9. [9. Nhật Ký Kiểm Toán & Thông Báo (Activity Logs & Notifications)](#9-nhật-ký-kiểm-toán--thông-báo-activity-logs--notifications)

---

## 1. Xác Thực & Phiên Đăng Nhập (Auth & Session)

### 1.1. Đăng nhập hệ thống
- **URL**: `POST /api/v1/auth/login`
- **Quyền hạn**: Công khai (Public)
- **Hàm Service**: `src/context/AuthContext.jsx` ➔ `login(email, password)`
- **Request Body**:
```json
{
  "email": "lan@demo.storagehub.vn",
  "password": "password"
}
```
- **Phản hồi thành công (`200 OK`)**:
```json
{
  "token": "eyJhbGciOiJIUzM4NCJ9.eyJzdWIiOiJsYW5AZGVtby5zdG9yYWdlaHViLnZuIiwidXNlcklkIjoxLCJyb2xlIjoiQ1VTVE9NRVIifQ...",
  "user": {
    "id": 1,
    "email": "lan@demo.storagehub.vn",
    "fullName": "Nguyễn Thị Lan",
    "role": "CUSTOMER",
    "facilityId": null
  }
}
```
- **Mã lỗi thường gặp**:
  - `401 AUTH_CREDENTIALS_INVALID`: "Email hoặc mật khẩu không chính xác."
  - `403 USER_ACCOUNT_LOCKED`: "Tài khoản của bạn đã bị khóa hoặc chưa kích hoạt."

---

### 1.2. Đăng ký tài khoản khách hàng mới
- **URL**: `POST /api/v1/auth/register`
- **Quyền hạn**: Công khai (Public)
- **Hàm Service**: `src/pages/auth/RegisterPage.jsx`
- **Request Body**:
```json
{
  "fullName": "Nguyễn Văn A",
  "email": "customer@example.com",
  "phone": "0987654321",
  "password": "SecurePassword123"
}
```
- **Phản hồi thành công (`201 Created`)**:
```json
{
  "id": 15,
  "email": "customer@example.com",
  "fullName": "Nguyễn Văn A",
  "role": "CUSTOMER",
  "status": 1
}
```
- **Mã lỗi**: `409 USER_EMAIL_EXISTS`: "Email này đã được đăng ký trong hệ thống."

---

### 1.3. Lấy thông tin tài khoản hiện tại
- **URL**: `GET /api/v1/auth/me`
- **Quyền hạn**: Bất kỳ người dùng đã xác thực (Bearer Token)
- **Phản hồi thành công (`200 OK`)**:
```json
{
  "id": 1,
  "email": "lan@demo.storagehub.vn",
  "fullName": "Nguyễn Thị Lan",
  "role": "CUSTOMER",
  "phone": "0901234567",
  "facilityId": null
}
```

---

## 2. Danh Mục Kho & Báo Giá (Units & Catalog)

### 2.1. Lấy tùy chọn bộ lọc kho
- **URL**: `GET /api/v1/units/filter-options`
- **Quyền hạn**: Công khai (Public)
- **Hàm Service**: `src/services/unitService.js` ➔ `getUnitFilterOptions()`
- **Phản hồi thành công (`200 OK`)**:
```json
{
  "facilities": [
    { "id": 1, "name": "Tân Bình Depot", "address": "123 Hoàng Văn Thụ, Tân Bình" }
  ],
  "types": [
    { "id": 1, "name": "Locker", "sizeM2": 1.5, "baseMonthlyRent": 100000 },
    { "id": 2, "name": "Small (S)", "sizeM2": 4.0, "baseMonthlyRent": 345000 },
    { "id": 3, "name": "Medium (M)", "sizeM2": 8.0, "baseMonthlyRent": 380000 },
    { "id": 4, "name": "Large (L)", "sizeM2": 16.0, "baseMonthlyRent": 900000 }
  ],
  "statuses": ["AVAILABLE", "RESERVED", "RENTED", "MAINTENANCE", "RETIRED"]
}
```

---

### 2.2. Tìm kiếm danh sách kho (Catalog Search)
- **URL**: `GET /api/v1/units`
- **Quyền hạn**: Công khai (Public)
- **Query Params**:
  - `facility-id`: `number` (tùy chọn)
  - `type-id`: `number` (tùy chọn)
  - `status`: `string` (mặc định `"AVAILABLE"`)
  - `q`: `string` (tìm theo mã kho, ví dụ `"S-2"`)
  - `page`: `number` (mặc định `1`)
  - `page-size`: `number` (mặc định `25`)
- **Hàm Service**: `src/services/unitService.js` ➔ `searchUnits(params)`
- **Phản hồi thành công (`200 OK`)**:
```json
{
  "items": [
    {
      "id": 2,
      "code": "S-2",
      "typeName": "Small (S)",
      "sizeM2": 4.0,
      "floor": 1,
      "zoneCode": "A",
      "facilityName": "Tân Bình Depot",
      "accessType": "PIN",
      "baseMonthlyRent": 345000,
      "status": "AVAILABLE"
    }
  ],
  "page": 1,
  "pageSize": 25,
  "total": 1
}
```

---

### 2.3. Báo giá dự kiến đơn thuê (Pricing Engine Quote)
- **URL**: `GET /api/v1/units/{unitId}/quote`
- **Quyền hạn**: Công khai hoặc Đăng nhập
- **Query Params**: `start-date` (YYYY-MM-DD), `duration-months` (số nguyên: 1, 3, 6, 12)
- **Hàm Service**: `src/services/unitService.js` ➔ `getUnitQuote(unitId, { startDate, durationMonths })`
- **Phản hồi thành công (`200 OK`)**:
```json
{
  "unitId": 2,
  "unitCode": "S-2",
  "monthlyRent": 345000,
  "durationMonths": 3,
  "totalRent": 1035000,
  "depositRate": 10,
  "depositAmount": 34500,
  "totalDueNow": 34500,
  "policyVersion": "v3"
}
```

---

## 3. Đơn Đặt Chỗ, Hợp Đồng & Check-in Pass (Reservations & Rentals)

### 3.1. Tạo đơn đặt giữ chỗ kho
- **URL**: `POST /api/v1/reservations`
- **Quyền hạn**: `CUSTOMER`, `SYSTEM_ADMIN`
- **Hàm Service**: `src/services/paymentService.js` ➔ `createReservation(...)`
- **Request Body**:
```json
{
  "unitId": 2,
  "startDate": "2026-11-01",
  "durationMonths": 3
}
```
- **Phản hồi thành công (`201 Created`)**:
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

---

### 3.2. Lấy thông tin Check-in Pass (Mã QR & PIN nhận kho)
- **URL**: `GET /api/v1/reservations/{reservationId}/check-in-pass`
- **Quyền hạn**: `CUSTOMER`, `STAFF`, `SYSTEM_ADMIN`
- **Hàm Service**: `src/services/rentalService.js` ➔ `getCheckInPass(reservationId)`
- **Phản hồi thành công (`200 OK`)**:
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

### 3.3. Yêu cầu gia hạn đơn thuê kho (Self Extension)
- **URL**: `POST /api/v1/reservations/{reservationId}/extensions`
- **Quyền hạn**: `CUSTOMER`, `SYSTEM_ADMIN`
- **Request Body**:
```json
{
  "newEndDate": "2027-03-01",
  "paymentMethod": "CARD"
}
```
- **Phản hồi thành công (`201 Created`)**:
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
- **Mã lỗi va chạm lịch**: `409 EXTENSION_COLLISION`:  
  *"Không thể gia hạn: Kho đã có đơn đặt trước bắt đầu từ ngày 2026-12-05. Ngày trả kho muộn nhất là 2026-12-04."*

---

### 3.4. Gửi yêu cầu trả kho (Checkout Request)
- **URL**: `POST /api/v1/reservations/{reservationId}/checkout-request`
- **Quyền hạn**: `CUSTOMER`, `SYSTEM_ADMIN`
- **Hàm Service**: `src/services/rentalService.js` ➔ `createCheckoutRequest(id, body)`
- **Request Body**:
```json
{
  "requestedDate": "2026-10-27",
  "timeSlot": "09:00 - 11:00",
  "reason": "Hoàn tất chuyển nhà, trả lại mặt bằng kho."
}
```
- **Phản hồi thành công (`201 Created`)**:
```json
{
  "requestId": 12,
  "reservationId": 30,
  "requestedDate": "2026-10-27",
  "status": "PENDING"
}
```

---

## 4. Thanh Toán & Cổng Thanh Toán (Payments & Gateways)

### 4.1. Khởi tạo phiên thanh toán mới
- **URL**: `POST /api/v1/payments`
- **Quyền hạn**: `CUSTOMER`, `SYSTEM_ADMIN`
- **Hàm Service**: `src/services/paymentService.js` ➔ `createPayment(body)`
- **Request Body**:
```json
{
  "purpose": "DEPOSIT",
  "reservationId": 30,
  "method": "PAYOS",
  "card": null,
  "momoPhone": null
}
```
- **Phản hồi thành công (`201 Created`)**:
```json
{
  "paymentId": 64,
  "receiptCode": "RT-2026-PAYOS",
  "amount": 34500,
  "method": "PAYOS",
  "status": "PENDING",
  "qrCodeUrl": "data:image/png;base64,iVBORw0KGgo...",
  "checkoutUrl": "https://pay.payos.vn/web/100064",
  "expiresAt": "2026-10-27T10:55:00Z"
}
```

---

### 4.2. Lấy trạng thái phiên thanh toán (Polling loop)
- **URL**: `GET /api/v1/payments/{paymentId}`
- **Quyền hạn**: Người tạo giao dịch hoặc `SYSTEM_ADMIN`
- **Hàm Service**: `src/services/paymentService.js` ➔ `getPayment(paymentId)`
- **Phản hồi (`200 OK`)**:
```json
{
  "paymentId": 64,
  "receiptCode": "RT-2026-PAYOS",
  "status": "SUCCEEDED",
  "amount": 34500,
  "completedAt": "2026-10-27T10:51:30Z"
}
```

---

### 4.3. Xác nhận OTP MoMo (Bước 2)
- **URL**: `POST /api/v1/payments/{paymentId}/confirm`
- **Quyền hạn**: `CUSTOMER`, `SYSTEM_ADMIN`
- **Request Body**:
```json
{
  "otp": "123456"
}
```
- **Phản hồi thành công (`200 OK`)**:
```json
{
  "paymentId": 64,
  "status": "SUCCEEDED",
  "message": "Giao dịch thanh toán ví điện tử thành công."
}
```

---

## 5. Bảng Công Việc & 4 Nghi Thức Tác Nghiệp (Tasks & Operational Rituals)

### 5.1. Lấy danh sách nhiệm vụ của nhân viên
- **URL**: `GET /api/v1/tasks`
- **Quyền hạn**: `STAFF`, `FACILITY_MANAGER`, `SYSTEM_ADMIN`
- **Hàm Service**: `src/services/taskService.js` ➔ `getStaffTasks()`
- **Phản hồi thành công (`200 OK`)**:
```json
{
  "items": [
    {
      "id": 40,
      "type": "CHECKOUT",
      "refCode": "BK-1050",
      "unitCode": "M-1",
      "assignedStaffName": "Trần Minh",
      "workDate": "2026-10-27",
      "status": "TODO",
      "ritualsCompleted": false
    }
  ],
  "total": 1
}
```

---

### 5.2. Cập nhật trạng thái nhiệm vụ & Nghi thức (Ritual Completion)
- **URL**: `PATCH /api/v1/tasks/{taskId}/status`
- **Quyền hạn**: `STAFF`, `FACILITY_MANAGER`, `SYSTEM_ADMIN`
- **Request Body mẫu cho 4 nghi thức**:

#### (A) Nghi thức Check-in (`CHECKIN`):
```json
{
  "status": "DONE",
  "ritualType": "CHECKIN",
  "payload": {
    "contractPhotoUrl": "/storage/contracts/CT-2031-signed.jpg",
    "paymentMethod": "CARD",
    "accessPin": "482913"
  }
}
```

#### (B) Nghi thức Checkout & Tất toán (`CHECKOUT`):
```json
{
  "status": "DONE",
  "ritualType": "CHECKOUT",
  "payload": {
    "damageCharges": 50000,
    "damageReason": "Móp thanh khóa cửa ngăn số 2",
    "refundAmount": 0,
    "extraCharged": 12000,
    "checklist": {
      "cleanFloor": true,
      "keyReturned": true,
      "itemsCleared": true
    }
  }
}
```

#### (C) Nghi thức Vệ sinh sau trả kho (`CLEANING`):
```json
{
  "status": "DONE",
  "ritualType": "CLEANING",
  "payload": {
    "sweptAndMopped": true,
    "deodorized": true,
    "lockTested": true
  }
}
```

- **Ràng buộc Snapshot vi phạm (Snap-Back Guard)**: Nếu gửi `status: "DONE"` mà thiếu ảnh hợp đồng hoặc chưa hoàn tất checklist bắt buộc, API trả về `422 SNAP_BACK_VIOLATION` và thẻ tự động dời về cột `IN_PROGRESS`.

---

## 6. Quản Lý Cơ Sở & Phân Ca Trực (Facility Management & Shifts)

### 6.1. Bảng điều khiển giám sát cơ sở
- **URL**: `GET /api/v1/facility/overview`
- **Quyền hạn**: `FACILITY_MANAGER`, `SYSTEM_ADMIN`
- **Hàm Service**: `src/services/facilityService.js` ➔ `getFacilityOverview()`
- **Phản hồi thành công (`200 OK`)**:
```json
{
  "facilityId": 1,
  "facilityName": "Tân Bình Depot",
  "totalUnits": 20,
  "occupancyRate": 75.0,
  "counts": {
    "AVAILABLE": 5,
    "RENTED": 12,
    "RESERVED": 2,
    "MAINTENANCE": 1,
    "RETIRED": 0
  }
}
```

---

### 6.2. Phân ca trực cho nhân viên
- **URL**: `POST /api/v1/shifts`
- **Quyền hạn**: `FACILITY_MANAGER`, `SYSTEM_ADMIN`
- **Hàm Service**: `src/services/shiftService.js` ➔ `createShiftAssignment(body)`
- **Request Body**:
```json
{
  "staffId": 2,
  "workDate": "2026-10-28",
  "shiftWindow": "MORNING",
  "zoneCode": "A"
}
```
- **Mã lỗi phát hiện xung đột ca trực**: `409 SHIFT_CONFLICT`:  
  *"Nhân viên Trần Minh đã được phân công ca MORNING tại Khu B vào ngày này."*

---

## 7. Báo Cáo Tài Chính & Quản Lý Chính Sách Giá (Business Ops & Reports)

### 7.1. Báo cáo tổng hợp số liệu tài chính
- **URL**: `GET /api/v1/reports/financial-summary`
- **Quyền hạn**: `BUSINESS_OPS`, `SYSTEM_ADMIN`
- **Query Params**: `period` (`THIS_MONTH`, `THIS_QUARTER`, `YEAR_TO_DATE`), `customRange`
- **Hàm Service**: `src/services/reportService.js` ➔ `getFinancialSummary(period)`
- **Phản hồi thành công (`200 OK`)**:
```json
{
  "period": "THIS_QUARTER",
  "totalRevenue": 28450000,
  "rentRevenue": 24500000,
  "extensionRevenue": 3200000,
  "surchargeRevenue": 750000,
  "activeDeposits": 2845000,
  "forfeitedDeposits": 150000
}
```

---

### 7.2. Doanh thu theo tháng phục vụ biểu đồ (Monochromatic Chart Data)
- **URL**: `GET /api/v1/reports/monthly-revenue`
- **Quyền hạn**: `BUSINESS_OPS`, `SYSTEM_ADMIN`
- **Query Params**: `months` (số tháng lịch sử, ví dụ `6`)
- **Phản hồi thành công (`200 OK`)**:
```json
{
  "items": [
    { "month": "2026-05", "revenue": 18200000, "rent": 16000000, "extension": 2200000 },
    { "month": "2026-06", "revenue": 21400000, "rent": 19000000, "extension": 2400000 },
    { "month": "2026-07", "revenue": 25100000, "rent": 22000000, "extension": 3100000 },
    { "month": "2026-08", "revenue": 27800000, "rent": 24500000, "extension": 3300000 },
    { "month": "2026-09", "revenue": 28900000, "rent": 25400000, "extension": 3500000 },
    { "month": "2026-10", "revenue": 31200000, "rent": 27500000, "extension": 3700000 }
  ]
}
```

---

## 8. Quản Trị Người Dùng & Phân Quyền (User Management & RBAC)

### 8.1. Danh sách người dùng hệ thống
- **URL**: `GET /api/v1/users`
- **Quyền hạn**: `SYSTEM_ADMIN`
- **Query Params**: `role` (`CUSTOMER`, `STAFF`, `FACILITY_MANAGER`, `BUSINESS_OPS`, `SYSTEM_ADMIN`), `status` (`0`, `1`), `q`, `page`, `page-size`
- **Hàm Service**: `src/services/userService.js` ➔ `getUsers(params)`
- **Phản hồi (`200 OK`)**:
```json
{
  "items": [
    {
      "id": 1,
      "email": "lan@demo.storagehub.vn",
      "fullName": "Nguyễn Thị Lan",
      "role": "CUSTOMER",
      "phone": "0901234567",
      "status": 1,
      "createdAt": "2026-09-01T08:00:00Z"
    }
  ],
  "total": 13
}
```

---

### 8.2. Thay đổi trạng thái tài khoản (Kích hoạt / Khóa)
- **URL**: `PATCH /api/v1/users/{userId}/status`
- **Quyền hạn**: `SYSTEM_ADMIN`
- **Request Body**:
```json
{
  "status": 0,
  "reason": "Phát hiện dấu hiệu truy cập bất thường từ nhiều IP lạ."
}
```
- **Phản hồi (`200 OK`)**:
```json
{
  "id": 1,
  "status": 0,
  "updatedAt": "2026-10-27T10:52:00Z"
}
```

---

### 8.3. Cấp lại mật khẩu tạm thời
- **URL**: `POST /api/v1/users/{userId}/reset-password`
- **Quyền hạn**: `SYSTEM_ADMIN`
- **Request Body**:
```json
{
  "sendEmailNotification": true
}
```
- **Phản hồi (`200 OK`)**:
```json
{
  "userId": 13,
  "temporaryPassword": "SH-TMP-839120",
  "expiresAt": "2026-10-28T10:52:00Z"
}
```

---

## 9. Nhật Ký Kiểm Toán & Thông Báo (Activity Logs & Notifications)

### 9.1. Lấy nhật ký hoạt động hệ thống (Activity Logs)
- **URL**: `GET /api/v1/activity-logs`
- **Quyền hạn**: `FACILITY_MANAGER`, `BUSINESS_OPS`, `SYSTEM_ADMIN`
- **Query Params**: `entity-type` (`UNIT`, `RESERVATION`, `PAYMENT`, `POLICY`, `USER`), `q`, `page`, `page-size`
- **Hàm Service**: `src/services/activityService.js` ➔ `fetchActivityLogs(params)`
- **Phản hồi (`200 OK`)**:
```json
{
  "items": [
    {
      "id": 101,
      "actorId": 5,
      "actorName": "Hoàng Nam (Admin)",
      "entityType": "USER",
      "entityId": 11,
      "action": "STATUS_CHANGE",
      "fromValue": "0",
      "toValue": "1",
      "reason": "Kích hoạt tài khoản khách hàng sau đối soát CMND",
      "createdAt": "2026-10-27T10:30:00Z"
    }
  ],
  "total": 1
}
```

---

### 9.2. Đếm số thông báo chưa đọc
- **URL**: `GET /api/v1/notifications/unread-count`
- **Quyền hạn**: Bất kỳ người dùng đã đăng nhập
- **Hàm Service**: `src/services/notificationService.js` ➔ `getUnreadNotificationCount()`
- **Phản hồi (`200 OK`)**:
```json
{
  "unreadCount": 3
}
```
