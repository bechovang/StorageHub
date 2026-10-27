# API Reference: Quản Trị Người Dùng & Nhật Ký Kiểm Toán (Users & Audit)

Các API dành cho Quản trị viên hệ thống (System Admin) quản lý tài khoản và truy vết lịch sử hoạt động.

---

## 1. Danh Sách Người Dùng Hệ Thống

- **Method / URL**: `GET /api/v1/users`
- **Quyền hạn**: `SYSTEM_ADMIN`
- **Query Params**: `role`, `status` (`0` = chưa kích hoạt/khóa, `1` = hoạt động), `q`, `page`, `page-size`
- **Hàm Service**: `src/services/userService.js` ➔ `getUsers(params)`
- **Response Thành Công (`200 OK`)**:
```json
{
  "items": [
    {
      "id": 1,
      "email": "lan@demo.storagehub.vn",
      "fullName": "Nguyễn Thị Lan",
      "role": "CUSTOMER",
      "status": 1,
      "createdAt": "2026-09-01T08:00:00Z"
    }
  ],
  "total": 13
}
```

---

## 2. Kích Hoạt / Khóa Tài Khoản

- **Method / URL**: `PATCH /api/v1/users/{userId}/status`
- **Quyền hạn**: `SYSTEM_ADMIN`
- **Request Body**:
```json
{
  "status": 1,
  "reason": "Kích hoạt tài khoản khách hàng sau đối soát CMND."
}
```
- **Response Thành Công (`200 OK`)**:
```json
{
  "id": 11,
  "status": 1,
  "updatedAt": "2026-10-27T10:30:00Z"
}
```

---

## 3. Cấp Lại Mật Khẩu Tạm Thời

- **Method / URL**: `POST /api/v1/users/{userId}/reset-password`
- **Quyền hạn**: `SYSTEM_ADMIN`
- **Request Body**:
```json
{
  "sendEmailNotification": true
}
```
- **Response Thành Công (`200 OK`)**:
```json
{
  "userId": 13,
  "temporaryPassword": "SH-TMP-839120",
  "expiresAt": "2026-10-28T10:30:00Z"
}
```

---

## 4. Truy Vết Nhật Ký Hoạt Động (Activity Logs)

- **Method / URL**: `GET /api/v1/activity-logs`
- **Quyền hạn**: `FACILITY_MANAGER`, `BUSINESS_OPS`, `SYSTEM_ADMIN`
- **Query Params**: `entity-type` (`USER`, `UNIT`, `RESERVATION`, `PAYMENT`, `POLICY`), `q`
- **Hàm Service**: `src/services/activityService.js` ➔ `fetchActivityLogs(params)`
- **Response Thành Công (`200 OK`)**:
```json
{
  "items": [
    {
      "id": 101,
      "actorName": "Hoàng Nam (Admin)",
      "entityType": "USER",
      "action": "STATUS_CHANGE",
      "reason": "Kích hoạt tài khoản khách hàng",
      "createdAt": "2026-10-27T10:30:00Z"
    }
  ]
}
```
