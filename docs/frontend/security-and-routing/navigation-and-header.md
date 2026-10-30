# Thanh Điều Hướng Động & Giao Diện Di Động (Header & Mobile Drawer)

Tài liệu mô tả cách thanh Header tự động thích ứng với từng vai trò người dùng và trải nghiệm trên thiết bị di động.

---

## 1. Cơ Chế Header Động Theo Từng Vai Trò

Để tránh tình trạng Header hiển thị các liên kết thừa hoặc dẫn đến trang lỗi 403, component Header (`src/components/Header/Header.jsx`) tự động tính toán danh sách menu dựa trên `user.role`:

| Vai Trò Đăng Nhập | Các Mục Menu Hiển Thị Trên Header |
|---|---|
| **Chưa đăng nhập** | `Khám phá kho` (/browse), `Đăng nhập` (/login) |
| **CUSTOMER** | `Khám phá kho` (/browse), `Kho của tôi` (/rentals), `Hỗ trợ` (/support) |
| **STAFF** | `Bảng công việc` (/tasks), `Hỗ trợ sự cố` (/support) |
| **FACILITY_MANAGER** | `Tổng quan` (/facility), `Danh mục kho` (/facility/units), `Lịch phân ca` (/facility/shifts), `Hỗ trợ sự cố` (/support), `Nhật ký` (/facility/activity) |
| **BUSINESS_OPS** | `Tổng quan` (/overview), `Chính sách & Biểu phí` (/policy), `Báo cáo tài chính` (/reports) |
| **SYSTEM_ADMIN** | `Tài khoản` (/users), `Lịch sử đăng nhập` (/login-history), `Nhật ký hệ thống` (/facility/activity), `Chính sách & Biểu phí` (/policy), `Khám phá kho` (/browse) |

> [!NOTE]
> **Quy Tắc Điều Hướng Thanh Toán & Hóa Đơn**:
> - Thanh Header **TUYỆT ĐỐI KHÔNG** đặt nút chuyển hướng trực tiếp đến trang Thanh toán & Hóa đơn (`/payment`) nhằm giữ thanh điều hướng tối giản, tập trung vào vòng đời quản lý kho bãi chính của khách hàng.
> - Khách hàng tiếp cận tính năng Thanh toán & Hóa đơn thông qua nút bấm hành động chuyên biệt được bố trí trực tiếp trong trang **Kho của tôi** (`/rentals`) hoặc thông qua các liên kết thanh toán từ thẻ đơn kho chi tiết.

---

## 2. Thanh Điều Hướng Trên Thiết Bị Di Động (Mobile Drawer)

Trên màn hình có độ rộng `<= 768px`:
- Menu ngang tự động thu gọn thành biểu tượng Hamburger Menu (`List` / `X`).
- Khi người dùng bấm, một bảng trượt (**Navigation Drawer**) mở ra từ cạnh phải với nền làm mờ (backdrop).
- Drawer cung cấp:
  1. Huy hiệu vai trò và thông tin người dùng đang đăng nhập.
  2. Toàn bộ danh sách liên kết theo đúng vai trò được phân quyền.
  3. Nút Đăng xuất và nút đóng (icon `X`) thao tác dễ dàng bằng một tay.
