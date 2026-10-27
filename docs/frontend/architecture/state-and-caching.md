# Quản Lý Trạng Thái Ứng Dụng (State Management)

Tài liệu mô tả cách Frontend StorageHub phân bố và đồng bộ dữ liệu giữa các Component.

---

## 1. Phân Tầng Trạng Thái

Hệ thống kết hợp giữa **Global Context** (chia sẻ toàn cục) và **Local State / Optimistic Updates** (cục bộ màn hình):

| Tầng Quản Lý | Công Cụ Sử Dụng | Mục Đích |
|---|---|---|
| **Xác thực & Phiên** | `AuthContext` | Lưu token, vai trò người dùng, thông tin profile |
| **Thông báo hệ thống** | `NotificationContext` | Đếm số thông báo chưa đọc, tự động làm mới |
| **Dữ liệu màn hình** | React `useState` / `useReducer` | Form nhập liệu, danh sách lọc, trạng thái modal |
| **Cập nhật nhanh** | Optimistic Updates | Kéo thả Kanban, kiểm tra xung đột ca trực |

---

## 2. Chi Tiết Các Global Context

### 2.1. `AuthContext` (`src/context/AuthContext.jsx`)
- Lưu trữ: `user` (`id`, `email`, `fullName`, `role`), `token`, `isAuthenticated`.
- Cung cấp các phương thức:
  - `login(email, password)`: Gửi request đăng nhập, giải mã JWT và lưu trữ.
  - `logout()`: Dọn dẹp storage và điều hướng về trang chủ.
  - `hasRole(allowedRoles)`: Kiểm tra xem vai trò hiện tại có được phép thực hiện hành động hay không.

### 2.2. `NotificationContext` (`src/context/NotificationContext.jsx`)
- Tự động gọi API `GET /api/v1/notifications/unread-count` để cập nhật huy hiệu số đỏ trên thanh Header.
- Cung cấp hàm `markAllAsRead()` khi người dùng mở xem danh sách thông báo.

---

## 3. Cập Nhật Lạc Quan (Optimistic Updates)

Để giao diện phản hồi tức thì không có độ trễ (zero-latency perceived speed), hệ thống áp dụng kỹ thuật cập nhật lạc quan:

1. **Kanban Task Board (`TaskBoardPage.jsx`)**:
   - Khi nhân viên kéo thả thẻ từ `TODO` sang `DONE`, thẻ lập tức di chuyển sang cột đích trên giao diện.
   - Request `PATCH /api/v1/tasks/{id}/status` được gửi ngầm.
   - Nếu Backend trả về lỗi (ví dụ: vi phạm ràng buộc chưa chụp ảnh hợp đồng), thẻ tự động nhảy ngược về vị trí cũ (Snap-Back) kèm thông báo lỗi.
2. **Kiểm Tra Xung Đột Ca Trực (`StaffShiftsPage.jsx`)**:
   - Chạy hàm `detectShiftConflict` ngay khi người dùng chọn ca trên client để cảnh báo trùng giờ trước khi bấm lưu.
