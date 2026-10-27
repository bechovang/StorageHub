# Thanh Điều Hướng Động & Giao Diện Di Động (Header & Mobile Drawer)

Tài liệu mô tả cách thanh Header tự động thích ứng với từng vai trò người dùng, cơ chế mở rộng tab ngữ cảnh và trải nghiệm trên thiết bị di động.

---

## 1. Cơ Chế Header Động Theo Từng Vai Trò

Để tránh tình trạng Header hiển thị các liên kết thừa hoặc dẫn đến trang lỗi 403, component Header (`src/components/Header/Header.jsx`) tự động tính toán danh sách menu dựa trên `user.role`:

| Vai Trò Đăng Nhập | Các Mục Menu Hiển Thị Trên Header |
|---|---|
| **Chưa đăng nhập** | `Tìm kho` (/browse), `Đăng nhập` (/login) |
| **CUSTOMER** | `Tìm kho` (/browse), `Đơn thuê của tôi` (/rentals), `Trợ giúp` (/support) *(+ `Thanh toán & Hóa đơn` khi ở trang đơn thuê)* |
| **STAFF** | `Công việc` (/tasks), `Hỗ trợ khách` (/support) |
| **FACILITY_MANAGER** | `Tổng quan` (/facility), `Kho bãi` (/facility/units), `Ca trực` (/facility/shifts), `Nhật ký` (/facility/activity) |
| **BUSINESS_OPS** | `Tổng quan` (/overview), `Chính sách giá` (/policy), `Báo cáo doanh thu` (/reports) |
| **SYSTEM_ADMIN** | `Người dùng` (/users), `Lịch sử đăng nhập` (/login-history), `Cơ sở` (/facility), `Báo cáo` (/reports) |

---

## 2. Ngữ Cảnh Tab Điều Hướng Động (Dynamic Contextual Tabs)

- Khi khách hàng truy cập vào **Kho của tôi** (`/rentals`) hoặc trang **Thanh toán** (`/payment`), thanh điều hướng Header tự động nhận diện `location.pathname.startsWith("/rentals") || location.pathname.startsWith("/payment")`.
- Header lập tức tự động thêm tab **"Thanh toán & Hóa đơn"** (`/payment`) vào danh sách điều hướng chính của khách hàng.
- Trải nghiệm này giúp khách hàng dễ dàng chuyển đổi mượt mà giữa việc theo dõi tiến độ đơn kho, kiểm tra Thẻ nhận kho, xem hợp đồng và đối soát các giao dịch cọc / thanh toán hóa đơn mà không cần phải tìm kiếm phức tạp.

---

## 3. Thanh Điều Hướng Trên Thiết Bị Di Động (Mobile Drawer)

Trên màn hình có độ rộng `<= 768px`:
- Menu ngang tự động thu gọn thành biểu tượng Hamburger Menu (`List` / `X`).
- Khi người dùng bấm, một bảng trượt (**Navigation Drawer**) mở ra từ cạnh phải với nền làm mờ (backdrop).
- Drawer cung cấp:
  1. Huy hiệu vai trò và thông tin người dùng đang đăng nhập.
  2. Toàn bộ danh sách liên kết theo vai trò (bao gồm cả tab động ngữ cảnh nếu có).
  3. Nút Đăng xuất và nút đóng (icon `X`) thao tác dễ dàng bằng một tay.
