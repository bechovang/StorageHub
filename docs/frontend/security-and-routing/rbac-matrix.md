# Ma Trận Phân Quyền & Bảo Vệ Tuyến Đường (RBAC & ProtectedRoute)

Tài liệu xác định quyền hạn truy cập của 5 vai trò nghiệp vụ trên từng tuyến đường (Route).

---

## 1. Ma Trận Quyền Truy Cập (Role-Based Access Control)

| Đường Dẫn (Route) | Chức Năng | Public | CUSTOMER | STAFF | FACILITY_MANAGER | BUSINESS_OPS | SYSTEM_ADMIN |
|---|---|:---:|:---:|:---:|:---:|:---:|:---:|
| `/browse` | Duyệt danh mục kho | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `/units/:id` | Xem chi tiết thông số kho | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `/login`, `/register` | Đăng nhập / Đăng ký | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `/units/:id/book` | Thanh toán cọc giữ chỗ kho | ❌ | ✅ | ❌ | ❌ | ❌ | ✅ |
| `/rentals` | Danh sách đơn thuê của tôi | ❌ | ✅ | ❌ | ❌ | ❌ | ✅ |
| `/rentals/:id` | Chi tiết hợp đồng & dòng tiền | ❌ | ✅ | ❌ | ❌ | ❌ | ✅ |
| `/rentals/:id/check-in-pass` | Mã QR & PIN nhận kho | ❌ | ✅ | ❌ | ❌ | ❌ | ✅ |
| `/payment` | Modal thanh toán | ❌ | ✅ | ❌ | ❌ | ❌ | ✅ |
| `/tasks` | Bảng Kanban tác vụ nhân viên | ❌ | ❌ | ✅ | ✅ | ❌ | ✅ |
| `/facility` | Bảng điều khiển cơ sở | ❌ | ❌ | ❌ | ✅ | ❌ | ✅ |
| `/facility/units` | Quản lý trạng thái / bảo trì kho | ❌ | ❌ | ❌ | ✅ | ❌ | ✅ |
| `/facility/shifts` | Phân công ca trực nhân viên | ❌ | ❌ | ❌ | ✅ | ❌ | ✅ |
| `/facility/activity` | Nhật ký hoạt động kiểm toán | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ |
| `/overview` | Tổng quan tài chính & dòng tiền | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ |
| `/policy` | Quản lý quy tắc giá & trần | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ |
| `/reports` | Báo cáo doanh thu & biểu đồ | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ |
| `/users` | Quản trị người dùng & vai trò | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| `/login-history` | Lịch sử đăng nhập toàn hệ thống| ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |

---

## 2. Hoạt Động Của `ProtectedRoute.jsx`

Component `ProtectedRoute` kiểm tra 2 điều kiện trước khi cho phép render màn hình:

1. **Kiểm tra đăng nhập**: Nếu chưa có token hợp lệ $\rightarrow$ Chuyển hướng về `/login` (lưu lại trang trước đó trong `location.state`).
2. **Kiểm tra vai trò**: Nếu vai trò của user không nằm trong `allowedRoles` $\rightarrow$ Chuyển hướng về `/403 Forbidden`.

```jsx
<Route
  path="/facility"
  element={
    <ProtectedRoute allowedRoles={["FACILITY_MANAGER", "SYSTEM_ADMIN"]}>
      <FacilityOverviewPage />
    </ProtectedRoute>
  }
/>
```
