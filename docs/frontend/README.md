# Tài Liệu Kỹ Thuật Phân Hệ Frontend — StorageHub

Chào mừng đến với trung tâm tài liệu kỹ thuật của phân hệ **Frontend (FE)** thuộc dự án **StorageHub (SWP391)**.  
Để giúp các thành viên trong các nhóm (**Backend, Frontend, QA/Tester, DevOps, BA**) nhanh chóng nắm bắt mà không bị "ngợp" thông tin, toàn bộ tài liệu đã được phân tách thành từng chuyên đề cô đọng, dễ đọc dưới đây:

---

## 🧭 Mục Lục Tài Liệu Theo Nhóm Chủ Đề

### 1. 🚀 Bắt Đầu Nhanh (Getting Started)
Dành cho người mới cần cài đặt và chạy thử hệ thống ngay:
- [**Cài đặt & Khởi chạy Local**](./getting-started/setup-and-run.md): Yêu cầu môi trường, các lệnh npm cơ bản và danh sách tài khoản seed demo để đăng nhập.
- [**Biến môi trường & Cấu hình Proxy**](./getting-started/environment-and-proxy.md): Cách thức Vite chuyển tiếp request `/api/*` sang Backend port `8080` (Zero-CORS).

---

### 2. 🏗️ Kiến Trúc Hệ Thống (Architecture)
Dành cho Tech Lead, Backend và Frontend Architect:
- [**Tổng quan Công nghệ & Cấu trúc Mã nguồn**](./architecture/overview-and-techstack.md): Tech stack (React 19, Vite 8, Recharts), cấu trúc cây thư mục `src/` và nguyên tắc thiết kế.
- [**Hệ Thống Design Tokens & Chuẩn Hóa Nút Bấm (Button System)**](./architecture/design-tokens-and-buttons.md): Đặc tả Design Tokens cho Button, chuẩn hiệu ứng shadow & micro-transitions, tuân thủ DRY code.
- [**Luồng Dữ Liệu & HTTP Client (`apiClient.js`)**](./architecture/data-flow-and-client.md): Sơ đồ vòng đời request/response, tự động gắn JWT token, thu hồi phiên 401 và cơ chế Hybrid Fallback.
- [**Quản lý Trạng thái Ứng dụng**](./architecture/state-and-caching.md): Phạm vi của `AuthContext`, `NotificationContext` và kỹ thuật Cập nhật lạc quan (Optimistic UI) cho Kanban và ca trực.
- [**Xử lý Lỗi & Bản địa hóa Tiếng Việt**](./architecture/error-handling-and-i18n.md): Chuẩn cấu trúc lỗi Envelope AD-8 và từ điển thông điệp lỗi tiếng Việt thân thiện.

---

### 3. 🔌 Danh Mục API Endpoints Chi Tiết (API Reference)
Mỗi tài liệu tương ứng một Domain nghiệp vụ riêng biệt, đầy đủ Method, URL, Request/Response JSON mẫu:
- [**Xác thực & Phiên làm việc (Auth & Session)**](./api-reference/auth-and-session.md): Đăng nhập, đăng ký, lấy hồ sơ cá nhân.
- [**Danh mục kho & Báo giá tự động (Units & Catalog)**](./api-reference/units-and-catalog.md): Bộ lọc, tìm kiếm kho và công cụ báo giá thuê.
- [**Đơn đặt chỗ, Hợp đồng & Check-in Pass**](./api-reference/reservations-and-rentals.md): Tạo đơn đặt chỗ, thanh toán cọc để giữ chỗ, mã QR nhận kho, tự gia hạn và yêu cầu trả kho.
- [**Thanh toán & Cổng thanh toán (Payments)**](./api-reference/payments-and-gateways.md): Cổng PayOS thật (VietQR), ví MoMo (OTP giả lập), thẻ ngân hàng (CARD demo).
- [**Bảng công việc & 4 Nghi thức (Staff Tasks & Rituals)**](./api-reference/staff-tasks-and-rituals.md): Kanban nhân viên, nghi thức check-in, checkout, vệ sinh và ràng buộc Snap-Back.
- [**Quản lý Cơ sở & Phân ca trực (Facility & Shifts)**](./api-reference/facility-and-shifts.md): Bảng điều khiển tỷ lệ lấp đầy kho và xếp lịch trực tuần tránh trùng giờ.
- [**Báo cáo Doanh thu & Chính sách giá (Business & Reports)**](./api-reference/business-reports-and-policy.md): Số liệu tài chính, dữ liệu biểu đồ Recharts và xuất file CSV.
- [**Quản trị Người dùng & Nhật ký (Users & Audit)**](./api-reference/users-and-activity-logs.md): Danh sách tài khoản, kích hoạt, khóa, cấp lại mật khẩu và Activity Logs.

---

### 4. 🛡️ Phân Quyền & Điều Hướng (Security & Routing)
- [**Ma trận Phân quyền (RBAC Matrix)**](./security-and-routing/rbac-matrix.md): Bảng phân quyền 5 vai trò (`CUSTOMER`, `STAFF`, `FACILITY_MANAGER`, `BUSINESS_OPS`, `SYSTEM_ADMIN`) và hoạt động của `ProtectedRoute.jsx`.
- [**Thanh Điều hướng Động & Giao diện Mobile**](./security-and-routing/navigation-and-header.md): Cơ chế Header tự động hiển thị menu đúng vai trò và Navigation Drawer cho di động.

---

### 5. 🚢 Đóng Gói & Triển Khai (Deployment)
Dành cho DevOps và quản trị máy chủ VPS:
- [**Quy trình Đóng gói Sản phẩm (Production Build)**](./deployment/production-build.md): Các bước tối ưu hóa của Rollup và cấu trúc thư mục `dist/`.
- [**Hướng dẫn Triển khai Nginx VPS & Chẩn đoán Lỗi**](./deployment/nginx-vps-guide.md): Cấu hình Nginx mẫu với `try_files` cho SPA routing và bảng xử lý sự cố thường gặp.
