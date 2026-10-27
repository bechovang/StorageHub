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
- **Mô hình Hiển thị (Rendering Mode)**: 100% **CSR (Client-Side Rendering)** trên kiến trúc Single Page Application (Vite + React 19 + React Router). Không phụ thuộc server-side hydration hay Node.js SSR runtime; toàn bộ trạng thái, tương tác và thẻ SEO / JSON-LD schema được quản lý phía client qua React lifecycle.
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
- **Bố cục 2 Cột Đối Xứng (2-Column Grid)**:
  - **Cột Trái**: Tiêu đề H1 Kinetic Text Reveal (*"Lưu Trữ Thông Minh · Tự Quản Tuyệt Đối · Bảo Mật 24/7"*), đoạn mô tả định vị dịch vụ và 2 nút CTA chính.
  - **Cột Phải**: Sa bàn Vector mô phỏng Giao thông Logistics thời gian thực ([`LogisticsTrafficMap.jsx`](file:///D:/Workspace/StorageHub/frontend/src/pages/public/components/LogisticsTrafficMap.jsx)):
    - **Trục đường huyết mạch thực tế TP.HCM**: Trục 1 (Sân bay Tân Sơn Nhất ➔ Đ. Hoàng Văn Thụ ➔ Đ. Nam Kỳ Khởi Nghĩa ➔ Đ. Nguyễn Văn Linh kết nối 2 cơ sở), Trục 2 (Cộng Hòa - Võ Văn Kiệt), Trục 3 (Mai Chí Thọ - Cầu Thủ Thiêm).
    - **Node xe cộ hoạt họa**: Các đốm tròn mang màu đỏ nhấn (`var(--color-accent)`) và đen (`var(--color-ink)`) di chuyển liên tục dọc theo các tuyến đường với vệt sáng mờ phía sau.
    - **Trạm Depot & Sân bay**: Đánh dấu trực quan Sân bay Tân Sơn Nhất, Cơ sở Tân Bình (DEPOT-01 đang hoạt động với vòng xung nhịp radar đỏ) và Cơ sở Quận 7 (DEPOT-02 sắp mở).
    - **HUD Telemetry Bar**: Hiển thị trạng thái tọa độ GPS `10°49'N 106°39'E`, thời gian lưu thông xe tải ~18 phút và trạng thái lưu thông 24/7.
- **Quick Stats Ribbon (4 thẻ chỉ số)**: Căn giữa trải dài toàn bộ chiều rộng ngay bên dưới 2 cột, tích hợp bộ đếm số tự động `CounterNumber`.

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
- **Ảnh chụp kiểm thử**: Lưu trữ tại `verify_landing_page_full.png`, `verify_landing_motion.png` và thư mục artifact.

---

## 6. Bộ Hiệu Ứng Chuyển Cảnh & Tương Tác Động (Motion Suite)

Toàn bộ hệ thống chuyển động trên Landing Page được tích hợp bằng thư viện `motion/react` chính thức cho React 19, tuân thủ nguyên tắc **Soft Easing** (`[0.22, 1, 0.36, 1]`) và cơ chế **Native Scroll**:

1. **Hero Section (`.landing-hero`)**:
   - **Kinetic Text Reveal**: Tiêu đề H1 trượt xuất hiện so le (`staggerChildren: 0.1s`, `y: [24, 0]`, `opacity: [0, 1]`).
   - **CounterNumber**: Chỉ số ribbon tự động nhảy số mượt mà từ 0 đến giá trị đích khi cuộn vào viewport (`0` ➔ `40+`, `0%` ➔ `100%`, `0%` ➔ `10%`, `24/7` scale-fade).
   - **CTA Hover & Tap**: Hiệu ứng nhấc nhẹ khi rê chuột (`whileHover={{ y: -2 }}`) và thu nhỏ nhẹ khi nhấn (`whileTap={{ scale: 0.98 }}`).
2. **Kích Thước Kho (`#storage-sizes`)**:
   - Tiêu đề và lưới 4 thẻ kích thước trượt xuất hiện so le khi cuộn tới (`staggerChildren: 0.08s`, `y: [28, 0]`, `opacity: [0, 1]`).
   - Thẻ kho nhấc cao nhẹ và tăng bóng đổ tương tác (`whileHover={{ y: -4, boxShadow: "5px 5px 0px var(--color-ink)" }}`).
3. **4 Trụ Cột Giá Trị (`.landing-pillars`)**:
   - Các thẻ trụ cột xuất hiện so le khi cuộn tới.
   - Micro-interaction: Biểu tượng icon tự động xoay nhẹ và nảy lên khi rê chuột vào thẻ (`whileHover={{ rotate: [0, -8, 8, 0], scale: 1.05 }}`).
4. **Quy Trình 3 Bước (`.landing-steps`)**:
   - Xuất hiện tuần tự 1 ➔ 2 ➔ 3 với `staggerChildren: 0.15s`.
   - Bổ sung đường dẫn tiến độ kết nối giữa các bước (`.steps-connector`) tự động vẽ dải màu đỏ (`scaleX: [0, 1]`) khi người dùng cuộn tới.
5. **Mạng Lưới Cơ Sở (`.landing-facilities`)**:
   - Thẻ cơ sở xuất hiện phóng đại nhẹ (`scale: [0.97, 1]`, `opacity: [0, 1]`).
   - Đốm trạng thái xanh tại cơ sở Tân Bình nhấp nháy êm dịu (`.status-dot-pulse-mini`).
6. **Hỏi Đáp Thường Gặp Accordion (`.landing-faq`)**:
   - Bọc nội dung trả lời trong `<AnimatePresence initial={false}>` và `<motion.div>` tính toán chiều cao tự động mượt mà (`height: 0` ➔ `height: "auto"`), không bị ngắt quãng khung hình.
   - Mũi tên Caret xoay mượt 180 độ theo trạng thái mở/đóng (`rotate: isOpen ? 180 : 0`).
7. **Banner Kêu Gọi Cuối Trang (`.landing-cta-banner`)**:
   - Khối banner xuất hiện khi cuộn tới đáy trang.
   - Nút hành động chính có hiệu ứng nâng nhẹ khi rê chuột (`whileHover={{ scale: 1.02 }}`).

