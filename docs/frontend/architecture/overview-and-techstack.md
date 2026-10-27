# Tổng Quan Công Nghệ & Cấu Trúc Mã Nguồn

Tài liệu mô tả Tech Stack và quy ước cấu trúc thư mục của phân hệ Frontend StorageHub.

---

## 1. Công Nghệ Cốt Lõi (Tech Stack)

| Thành phần | Thư viện / Phiên bản | Vai trò trong hệ thống |
|---|---|---|
| **Core UI** | React `^19.2.8` | Xây dựng giao diện phản ứng nhanh (reactive), hooks, context |
| **Bundler** | Vite `^8.3.0` | Hot reload siêu tốc, đóng gói Rollup tối ưu production |
| **Router** | React Router DOM `^7.18.4` | Khai báo route declarative, Dynamic params, Role Guards |
| **Charts** | Recharts `^3.10.1` | Biểu đồ doanh thu với dải màu đỏ đơn sắc (Swiss Red) |
| **Icons** | Phosphor Icons `^2.1.10` | Bộ icon SVG đồng nhất kiểu dáng |
| **QR Engine** | qrcode `^1.5.4` | Tạo mã QR động cho Check-in Pass và PayOS |
| **Design Tokens** | Pure CSS Tokens | Toàn bộ màu sắc, typography, spacing được token hóa |

---

## 2. Cấu Trúc Thư Mục Nguồn (`frontend/src/`)

```text
frontend/src/
├── app/               # Root App & Định nghĩa Router (App.jsx, router.jsx)
├── components/        # Atomic UI Components dùng chung (Button, Card, Modal, Header...)
├── context/           # React Context chia sẻ toàn cục (AuthContext, NotificationContext)
├── features/          # Luồng nghiệp vụ phức tạp (checkin, checkout, extension, payment)
├── pages/             # Các màn hình view phân theo 5 vai trò (admin, business, customer...)
├── services/          # Tầng giao tiếp mạng HTTP Client và dữ liệu mẫu Fallback
├── styles/            # CSS Design Tokens (tokens.css, utilities.css, global.css)
├── utils/             # Hàm tiện ích (format tiền tệ VNĐ, ngày tháng ICT, nhãn trạng thái)
└── validation/        # Schema validate form (email, password, thẻ ngân hàng, OTP)
```

---

## 3. Quy Ước Thiết Kế Giao Diện (Design Principles)

1. **Bảng màu Swiss Red Monochromatic**: Dùng sắc đỏ thương hiệu (`--sh-red-600: #d32f2f`) làm chủ đạo, biến thiên sắc độ từ nhạt đến đậm cho biểu đồ và thẻ dữ liệu; không dùng màu đen đơn độc trên biểu đồ.
2. **Không phụ thuộc UI Framework nặng**: Dùng CSS thuần với Design Tokens, tốc độ tải trang nhanh và dễ kiểm soát chi tiết từng pixel.
3. **Phân tầng rõ ràng**: UI Component chỉ đảm nhiệm việc render và nhận sự kiện; toàn bộ logic gọi API và xử lý dữ liệu được tách riêng vào thư mục `src/services/`.
4. **Bảo vệ độ tương phản trạng thái (State & Hover Contrast Protection)**: Mọi phần tử tương tác (Period chips, Tab pills, Filter segments) khi ở trạng thái kích hoạt (`--active`, `.is-active`) đều bảo toàn độ tương phản màu chữ trắng tuyệt đối (`#ffffff`), sử dụng `:hover:not(...)` và `--active:hover` để ngăn ngừa triệt để lỗi chữ đen trên nền tối.
5. **Quy tắc giữ chỗ theo thanh toán (Payment-First Reservation Rule)**: Khách hàng duyệt kho hay bấm đặt kho chỉ tạo đơn ở trạng thái `PENDING_PAYMENT` và **hoàn toàn chưa giữ chỗ**. Ô kho chỉ chuyển sang trạng thái `RESERVED` sau khi giao dịch cọc 10% chuyển sang `SUCCEEDED`. Mọi màn hình Catalog, Unit Detail và Payment Modal đều hiển thị thông điệp và cảnh báo minh bạch này ("Ai thanh toán cọc trước giữ chỗ trước").
6. **Chuẩn hóa Nút Bấm & Micro-transitions (Unified Button System)**: Toàn bộ nút bấm trên toàn hệ thống (từ các trang public như Browse, Unit Detail, Login, Register đến các trang quản trị nội bộ) đều tuân thủ bảng Design Tokens (`--btn-shadow*`, `--btn-transition`), hiệu ứng đổ bóng khối đặc trưng (Neo-Brutalism offset shadow `2px 2px 0px`), viền góc sắc nét `0px`, và micro-interaction (`transform: translate(-1px, -1px)` khi hover, `translate(1px, 1px)` khi active). Chi tiết tham khảo [Tài liệu Design Tokens Toàn Diện](./design-tokens.md).
