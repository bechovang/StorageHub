# Hệ Thống Design Tokens & Quy Chuẩn Giao Diện — StorageHub

Tài liệu này là đặc tả kỹ thuật duy nhất và toàn diện về **Design Tokens**, quy chuẩn thẩm mỹ **Swiss Grid & Neo-Brutalism**, và nguyên tắc **DRY (Don't Repeat Yourself)** áp dụng cho toàn bộ phân hệ Frontend của dự án StorageHub.

Toàn bộ các token được khai báo trực tiếp tại file mã nguồn: [`frontend/src/styles/tokens.css`](file:///D:/Workspace/StorageHub/frontend/src/styles/tokens.css).

---

## 1. Triết Lý Thiết Kế Cốt Lõi (Design Philosophy)

Giao diện StorageHub tuân thủ trường phái **Swiss Style (International Typographic Style)** kết hợp với **Neo-Brutalism hiện đại**:
1. **Góc cạnh vuông vức tuyệt đối**: `border-radius: 0px` (`--radius: 0px`), loại bỏ hoàn toàn các góc bo tròn mềm kiểu generic template.
2. **Đường viền sắc nét**: Sử dụng viền 1px nét dứt khoát (`--border`, `--border-strong`) phân tách từng khối nội dung độc lập.
3. **Độ sâu bóng đổ khối cứng (Hard Offset Shadow)**: Thay vì bóng mờ Gaussian blur truyền thống, hệ thống dùng bóng đổ dứt khoát (ví dụ `2px 2px 0px rgba(0,0,0,0.25)`), mang lại xúc giác cơ học chân thực như phím bấm phần cứng.
4. **Bảng màu đỏ đơn sắc (Swiss Red Monochromatic)**: Sử dụng sắc đỏ thương hiệu (`#dc2626`) làm điểm nhấn hành động, kết hợp sắc độ đậm nhạt cho trực quan hóa dữ liệu biểu đồ.
5. **Bảo toàn độ tương phản tuyệt đối**: Nghiêm cấm các lỗi tương phản như chữ đen trên nền tối khi hover hoặc khi active.

---

## 2. Hệ Thống Bảng Màu (Color Tokens)

### 2.1. Bảng Màu Nền Tảng (Core Palette)

| Tên Biến Token | Mã Màu Hex | Vai Trò & Mục Đích Sử Dụng |
|---|---|---|
| `--color-ink` | `#000000` | Màu mực đen thuần, viền cấp 1, tiêu đề chính, bóng tương phản cao |
| `--color-surface` | `#ffffff` | Màu nền thẻ, panel, modal, bề mặt tương tác |
| `--color-neutral` | `#f5f5f5` | Màu nền canvas tổng thể trang, nền chip phụ |
| `--color-neutral-dark` | `#171717` | Màu nền xám đen cho ô kho có sẵn, nhãn phụ tối |
| `--color-secondary` | `#555555` | Màu chữ phụ, mô tả phụ cấp 2 |
| `--color-muted` | `#767676` | Màu chữ chú thích mờ, placeholder, thời gian phụ |
| `--color-line` | `#d7d7d7` | Đường kẻ phân cách, viền thẻ mặc định |
| `--color-line-strong` | `#000000` | Đường kẻ nhấn mạnh, viền bảng điều khiển |
| `--color-disabled` | `#e8e8e8` | Bề mặt và viền phần tử bị vô hiệu hóa |
| `--color-accent` | `#dc2626` | Đỏ thương hiệu StorageHub, nút CTA cọc giữ chỗ, cảnh báo lỗi |
| `--color-accent-dark` | `#a71919` | Trạng thái hover của nút đỏ CTA |
| `--color-accent-subtle` | `#fef2f2` | Nền đỏ phớt mỏng cho thông báo lỗi nhẹ, badge cảnh báo |

### 2.2. Bí Danh Ngữ Nghĩa (Semantic Aliases)

Được ánh xạ để các component dùng chung mà không bị hardcode màu cụ thể:

```css
/* Màu chữ */
--color-text-primary: var(--color-ink);
--color-text-secondary: var(--color-secondary);
--color-text-muted: var(--color-muted);
--color-text-inverse: var(--color-surface);

/* Màu bề mặt */
--color-surface-page: var(--color-neutral);
--color-surface-panel: var(--color-surface);
--color-surface-strong: var(--color-ink);
--color-surface-disabled: var(--color-disabled);

/* Viền */
--color-border-default: var(--color-line);
--color-border-strong: var(--color-line-strong);
--color-divider: var(--color-line);
```

### 2.3. Trạng Thái Phản Hồi (Feedback & Status)

| Trạng Thái | Màu Chính | Màu Nền Tint | Màu Viền Border | Ứng Dụng |
|---|---|---|---|---|
| **Success** | `--color-status-success: #16a34a` | `#f0fdf4` | `#bbf7d0` | Thanh toán cọc thành công, hoàn thành nghi thức |
| **Warning** | `--color-status-warning: #d97706` | `#fffbeb` | `#fde68a` | Đơn chờ cọc (Pending), sắp hết hạn thuê |
| **Danger** | `--color-status-danger: #dc2626` | `#fef2f2` | `#fecaca` | Quá hạn, hủy đơn, lỗi xác thực |
| **Info** | `--color-status-info: #2563eb` | `#eff6ff` | `#bfdbfe` | Hướng dẫn check-in, chỉ dẫn hệ thống |

### 2.4. Trực Quan Hóa Dữ Liệu & Biểu Đồ (Swiss Monochromatic Red Scale)

Dành riêng cho biểu đồ Recharts tại màn hình Báo cáo Doanh thu & Quản lý Cơ sở:

```css
--chart-red-900: #450a0a; /* Tiền cọc (Deposit) */
--chart-red-800: #7f1d1d;
--chart-red-700: #991b1b;
--chart-red-600: #dc2626; /* Tiền thuê chính (Rent) */
--chart-red-500: #ef4444;
--chart-red-400: #f87171; /* Phụ phí phát sinh (Surcharge) */
--chart-red-300: #fca5a5;
--chart-red-100: #fee2e2;

/* Semantic Chart Aliases */
--color-chart-rent: var(--chart-red-600);
--color-chart-deposit: var(--chart-red-900);
--color-chart-surcharge: var(--chart-red-400);
--color-chart-target: var(--color-ink);
--color-chart-available: #171717;
--color-chart-retired: #737373;
```

---

## 3. Hệ Thống Typography & Cỡ Chữ

### 3.1. Họ Phông Chữ (Font Families)

- **Display**: `--font-display: "Inter Tight", "Arial Narrow", Arial, sans-serif` (dành cho tiêu đề lớn, banner quảng bá, số liệu KPI khổng lồ).
- **Body**: `--font-body: Inter, Arial, sans-serif` (dành cho văn bản thông thường, form nhập liệu, nhãn nút).
- **Mono**: `--font-mono: "SFMono-Regular", Consolas, "Liberation Mono", monospace` (dành cho mã đơn đặt chỗ, mã PIN nhận kho, mã QR, nhật ký kiểm toán).

### 3.2. Thang Cỡ Chữ (Font Size Scale)

- **Fluid Responsive**:
  - `--text-display`: `clamp(2.8rem, 6vw, 5.5rem)`
  - `--text-h1`: `clamp(2rem, 3vw, 3rem)`
  - `--text-h2`: `1.4rem`
  - `--text-body`: `0.95rem`
  - `--text-small`: `0.78rem`
- **Fixed T-shirt Sizes**:
  - `--font-size-xs`: `0.75rem` (12px)
  - `--font-size-sm`: `0.82rem` (13px)
  - `--font-size-md`: `0.95rem` (15px)
  - `--font-size-lg`: `1.25rem` (20px)
  - `--font-size-xl`: `1.5rem` (24px)
  - `--font-size-2xl`: `2rem` (32px)
  - `--font-size-3xl`: `3rem` (48px)

### 3.3. Độ Đậm (Font Weights) & Chiều Cao Dòng (Line Heights)

- Regular: `400` | Medium: `500` | Semibold: `600` | Bold: `700` | Black: `800`.
- `--line-height-tight`: `1.1` (tiêu đề, thẻ KPI).
- `--line-height-normal`: `1.55` (đoạn văn, văn bản hợp đồng).
- `--line-height-relaxed`: `1.7` (hướng dẫn chi tiết, điều khoản pháp lý).

---

## 4. Hệ Thống Khoảng Cách & Bố Cục (Spacing & Layout)

### 4.1. Thang Khoảng Cách (8-Point Grid Based)

| Token | Kích Thước | Ứng Dụng |
|---|---|---|
| `--space-0` | `0px` | Reset margin/padding |
| `--space-1` | `4px` | Khoảng cách vi mô (icon - label) |
| `--space-2` | `8px` | Padding trong chip, tag nhỏ |
| `--space-3` | `12px` | Khoảng cách giữa các form field nhỏ |
| `--space-4` | `16px` | Padding chuẩn của button, input, card con |
| `--space-5` | `24px` | Khoảng cách giữa các card, padding modal |
| `--space-6` | `32px` | Padding phần thân bảng điều khiển |
| `--space-7` / `--space-12` | `48px` | Khoảng cách giữa các section trang |
| `--space-8` / `--space-16` | `64px` | Margin trên cùng của trang |

### 4.2. Kích Thước Khung Bố Cục Toàn Cục

- `--header-height`: `64px` (Chiều cao thanh điều hướng cố định phía trên).
- `--sidebar-width`: `244px` (Độ rộng thanh điều hướng sườn trang quản trị).
- `--page-width`: `1200px` (Độ rộng nội dung tối đa màn hình lớn).
- `--page-min-width`: `320px` (Màn hình tối thiểu trên thiết bị di động).

---

## 5. Hệ Thống Nút Bấm & Phần Tử Điều Khiển (Buttons & Controls)

Toàn bộ nút bấm từ các trang công khai (Browse, Unit Detail, Login, Register) đến các trang nội bộ (Staff Kanban, Shifts, Reports, Policy) đều được quy về một bộ tokens đồng nhất theo nguyên tắc **DRY**.

### 5.1. Token Bóng Đổ & Chuyển Động (Button Shadow & Motion)

| Tên Token | Giá Trị CSS | Mục Đích Sử Dụng |
|---|---|---|
| `--btn-shadow` | `2px 2px 0px rgba(0, 0, 0, 0.25)` | Bóng đổ cơ bản cho nút CTA chính (`primary`, `danger`) |
| `--btn-shadow-hover` | `3px 3px 0px rgba(0, 0, 0, 0.4)` | Bóng mở rộng khi rê chuột (Hover) |
| `--btn-shadow-active` | `1px 1px 0px rgba(0, 0, 0, 0.2)` | Bóng thu hẹp khi click (Active) |
| `--btn-shadow-ink` | `2px 2px 0px var(--color-ink)` | Bóng đen đặc cho nút có độ tương phản cao |
| `--btn-shadow-ink-hover`| `3px 3px 0px var(--color-ink)` | Bóng đen đặc khi rê chuột |
| `--btn-shadow-subtle` | `1px 1px 0px rgba(0, 0, 0, 0.15)` | Bóng mỏng cho nút phụ (`secondary`, `outline`, pagination) |
| `--btn-shadow-subtle-hover` | `2px 2px 0px rgba(0, 0, 0, 0.3)` | Bóng khi hover cho nút phụ |
| `--btn-transition` | `background-color 0.15s ease, border-color 0.15s ease, color 0.15s ease, box-shadow 0.15s ease, transform 0.15s ease` | Chuyển động cơ học đa thuộc tính siêu mượt |

### 5.2. Nguyên Tắc Cơ Học Khi Tương Tác
- **Mặc định**: Nút nằm phẳng ở vị trí gốc kèm `box-shadow` tương ứng.
- **Hover**: Nút trượt nhẹ chếch lên trên sang trái `transform: translate(-1px, -1px)` và bóng đổ tăng độ sâu lên `3px`.
- **Active (Nhấn giữ chuột)**: Nút thụt xuống dưới sang phải `transform: translate(1px, 1px)` và bóng thu về `1px`, tạo cảm giác bấm phím cơ học.
- **Disabled**: Tuyệt đối triệt tiêu shadow và transform: `box-shadow: none !important; transform: none !important; opacity: 0.55; cursor: not-allowed`.

### 5.3. Sử Dụng Chuẩn (DRY Usage)

#### Cách 1: Sử Dụng Component Chuẩn `Button.jsx` (`src/components/Button/`)
```jsx
import Button from "@/components/Button/Button.jsx";

<Button variant="primary" size="medium" onClick={handleBooking}>
  Đặt kho & Thanh toán cọc
</Button>
```
- **Variants**: `"primary"`, `"secondary"`, `"outline"`, `"ghost"`, `"danger"`, `"text"`.
- **Sizes**: `"xs"`, `"small"`, `"medium"`, `"large"`.
- **Props**: `fullWidth={true|false}`, `disabled={true|false}`, `icon={<Icon />}`.

#### Cách 2: Sử Dụng Lớp Tiện Ích Toàn Cục `.btn` (`src/styles/utilities.css`)
Dành cho thẻ `<button>` độc lập hoặc thẻ liên kết `<a>` muốn tạo kiểu nút:
```html
<a href="/units/11" class="btn btn--primary">Xem chi tiết</a>
<button type="button" class="btn btn--secondary btn--sm">Đóng</button>
```

### 5.4. Kế Thừa Cho Thẻ Tương Tác (Interactive Cards & UnitCard)
Các thẻ ô kho tương tác (`UnitCard.jsx` / `UnitCard.css`) kế thừa trực tiếp cơ chế đổ bóng và chuyển động cơ học của Button:
- **Design Tokens ánh xạ**:
  - `--card-shadow: var(--btn-shadow);` (Mặc định `2px 2px 0px rgba(0, 0, 0, 0.25)`)
  - `--card-shadow-hover: var(--btn-shadow-hover);` (Mở rộng `3px 3px 0px rgba(0, 0, 0, 0.4)`)
  - `--card-shadow-active: var(--btn-shadow-active);` (Thu hẹp `1px 1px 0px rgba(0, 0, 0, 0.2)`)
  - `--card-transition: border-color var(--duration-fast) var(--ease-standard), box-shadow 0.15s ease, transform 0.15s ease;`
- **Hành vi tương tác cơ học**:
  - **Trạng thái bình thường**: Toàn bộ thẻ ô kho có bóng đổ khối cứng 2px.
  - **Trạng thái Hover**: Thẻ trượt nâng nhẹ chếch lên `transform: translate(-1px, -1px)`, bóng đổ mở rộng lên 3px và viền chuyển đỏ thương hiệu `--color-accent`.
  - **Trạng thái Active**: Khi click vào thẻ, thẻ thụt xuống `transform: translate(1px, 1px)` và bóng đổ co lại 1px, tạo cảm giác nhấn phím vật lý chân thực.

---

## 6. Chuyển Động (Motion) & Thứ Tự Xếp Lớp (Z-Index)

### 6.1. Thời Gian & Hiệu Ứng Chuyển Động (Motion)
- `--duration-fast`: `120ms` (hover nút, đổi màu icon).
- `--duration-normal`: `180ms` (mở dropdown, trượt tab).
- `--ease-standard`: `ease` (gia tốc tiêu chuẩn mượt mà).

### 6.2. Thứ Tự Xếp Lớp (Z-Index Hierarchy)
Tránh xung đột hiển thị đè nhau giữa các tầng giao diện:
- `--z-header`: `20` (Thanh điều hướng đầu trang).
- `--z-overlay`: `40` (Lớp màn mờ backdrop nền phía sau Drawer/Modal).
- `--z-modal`: `50` (Hộp thoại Popup Modal, Drawer kéo từ cạnh màn hình).
- `--z-toast`: `100` (Thông báo Toast nổi trên cùng).

---

## 7. Nguyên Tắc An Toàn Tương Phản (Contrast Protection Rules)

1. **Không xảy ra tình trạng "chữ đen trên nền đen"**:
   - Khi phần tử tương tác (như thẻ mốc thời gian, tab chọn tháng) ở trạng thái kích hoạt (`.is-active`, `--active`), màu chữ được cố định tuyệt đối trắng `#ffffff`.
   - Trạng thái hover phải được kiểm soát bằng bộ chọn an toàn `:hover:not(.is-active)` hoặc ép kiểu màu chữ đồng nhất khi hover.
2. **Quy tắc viền góc bo (Radius Lock)**:
   - Toàn bộ component và layout bắt buộc dùng `border-radius: var(--radius-none, 0px)`.
   - Tuyệt đối không dùng `border-radius: 4px / 8px / 9999px` (trừ hình tròn đặc thù như avatar người dùng hoặc mã QR góc tròn nếu thư viện yêu cầu).
3. **Quy tắc nhất quán bóng đổ**:
   - Mọi nút bấm hoặc thẻ tương tác nổi đều phải sử dụng biến token `--btn-shadow*` thay vì tự viết mã màu shadow tùy tiện.

---

## 8. Bảng Đối Chiếu Triển Khai Xuyên Suốt Hệ Thống

| Nhóm Màn Hình | File CSS Đại Diện | Tokens Áp Dụng | Kết Quả Đạt Được |
|---|---|---|---|
| **Duyệt kho (Customer)** | `BrowsePage.css`, `UnitCard.jsx` | `--card-shadow*`, `--btn-shadow*`, `--btn-transition`, `--radius` | Thẻ kho `UnitCard` có bóng khối cơ học và hiệu ứng trượt nâng hover/active như Button; bộ lọc và phân trang đồng bộ |
| **Chi tiết kho (Customer)** | `UnitDetailPage.css`, `UnitAvailabilityCalendar.css` | `--btn-shadow`, `--color-ink`, `--color-accent` | Chọn tháng, chọn thời hạn và nút cọc giữ chỗ phản hồi xúc giác tốt |
| **Xác thực (Auth)** | `LoginPage.css`, `ForgotPasswordPage.css` | `--btn-shadow-ink`, `--control-height-lg` | Form đăng nhập/quên mật khẩu cứng cáp, dứt khoát |
| **Kho của tôi (Customer)** | `MyRentalsPage.css` | `--btn-shadow-subtle`, `--color-status-*` | Nút Check-in Pass, Hợp đồng, Gia hạn đồng nhất các nút nội bộ |
| **Bảng công việc (Staff)** | `StaffTaskboardPage.css`, `TaskDetailsDrawer.css` | `--border-strong`, `--btn-shadow`, `--z-modal` | Bảng Kanban và 4 nghi thức thao tác chính xác, trực quan |
| **Cơ sở & Ca trực (Manager)** | `FacilityOverviewPage.css`, `ShiftSchedulingPage.css` | `--chart-red-*`, `--btn-shadow-ink`, `--space-*` | Biểu đồ đỏ đơn sắc, xếp lịch trực không trùng lặp |
| **Báo cáo & Chính sách (BO)** | `ReportsPage.css`, `PolicyManagementPage.css` | `--btn-shadow`, `--color-chart-*`, `--text-h1` | Báo cáo doanh thu chuẩn xác, bộ lọc thời gian không lỗi màu chữ |
| **Quản trị người dùng (Admin)**| `UserManagementPage.css` | `--btn-shadow`, `--color-status-*`, `--font-mono` | Quản lý tài khoản, mã nhân viên và nhật ký hệ thống rõ ràng |
