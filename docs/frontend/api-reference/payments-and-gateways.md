# API Reference: Thanh Toán & Cổng Thanh Toán (Payments & Gateways)

Các API phục vụ khởi tạo phiên giao dịch, thăm dò trạng thái (polling) và xác nhận mã OTP.

---

## 1. Khởi Tạo Phiên Thanh Toán Mới

- **Method / URL**: `POST /api/v1/payments`
- **Quyền hạn**: `CUSTOMER`, `SYSTEM_ADMIN`
- **Hàm Service**: `src/services/paymentService.js` ➔ `createPayment(body)`
- **Request Body mẫu (PAYOS thật)**:
```json
{
  "purpose": "DEPOSIT",
  "reservationId": 30,
  "method": "PAYOS"
}
```
- **Request Body mẫu (CARD demo)**:
```json
{
  "purpose": "DEPOSIT",
  "reservationId": 30,
  "method": "CARD",
  "card": {
    "number": "4111222233334444",
    "expiry": "12/28",
    "cvc": "123"
  }
}
```
- **Response Thành Công (`201 Created`)**:
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

## 2. Thăm Dò Trạng Thái Giao Dịch (Polling Loop)

- **Method / URL**: `GET /api/v1/payments/{paymentId}`
- **Quyền hạn**: Người tạo giao dịch hoặc `SYSTEM_ADMIN`
- **Hàm Service**: `src/services/paymentService.js` ➔ `getPayment(paymentId)`
- **Response Thành Công (`200 OK`)**:
```json
{
  "paymentId": 64,
  "receiptCode": "RT-2026-PAYOS",
  "status": "SUCCEEDED",
  "amount": 34500,
  "completedAt": "2026-10-27T10:51:30Z"
}
```
*Ghi chú: Frontend thăm dò (poll) mỗi 2 giây một lần khi trạng thái là `PROCESSING` hoặc `PENDING` cho tới khi đạt `SUCCEEDED` hoặc hết thời gian 5 phút (`EXPIRED`).*

---

## 3. Xác Nhận Mã OTP (Chỉ Dành Cho MoMo)

- **Method / URL**: `POST /api/v1/payments/{paymentId}/confirm`
- **Quyền hạn**: `CUSTOMER`, `SYSTEM_ADMIN`
- **Request Body**:
```json
{
  "otp": "123456"
}
```
- **Response Thành Công (`200 OK`)**:
```json
{
  "paymentId": 64,
  "status": "SUCCEEDED",
  "message": "Giao dịch thanh toán ví điện tử thành công."
}
```
- **Lỗi**: `400 INVALID_OTP` (Mã xác thực không chính xác).
