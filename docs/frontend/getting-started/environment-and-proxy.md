# Biến Môi Trường & Cấu Hình Reverse Proxy

Tài liệu này giải thích cách Frontend giao tiếp với Backend mà không bị lỗi CORS trong môi trường phát triển local.

---

## 1. Biến Môi Trường (`frontend/.env`)

Frontend đọc biến môi trường qua chuẩn `import.meta.env` của Vite:

| Biến | Giá trị mặc định | Giải thích |
|---|---|---|
| `VITE_BACKEND_URL` | `http://127.0.0.1:8080` | URL máy chủ Backend Spring Boot (dùng IPv4 để tránh lỗi phân giải `::1` IPv6 trên Windows) |

Nếu Backend chạy ở địa chỉ khác (ví dụ VPS dev), tạo file `frontend/.env`:
```env
VITE_BACKEND_URL=http://127.0.0.1:8080
```

---

## 2. Cơ Chế Reverse Proxy Cục Bộ (`vite.config.js`)

Khi duyệt web tại `http://localhost:5173`, nếu trình duyệt gửi AJAX trực tiếp tới `http://localhost:8080`, trình duyệt sẽ chặn do vi phạm chính sách cùng nguồn gốc (CORS).

Vite giải quyết việc này bằng cách đứng ra làm **Reverse Proxy**:

```javascript
// frontend/vite.config.js
export default defineConfig({
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: process.env.VITE_BACKEND_URL || 'http://127.0.0.1:8080',
        changeOrigin: true,
        secure: false,
      },
      '/storage': {
        target: process.env.VITE_BACKEND_URL || 'http://127.0.0.1:8080',
        changeOrigin: true,
        secure: false,
      },
    },
  },
})
```

---

## 3. Cách Request Hoạt Động

```text
Trình duyệt (Port 5173) 
  ──> Gửi request: GET /api/v1/units
  ──> Vite Dev Server (Port 5173) nhận request
  ──> Vite âm thầm chuyển tiếp tới: http://127.0.0.1:8080/api/v1/units
  ──> Spring Boot xử lý và trả kết quả về cho Vite
  ──> Vite trả kết quả về cho Trình duyệt
```

**Ưu điểm:**
- Frontend hoàn toàn không cần cấu hình CORS trên Backend.
- Mã nguồn gọi URL dạng tương đối (`/api/v1/...`), hoạt động giống hệt khi lên Production Nginx.
