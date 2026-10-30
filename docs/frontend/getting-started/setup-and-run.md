# Cài Đặt & Khởi Chạy Local (Quickstart)

Tài liệu hướng dẫn thiết lập môi trường phát triển Frontend StorageHub cho thành viên mới trong vòng 2 phút.

---

## 1. Yêu Cầu Môi Trường

| Công cụ | Phiên bản yêu cầu | Kiểm tra |
|---|---|---|
| **Node.js** | `>= 20.x` (khuyên dùng Node 22 LTS) | `node -v` |
| **npm** | `>= 10.x` | `npm -v` |
| **Backend** | Spring Boot đang chạy ở cổng `8080` | `curl http://localhost:8080/actuator/health` |

---

## 2. Các Bước Cài Đặt & Chạy

Mở terminal tại thư mục gốc của dự án:

```bash
# 1. Di chuyển vào thư mục frontend
cd frontend

# 2. Cài đặt các thư viện phụ thuộc
npm install

# 3. Khởi chạy máy chủ phát triển
npm run dev
```

- Ứng dụng chạy tại: **`http://localhost:5173`**
- Mọi request API `/api/*` và file `/storage/*` được Vite tự động chuyển tiếp sang Backend `http://127.0.0.1:8080`.

---

## 3. Các Lệnh Thường Dùng (NPM Scripts)

```bash
npm run dev      # Khởi động dev server với Hot Module Replacement (HMR)
npm run build    # Đóng gói tối ưu cho production vào thư mục frontend/dist/
npm run lint     # Kiểm tra lỗi cú pháp và quy chuẩn mã nguồn ESLint
npm run preview  # Chạy thử bản build production trên máy local
```

---

## 4. Tài Khoản Seed Demo Để Đăng Nhập Nhanh

Bạn có thể dùng công cụ **1-click Login Panel** tại trang `/login` hoặc đăng nhập bằng tài khoản mẫu:

| Vai Trò | Email | Mật Khẩu | Trang Điều Hướng Mặc Định |
|---|---|---|---|
| **Customer** | `lan@demo.storagehub.vn` | `password` | `/browse` (Tìm kho) |
| **Staff** | `minh@demo.storagehub.vn` | `password` | `/tasks` (Kanban công việc) |
| **Facility Manager** | `tuan@demo.storagehub.vn` | `password` | `/facility` (Quản lý cơ sở) |
| **Business Ops** | `hang@demo.storagehub.vn` | `password` | `/overview` (Doanh thu & Báo cáo) |
| **System Admin** | `nam@demo.storagehub.vn` | `password` | `/users` (Quản trị người dùng) |
