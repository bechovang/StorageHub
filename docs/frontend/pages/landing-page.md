# StorageHub Landing Page (`/`)

## 1. Tổng quan & Mục tiêu

Trang **Landing Page** tại đường dẫn gốc `/` là điểm chạm đầu tiên (entry point) của khách vãng lai và khách hàng tiềm năng đến với nền tảng kho tự quản **StorageHub**.

Mục tiêu chính:
1. **Tối ưu hóa SEO toàn diện (Search Engine Optimization)**: Tăng thứ hạng tìm kiếm tự nhiên cho các từ khóa hàng đầu về kho tự quản ("cho thuê kho tự quản", "kho mini cá nhân", "lưu trữ hàng hóa TP.HCM", "kho tự quản thông minh") với ngữ nghĩa HTML5 chuẩn mực, thẻ meta và dữ liệu có cấu trúc JSON-LD (`SelfStorage`, `LocalBusiness`, `FAQPage`).
2. **Tối đa hóa tỷ lệ chuyển đổi (High-Converting UX)**: Cung cấp thông tin minh bạch, trực quan về 4 kích thước kho, bảng giá ước tính, 4 trụ cột an ninh/công nghệ, quy trình 3 bước số hóa và hệ thống câu hỏi thường gặp (FAQ).
3. **Tuân thủ triệt để Hệ thống Thiết kế Swiss Neo-Brutalist**: 0px border-radius, viền đen sắc nét (`var(--color-line-strong)`), đổ bóng đặc khối (`var(--btn-shadow)` & `var(--card-shadow)`), màu đỏ nhấn mạnh (`#dc2626`), typography tương phản cao.

---

## 2. Kiến trúc & Vị trí trong Hệ thống

- **Tuyến đường (Route)**: `/`
- **File thành phần**: [`LandingPage.jsx`](file:///D:/Workspace/StorageHub/frontend/src/pages/public/LandingPage.jsx)
- **File stylesheet**: [`LandingPage.css`](file:///D:/Workspace/StorageHub/frontend/src/pages/public/LandingPage.css)
- **App Shell**: Sử dụng [`AppShell`](file:///D:/Workspace/StorageHub/frontend/src/components/AppShell/AppShell.jsx) với `brandHref="/"` và `showFooter={true}`.
- **Header & Auth Integration**: Component [`Header`](file:///D:/Workspace/StorageHub/frontend/src/components/Header/Header.jsx):
  - Cụm logo & typography (`.brand`) trên Header mặc định luôn điều hướng về trang chủ (`/`) trên toàn hệ thống.
  - Tự động nhận diện trạng thái xác thực:
    - Nếu chưa đăng nhập: Hiển thị liên kết "Khám phá kho" cùng nút Đăng nhập / Đăng ký.
    - Nếu đã đăng nhập: Hiển thị avatar người dùng, chuông thông báo và danh mục liên kết theo vai trò.

---

## 3. Cấu trúc các Phần nội dung (Sections)

### 3.1. Hero Section (`.landing-hero`)
- **Status Badge**: `● Hệ thống kho tự quản thông minh hàng đầu TP.HCM · 40+ kho sẵn sàng` với chấm xanh nhấp nháy động (`.status-dot-pulse`).
- **H1 Headline**: `"Lưu Trữ Thông Minh. Tự Quản Tuyệt Đối. Bảo Mật 24/7."`
- **Mô tả hành động**: Nhấn mạnh quy trình đặt kho 3 phút, cọc 10%, mã PIN mở kho riêng 24/7 không cần qua lễ tân.
- **CTAs chính**:
  - Nút sơ cấp (Primary): `"Khám phá kho ngay"` ➔ Điều hướng tới `/browse`.
  - Nút thứ cấp (Secondary): `"Xem hướng dẫn chọn kích thước"` ➔ Cuộn mượt (smooth scroll) tới `#storage-sizes`.
- **Quick Stats Ribbon (4 thẻ chỉ số)**:
  - `40+` Kho đang sẵn sàng tại cơ sở Tân Bình.
  - `100%` Tự quản bằng mã PIN riêng biệt.
  - `10%` Đặt cọc online giữ chỗ tức thì.
  - `24/7` Ra vào tự do không hẹn trước 365 ngày/năm.

### 3.2. Hướng dẫn & Đo lường Kích thước Kho (`#storage-sizes`, `.landing-sizes`)
- **Tiêu đề nổi bật**: *"Chiếc <span style="color:#dc2626">túi xách</span> nhỏ hay cả <span style="color:#dc2626">căn nhà</span> đều được"* với từ khóa nổi bật bằng màu đỏ và kích thước phóng to.
- Lưới hiển thị trực diện toàn bộ 4 thẻ kích thước kho (không cần tab bộ lọc):
  1. **Locker (1.5 m²)**: ~100.000 đ/tháng. Sức chứa 8-12 thùng carton, vali du lịch, tài liệu hồ sơ cá nhân.
  2. **Small S (4 m²)**: ~345.000 đ/tháng. Chứa vừa đồ 1 phòng ngủ, 1-2 xe máy, 25-30 thùng đồ, nệm gấp.
  3. **Medium M (8 m²)**: ~380.000 đ/tháng. Badge *"PHỔ BIẾN NHẤT"*. Chứa đồ căn hộ 1-2 phòng ngủ, sofa, tủ lạnh, máy giặt, 50+ thùng carton.
  4. **Large L (16 m²)**: ~900.000 đ/tháng. Kho hàng doanh nghiệp TMĐT, máy móc, nguyên căn hộ 3 phòng ngủ.
- Mỗi thẻ tích hợp nút `"Tìm kho loại này"` dẫn trực tiếp tới `/browse`.

### 3.3. 4 Trụ Cột Giá Trị StorageHub (`.landing-pillars`)
- **Mã PIN cá nhân 100%** (`Key`): Tự mở kho bằng mã số điện tử riêng, không phụ thuộc nhân sự.
- **Cọc chỉ 10% & Minh bạch** (`Receipt`): Không phí ẩn, hoàn cọc tự động qua ngân hàng trong vòng 24h sau khi checkout.
- **An ninh & PCCC đa lớp** (`ShieldCheck`): Camera AI 24/7, đầu dò khói nhiệt PCCC, kiểm soát nhiệt ẩm chống nấm mốc.
- **Hợp đồng số & Bàn giao ảnh** (`FileText`): Chụp ảnh đối soát hiện trạng minh bạch qua Thẻ nhận kho (Check-in Pass).

### 3.4. Quy trình 3 Bước Thuê Kho Số Hóa (`.landing-steps`)
- Đồng bộ nền sáng thanh lịch (`var(--color-surface, #ffffff)`), thẻ bước chân phương viền đen bóng khối đen chuẩn Swiss Neo-Brutalist sẵn sàng cho các hiệu ứng chuyển cảnh mượt mà.
- **Bước 01**: Chọn kho trực tuyến trên sơ đồ 3D / danh mục.
- **Bước 02**: Đặt cọc 10% qua VietQR và kích hoạt mã PIN lập tức.
- **Bước 03**: Đến cơ sở, nhập PIN mở cửa và tự do quản lý 24/7.

### 3.5. Mạng lưới Cơ sở (`.landing-facilities`)
- **Cơ sở Tân Bình (Đang hoạt động)**:
  - Địa chỉ: 123 Hoàng Văn Thụ, Phường 2, Quận Tân Bình, TP.HCM.
  - Vị trí cách sân bay Tân Sơn Nhất 5 phút, đường xe tải 5 tấn, thang máy hàng 2 tấn, 40 kho sẵn sàng.
- **Cơ sở Quận 7 (Sắp khai trương - Q4/2026)**:
  - Địa chỉ: Khu đô thị Phú Mỹ Hưng, Quận 7, TP.HCM.
  - Tiêu chuẩn kho mát điều hòa & kiểm soát vi khí hậu độ ẩm cao cấp, quy mô 120+ khoang.

### 3.6. Hỏi Đáp Thường Gặp Accordion (`.landing-faq`)
- Giao diện Accordion tương tác mượt mà, hỗ trợ chuẩn Accessibility (`aria-expanded`, `aria-controls`, `role="region"`).
- Giải đáp 5 thắc mắc cốt lõi: thời gian thuê tối thiểu (từ 1 tháng), cơ chế hoàn cọc 10%, ra vào ban đêm/ngày lễ, bảo hiểm hàng hóa và thủ tục nâng/hạ kích thước kho.

### 3.7. Banner Kêu Gọi Hành Động Cuối Trang (`.landing-cta-banner`)
- Nền sáng trung tính (`var(--color-neutral, #f5f5f5)`), viền trên đen đậm, tiêu đề *"GIẢI PHÓNG KHÔNG GIAN NGAY HÔM NAY"*, nút kêu gọi cỡ lớn *"Khám phá tất cả 40 kho ngay"* dẫn đến `/browse`.

---

## 4. Tối ưu SEO & Dữ liệu có cấu trúc (Schema JSON-LD)

Khi người dùng truy cập trang `/`:
1. `document.title` được cập nhật:
   `"StorageHub · Hệ thống Cho thuê Kho tự quản Thông minh TP.HCM"`
2. Meta tag description được thiết lập chuẩn SEO:
   `"StorageHub - Hệ thống cho thuê kho tự quản thông minh hàng đầu TP.HCM. 40+ kho sạch sẽ, an ninh đa lớp 24/7, cọc 10% trực tuyến, mở kho tự do bằng mã PIN riêng."`
3. Thẻ script JSON-LD (`@id="storagehub-landing-schema"`) được tiêm vào thẻ `<head>` bao gồm:
   - Schema `@type: "SelfStorage"` định danh doanh nghiệp địa phương, địa chỉ Tân Bình, tọa độ địa lý, dải giá và giờ mở cửa 24/7.
   - Schema `@type: "FAQPage"` với toàn bộ câu hỏi và câu trả lời để hiển thị Rich Snippets trên kết quả tìm kiếm Google.

---

## 5. Kiểm thử & Đánh giá Giao diện

- **Build Check**: Chạy `npm run build` trong `frontend`, hoàn thành thành công 0 lỗi biên dịch.
- **Tương tác**: Kiểm thử click FAQ đóng/mở chuẩn xác, bộ lọc tab kích thước kho phản hồi tức thì, các nút CTA điều hướng chính xác về `/browse`.
- **Responsive Viewport**: Kiểm thử toàn diện trên Desktop (1440px) và Mobile (375px), bố cục lưới tự động co giãn không tràn ngang hay vỡ chữ.
- **Ảnh chụp kiểm thử**: Lưu trữ tại `verify_landing_page_full.png` và thư mục artifact.
