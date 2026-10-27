# Tài Liệu Kỹ Thuật Frontend — StorageHub

Chào mừng đến với tài liệu kỹ thuật của phân hệ **Frontend (FE)** thuộc dự án **StorageHub (SWP391)**.  
Tài liệu này được biên soạn dành cho toàn bộ đội ngũ phát triển (**Frontend, Backend, QA/Tester, DevOps, Business Analyst**) nhằm cung cấp cái nhìn toàn diện, chuẩn xác và chi tiết nhất về kiến trúc hệ thống, data flow (luồng dữ liệu), tích hợp API, ma trận phân quyền và quy trình triển khai.

---

## 1. Tổng Quan Kiến Trúc & Tech Stack

Frontend StorageHub là một ứng dụng **Single Page Application (SPA)** hiện đại, được xây dựng theo mô hình kiến trúc component hóa độc lập, tuân thủ nghiêm ngặt **Quyết định kiến trúc (AD-1 đến AD-11)** và các tiêu chuẩn UI/UX Anti-generic.

| Thành phần | Công nghệ / Thư viện | Phiên bản | Ghi chú & Trách nhiệm |
|---|---|---|---|
| **Core Framework** | React (Hooks, Context, Concurrent) | `^19.2.8` | Xây dựng giao diện phản ứng nhanh (reactive), tối ưu re-render |
| **Build Tool & Bundler** | Vite | `^8.3.0` | Hot Module Replacement (HMR) cực nhanh, Rollup production bundler |
| **Routing** | React Router DOM | `^7.18.4` | Khai báo route declarative, Dynamic parameters, Role Guards |
| **Data Visualization** | Recharts | `^3.10.1` | Biểu đồ doanh thu tài chính, sắc độ đơn sắc (Monochromatic Swiss Red) |
| **Icons & Typography** | Phosphor Icons React | `^2.1.10` | Bộ icon SVG đồng bộ, nhất quán kích thước và độ dày nét vẽ |
| **QR Engine** | qrcode | `^1.5.4` | Tạo mã QR truy cập kho (Access Pass) động trên Canvas/SVG |
| **Styling & Design Tokens** | Pure CSS + CSS Custom Properties | Native | Không dùng framework nặng; 100% token hóa màu sắc, khoảng cách, typography |
| **API Client** | Native Fetch API + Custom Interceptor | Native | Lớp `apiClient` tự động gắn JWT, xử lý 401, parse JSON an toàn |

---

## 2. Cấu Trúc Thư Mục Nguồn (`frontend/src/`)

Thư mục mã nguồn được tổ chức theo cấu trúc phân tầng rõ ràng theo chức năng và miền nghiệp vụ (domain-driven structure):

```text
frontend/src/
├── app/                        # Cấu hình cấp ứng dụng
│   ├── App.jsx                 # Root component bọc AuthProvider, NotificationProvider, Router
│   └── router.jsx              # Định nghĩa toàn bộ Route và Role Guards
├── components/                 # Atomic & Composite UI Components tái sử dụng
│   ├── AppShell/               # Khung sườn bố cục chuẩn (Header, Container, Footer)
│   ├── Badge/                  # Huy hiệu trạng thái đơn vị kho, đơn đặt chỗ, thanh toán
│   ├── Button/                 # Nút bấm chuẩn với các variant (primary, secondary, outline, ghost)
│   ├── Card/                   # Thẻ nội dung tiêu chuẩn với padding và viền token hóa
│   ├── DataTable/              # Bảng dữ liệu phân trang, lọc, sắp xếp, responsive
│   ├── Drawer/                 # Bảng trượt (Side Drawer) cho thao tác chi tiết, check-in, di động
│   ├── Footer/                 # Chân trang hệ thống
│   ├── FormControls/           # Ô nhập liệu, dropdown select, slider, checkbox, error message
│   ├── Header/                 # Thanh điều hướng linh hoạt theo từng Role, Notification bell, User avatar
│   ├── LoginPanel/             # Panel hỗ trợ đăng nhập nhanh 1-click cho các tài khoản seed demo
│   ├── Modal/                  # Hộp thoại xác nhận, popup thanh toán, cảnh báo
│   ├── ProtectedRoute/         # Guard chặn truy cập trái phép theo vai trò và điều hướng 403
│   └── UnitCard/               # Card hiển thị thông tin kho trong Catalog Browse
├── context/                    # React Contexts chia sẻ trạng thái toàn cục
│   ├── AuthContext.jsx         # Quản lý phiên đăng nhập, JWT, User profile, Role permissions
│   └── NotificationContext.jsx # Quản lý thông báo thời gian thực, bộ đếm unread count
├── features/                   # Các module nghiệp vụ phức hợp (complex domain features)
│   ├── checkin/                # Quy trình kiểm tra nhận kho, ký biên bản, cấp mã pin
│   ├── checkout/               # Quy trình gửi yêu cầu trả kho, kiểm tra thiệt hại, tất toán
│   ├── extension/              # Quy trình gia hạn đơn thuê kho, kiểm tra va chạm lịch
│   └── payment/                # Quy trình thanh toán (CARD, MOMO, VNPAY, PAYOS thật)
├── pages/                      # Các trang màn hình theo 5 vai trò người dùng
│   ├── admin/                  # System Admin: Quản lý người dùng, phân quyền, log đăng nhập
│   ├── auth/                   # Public Auth: Đăng nhập, Đăng ký, Quên mật khẩu, Trang 403
│   ├── business/               # Business Ops: Tổng quan kinh doanh, Báo cáo tài chính, Quản lý chính sách giá
│   ├── common/                 # Dùng chung: Nhật ký hoạt động (Activity Log), Trung tâm trợ giúp (Support)
│   ├── customer/               # Customer: Tìm kho (Browse), Chi tiết kho, Đơn thuê của tôi, Chi tiết đơn, Check-in Pass
│   ├── facility/               # Facility Manager: Tổng quan cơ sở, Quản lý trạng thái kho, Phân ca trực nhân viên
│   └── staff/                  # Staff: Bảng công việc Kanban (Task Board) & 4 nghi thức tác nghiệp
├── services/                   # Lớp giao tiếp API và Mock Fallback
│   ├── apiClient.js            # HTTP Client trung tâm: token interceptor, auto-logout, safeParseJson
│   ├── activityService.js      # API Nhật ký hoạt động kiểm toán
│   ├── facilityService.js      # API Giám sát cơ sở và drilldown kho
│   ├── notificationService.js  # API Thông báo & đánh dấu đã đọc
│   ├── paymentService.js       # API Khởi tạo, kiểm tra trạng thái và xác nhận thanh toán
│   ├── policyService.js        # API / Engine thẩm định và lưu chính sách giá
│   ├── rentalService.js        # API Đơn đặt chỗ, hợp đồng, phụ lục, check-in pass, checkout request
│   ├── reportService.js        # API Báo cáo tài chính, doanh thu theo tháng, xuất file CSV
│   ├── shiftService.js         # API Quản lý và kiểm tra xung đột ca trực nhân viên
│   ├── taskService.js          # API Bảng công việc nhân viên & 4 nghi thức tác nghiệp (Rituals)
│   ├── ticketService.js        # API Hỗ trợ khách hàng và điều phối sự cố
│   ├── unitService.js          # API Tìm kiếm kho, báo giá thuê, kiểm tra guard bảo trì / thu hồi kho
│   └── userService.js          # API Danh sách người dùng, kích hoạt, khóa, đổi vai trò, cấp lại mật khẩu
├── styles/                     # Hệ thống CSS Design Tokens
│   ├── global.css              # Quy tắc hiển thị toàn cục, font chữ, scrollbar
│   ├── reset.css               # Reset style trình duyệt
│   ├── tokens.css              # Design Tokens: màu sắc Swiss Red, kích thước, spacing, elevation
│   └── utilities.css           # Utility classes hỗ trợ layout nhanh (flex, grid, gap, text)
├── utils/                      # Hàm tiện ích dùng chung
│   ├── formatters.js           # Định dạng tiền tệ VND, ngày tháng ICT, diện tích m²
│   ├── rentalConstants.js      # Hằng số cấu hình thời gian thuê, chính sách mặc định
│   └── statusLabels.js         # Ánh xạ mã trạng thái ENUM sang tiếng Việt và màu sắc badge
└── validation/                 # Schema kiểm tra tính hợp lệ dữ liệu biểu mẫu
    ├── authValidation.js       # Validate email, số điện thoại, mật khẩu
    ├── index.js                # Xuất các hàm validator
    └── paymentValidation.js    # Validate thẻ tín dụng, số điện thoại ví điện tử, mã OTP
```

---

## 3. Hướng Dẫn Cài Đặt & Khởi Chạy Local

### 3.1. Yêu Cầu Môi Trường
- **Node.js**: Phiên bản 20.x trở lên (khuyên dùng Node 22 LTS).
- **npm**: Phiên bản 10.x trở lên.
- **Backend StorageHub**: Đang chạy ở `http://localhost:8080` (xem [Hướng dẫn chạy Backend](../backend/BACKEND-GETTING-STARTED.md)).

### 3.2. Cài Đặt Thư Viện
Mở terminal tại thư mục gốc của repository:
```bash
cd frontend
npm install
```

### 3.3. Khởi Chạy Môi Trường Phát Triển (Dev Server)
```bash
npm run dev
```
- Máy chủ phát triển Vite sẽ khởi động tại: `http://localhost:5173`.
- Mọi request có tiền tố `/api` và `/storage` được Vite tự động chuyển tiếp (proxy) sang Backend tại `http://localhost:8080` mà không gặp lỗi CORS.

### 3.4. Kiểm Tra Mã Nguồn & Build Production
```bash
# Kiểm tra lỗi linting
npm run lint

# Biên dịch mã nguồn cho môi trường production
npm run build

# Chạy thử bản build production trên máy local
npm run preview
```
Bản build tối ưu sẽ được xuất ra thư mục `frontend/dist/`.

---

## 4. Nguyên Tắc Thiết Kế Giao Diện (Design System & Standards)

Giao diện StorageHub tuân thủ tiêu chuẩn chất lượng cao, loại bỏ hoàn toàn các lỗi thiết kế phổ biến:

1. **Bảng màu Swiss Red Monochromatic**:
   - Sử dụng màu chủ đạo là sắc đỏ thương hiệu (`--sh-red-600: #d32f2f`), mở rộng theo thang độ sáng/tối đồng nhất (`--sh-red-50` đến `--sh-red-900`).
   - Loại bỏ các màu sắc rời rạc, không dùng cột màu đen đơn độc trên các biểu đồ tài chính; toàn bộ biểu đồ và thẻ trạng thái đều dùng các sắc độ hài hòa của cùng một dải màu.
2. **Header Động Tinh Chỉnh Theo Vai Trò**:
   - Khắc phục triệt để lỗi header hiển thị thừa hoặc trùng lặp liên kết. Mỗi vai trò (Customer, Staff, Facility Manager, Business Ops, System Admin) sở hữu danh sách điều hướng chuẩn xác, phản ánh đúng quyền hạn nghiệp vụ.
3. **Phản Hồi & Thao Tác Chống Lỗi (Guards & Rituals)**:
   - Các hành động nhạy cảm (bảo trì kho có đơn đang thuê, xóa đơn, ký hợp đồng không có ảnh đính kèm, vượt trần phụ thu chính sách) đều có bảo vệ (Guard) cấp giao diện, hiển thị thông báo lỗi rõ ràng bằng tiếng Việt.
4. **Hỗ Trợ Đầy Đủ Thiết Bị Di Động**:
   - Drawer điều hướng trên mobile tích hợp nút đóng rõ ràng, hỗ trợ backdrop click và hiển thị đầy đủ thông tin người dùng đang đăng nhập.

---

## 5. Mục Lục Tài Liệu Chi Tiết

Để tìm hiểu sâu từng phần kỹ thuật, vui lòng đọc các tài liệu chuyên đề sau:

1. [**Kiến Trúc Luồng Dữ Liệu & Giao Tiếp Mạng (Data Flow & Communication)**](./DATA-FLOW-AND-COMMUNICATION.md)
   *Chi tiết vòng đời Request/Response, Interceptor, Token Storage, Safe JSON Parser, cơ chế Hybrid Mock Fallback và quản lý State.*
2. [**Đặc Tả Toàn Bộ API Endpoints Tích Hợp (API Endpoints Specification)**](./API-ENDPOINTS-SPECIFICATION.md)
   *Danh mục hơn 30 endpoints phân theo domain, cấu trúc headers, query params, request body, response JSON và mã lỗi chuẩn.*
3. [**Định Tuyến & Ma Trận Phân Quyền (Routing & Authorization)**](./ROUTING-AND-AUTHORIZATION.md)
   *Cây định tuyến React Router 7, ma trận phân quyền 5 vai trò (RBAC), ProtectedRoute và Header động.*
4. [**Ánh Xạ Luồng Nghiệp Vụ Swimlane (Swimlane User Journeys)**](./SWIMLANE-USER-JOURNEYS.md)
   *Đối chiếu chi tiết giữa 7 tài liệu luồng tương tác của hệ thống (`docs/models/flows/`) và các màn hình Frontend.*
5. [**Cấu Hình Môi Trường & Triển Khai (Environment & Deployment)**](./ENVIRONMENT-AND-DEPLOYMENT.md)
   *Cấu hình biến môi trường, Reverse Proxy (Vite & Nginx), triển khai VPS/Docker và khắc phục sự cố kết nối.*
