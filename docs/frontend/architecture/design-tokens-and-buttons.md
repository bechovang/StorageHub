# Chuẩn Hóa Nút Tương Tác & Design Tokens (Button Design System)

Tài liệu quy định hệ thống nút bấm (Button), các Design Tokens chuẩn hóa về bóng đổ (Shadow), chuyển động tương tác (Motion/Transition) và nguyên tắc DRY trên toàn phân hệ Frontend.

---

## 1. Triết Lý Thiết Kế: Swiss Neo-Brutalist Interactive Buttons

Các trang ban đầu (Landing, Browse, Login, Unit Detail) trước đây sử dụng các nút phẳng hoặc chuyển đổi màu đơn thuần mà thiếu vắng hiệu ứng bóng đổ và chuyển động nhẹ (micro-interaction) như các trang nội bộ quản trị.  
Để tạo cảm giác chân thực, tương tác cơ khí và nhất quán toàn hệ thống, toàn bộ nút trong ứng dụng đã được quy về một chuẩn duy nhất:
- **Góc cạnh dứt khoát**: Bán kính bo góc `0px` (`border-radius: var(--radius-none, 0px)`).
- **Bóng đổ góc cứng (Hard Offset Shadow)**: Bóng góc dưới phải sắc nét, tạo độ sâu như các phím bấm cơ học.
- **Hiệu ứng trượt nhẹ khi Hover**: Di chuyển `-1px, -1px` đồng thời mở rộng bóng đổ từ `2px` lên `3px`.
- **Hiệu ứng nhấn chìm khi Active**: Nhấn thụt xuống `+1px, +1px` và thu hẹp bóng đổ về `0px` – `1px`.

---

## 2. Bảng Design Tokens Cho Nút (`tokens.css`)

Các biến CSS token được định nghĩa tại `src/styles/tokens.css` và dùng chung toàn dự án:

| Tên Token | Giá Trị CSS | Mục Đích Sử Dụng |
|---|---|---|
| `--btn-shadow` | `2px 2px 0px rgba(0, 0, 0, 0.25)` | Bóng đổ mặc định cho nút CTA chính (`primary`, `danger`) |
| `--btn-shadow-hover` | `3px 3px 0px rgba(0, 0, 0, 0.4)` | Bóng đổ khi rê chuột (Hover state) |
| `--btn-shadow-active` | `1px 1px 0px rgba(0, 0, 0, 0.2)` | Bóng đổ khi đang nhấn (Active/Pressed state) |
| `--btn-shadow-ink` | `2px 2px 0px var(--color-ink)` | Bóng đổ đen đặc cho các nút tương phản cao |
| `--btn-shadow-ink-hover` | `3px 3px 0px var(--color-ink)` | Bóng đổ đen khi hover |
| `--btn-shadow-subtle` | `1px 1px 0px rgba(0, 0, 0, 0.15)` | Bóng đổ mỏng cho nút phụ (`secondary`, `outline`, pagination) |
| `--btn-shadow-subtle-hover` | `2px 2px 0px rgba(0, 0, 0, 0.3)` | Bóng đổ khi hover cho nút phụ |
| `--btn-transition` | `background-color 0.15s ease, border-color 0.15s ease, color 0.15s ease, box-shadow 0.15s ease, transform 0.15s ease` | Chuyển động mượt mà đa thuộc tính cho mọi tương tác nút |

---

## 3. Component Chuẩn: `Button.jsx` (`src/components/Button/`)

Component React nguyên tử (Atomic Component) đóng gói toàn bộ hành vi chuẩn:

### (A) Props Hỗ Trợ:
- `variant`: `"primary"` (Đỏ cọc/CTA), `"secondary"` (Trắng viền đen), `"outline"` (Trong suốt viền đen), `"danger"` (Đỏ cảnh báo), `"ghost"` (Không viền, hover nền nhạt), `"text"` (Gạch chân).
- `size`: `"xs"` (30px), `"small"` (34px), `"medium"` (40px - mặc định), `"large"` (48px).
- `fullWidth`: `true` nếu nút chiếm trọn chiều ngang (`width: 100%`).
- `disabled`: Vô hiệu hóa nút, tự động triệt tiêu `box-shadow` và `transform`.

### (B) Ví Dụ Sử Dụng:
```jsx
import Button from "@/components/Button/Button.jsx";

// Nút chính kêu gọi hành động
<Button variant="primary" size="medium" onClick={handleBooking}>
  Đặt kho ngay
</Button>

// Nút phụ
<Button variant="secondary" size="small" onClick={handleClose}>
  Đóng lại
</Button>
```

---

## 4. Các Lớp Tiện Ích CSS Dùng Chung (DRY Classes Trong `utilities.css`)

Đối với các thẻ HTML `<button>` hoặc thẻ `<a>` dạng liên kết nhưng muốn có giao diện nút:
- Dùng bộ class: `.btn`, `.btn--primary`, `.btn--secondary`, `.btn--outline`, `.btn--danger`, `.btn--sm`, `.btn--xs`.
- Mọi class này kế thừa trực tiếp 100% từ `--btn-shadow`, `--btn-transition`, `transform: translate(-1px, -1px)` và `box-shadow: none !important` khi `:disabled`.

---

## 5. Danh Sách Màn Hình Đã Được Chuẩn Hóa Khớp 100% Với Trang Nội Bộ

| Màn Hình / Vị Trí | Tên Lớp Nút | Trạng Thái Trước | Sau Chuẩn Hóa |
|---|---|---|---|
| **Duyệt kho (`/browse`)** | `.browse-filter-btn`, `.browse-empty__btn` | Phẳng, chỉ đổi màu nền | Thêm `--btn-shadow`, hover trượt `-1px`, active nhấn thụt |
| **Thẻ ô kho (`UnitCard.jsx`)** | `<Button variant="primary" size="small">` | Phẳng | Tự động kế thừa bóng đổ và transition từ `Button.css` |
| **Chi tiết kho (`/units/:id`)** | `.pricing-submit-btn`, `.pricing-duration-btn` | Nền đen phẳng, không shadow | Nền đen/đỏ có bóng cơ học, hover vươn lên, active thụt nhẹ |
| **Phân trang (`Pagination.jsx`)** | `.pagination-btn`, `.pagination-btn--page.is-active` | Nền trắng phẳng | Có `--btn-shadow-subtle`, trang đang chọn có `--btn-shadow` nổi bật |
| **Đăng nhập (`/login`)** | `.login-submit` | Phẳng, không shadow | Nền đỏ CTA, bóng đổ cứng và hiệu ứng cơ học khi bấm |
| **Quên mật khẩu (`/forgot-password`)** | `.forgot-btn-primary`, `.forgot-btn-secondary` | Phẳng | Đồng nhất với hệ thống nút nội bộ |
| **Kho của tôi (`/rentals`)** | `.rental-btn`, `.rental-btn--primary`, `.rental-btn--secondary` | Không shadow | Đồng nhất hoàn toàn với chuẩn Swiss Neo-Brutalist |
| **Hồ sơ hợp đồng & Xem HĐ** | `<Button variant="primary">`, `<Button variant="secondary">` | Phẳng | Kế thừa từ `Button.css` |
