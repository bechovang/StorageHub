# API Reference: Xác Thực & Phiên Làm Việc (Auth & Session)

Các API phục vụ đăng nhập, đăng ký và thông tin hồ sơ cá nhân.

---

## 1. Đăng Nhập Hệ Thống

- **Method / URL**: `POST /api/v1/auth/login`
- **Quyền hạn**: Công khai (Public)
- **Hàm Service**: `src/context/AuthContext.jsx` ➔ `login(email, password)`
- **Request Body**:
```json
{
  "email": "lan@demo.storagehub.vn",
  "password": "password"
}
```
- **Response Thành Công (`200 OK`)**:
```json
{
  "token": "eyJhbGciOiJIUzM4NCJ9...",
  "user": {
    "id": 1,
    "email": "lan@demo.storagehub.vn",
    "fullName": "Nguyễn Thị Lan",
    "role": "CUSTOMER"
  }
}
```
- **Lỗi thường gặp**: `401 AUTH_CREDENTIALS_INVALID` (Email/mật khẩu sai), `403 USER_ACCOUNT_LOCKED` (Tài khoản bị khóa).

---

## 2. Đăng Ký Tài Khoản Khách Hàng

- **Method / URL**: `POST /api/v1/auth/register`
- **Quyền hạn**: Công khai (Public)
- **Request Body**:
```json
{
  "fullName": "Nguyễn Văn A",
  "email": "customer@example.com",
  "phone": "0987654321",
  "password": "Password123"
}
```
- **Response Thành Công (`201 Created`)**:
```json
{
  "id": 15,
  "email": "customer@example.com",
  "fullName": "Nguyễn Văn A",
  "role": "CUSTOMER",
  "status": 1
}
```
- **Lỗi thường gặp**: `409 USER_EMAIL_EXISTS` (Email đã tồn tại).

---

## 3. Lấy Hồ Sơ Người Dùng Hiện Tại

- **Method / URL**: `GET /api/v1/auth/me`
- **Quyền hạn**: Bất kỳ người dùng đã xác thực (Bearer Token)
- **Response Thành Công (`200 OK`)**:
```json
{
  "id": 1,
  "email": "lan@demo.storagehub.vn",
  "fullName": "Nguyễn Thị Lan",
  "role": "CUSTOMER",
  "phone": "0901234567"
}
```
