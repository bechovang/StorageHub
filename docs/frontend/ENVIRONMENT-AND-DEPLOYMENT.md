# Cấu Hình Môi Trường & Triển Khai (Environment & Deployment)

Tài liệu này hướng dẫn chi tiết cách cấu hình biến môi trường, cơ chế Reverse Proxy cục bộ, quy trình đóng gói sản phẩm (Production Build) và cách triển khai Frontend StorageHub lên máy chủ VPS hoặc Docker container.

---

## 1. Biến Môi Trường (Environment Variables)

Frontend sử dụng cơ chế biến môi trường tiêu chuẩn của Vite (bắt đầu bằng tiền tố `VITE_`):

| Tên Biến | Mặc Định Khi Không Khai Báo | Ý Nghĩa / Mục Đích |
|---|---|---|
| `VITE_BACKEND_URL` | `http://localhost:8080` | Địa chỉ máy chủ Backend Spring Boot mà Vite Dev Server chuyển tiếp (proxy) các request `/api` và `/storage` tới |
| `PORT` | `5173` | Cổng hoạt động của Vite Dev Server |

### File cấu hình mẫu (`frontend/.env`):
```env
# Địa chỉ máy chủ Backend (chạy local hoặc trỏ tới VPS dev)
VITE_BACKEND_URL=http://localhost:8080
```

---

## 2. Cơ Chế Reverse Proxy Cục Bộ (`frontend/vite.config.js`)

Khi phát triển trên máy local, trình duyệt mở trang web tại `http://localhost:5173`. Nếu trình duyệt gọi trực tiếp sang `http://localhost:8080`, trình duyệt sẽ chặn do chính sách bảo mật cùng nguồn gốc (Cross-Origin Resource Sharing - CORS).

Để giải quyết vấn đề này mà không cần cấu hình CORS phức tạp trên Backend, Vite được cấu hình làm **Reverse Proxy**:

```javascript
// frontend/vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import process from 'node:process'

export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    include: ['qrcode'],
  },
  server: {
    port: 5173,
    proxy: {
      // Mọi request bắt đầu bằng /api được chuyển tiếp tới Backend port 8080
      '/api': {
        target: process.env.VITE_BACKEND_URL || 'http://localhost:8080',
        changeOrigin: true,
        secure: false,
      },
      // Mọi request file tĩnh / ảnh hợp đồng được chuyển tiếp tới Backend
      '/storage': {
        target: process.env.VITE_BACKEND_URL || 'http://localhost:8080',
        changeOrigin: true,
        secure: false,
      },
    },
  },
})
```

### Lợi ích của cơ chế này:
1. **Zero-CORS**: Trình duyệt chỉ gửi request tới `origin` hiện tại (`http://localhost:5173/api/...`), Vite nhận request và đứng ra gọi Backend local `http://localhost:8080`.
2. **Khớp 100% với môi trường Production**: Khi lên VPS, Nginx cũng sẽ reverse proxy tương tự, giúp mã nguồn Frontend hoàn toàn không cần đổi code hay hardcode URL.

---

## 3. Quy Trình Đóng Gói Sản Phẩm (Production Build)

Khi chuẩn bị đưa lên môi trường thử nghiệm hoặc triển khai chính thức, chạy lệnh:

```bash
cd frontend
npm run build
```

### Kết quả đóng gói:
- Toàn bộ mã nguồn React, CSS và thư viện bên ngoài được Rollup phân tích, loại bỏ code thừa (Tree-shaking) và nén tối đa (Minification).
- Toàn bộ sản phẩm đầu ra nằm gọn trong thư mục `frontend/dist/`:
  - `index.html`: File HTML gốc duy nhất của SPA.
  - `assets/index-[hash].js`: File mã nguồn JavaScript gộp (đã được băm mã để tránh cache trình duyệt).
  - `assets/index-[hash].css`: File CSS tổng hợp chứa toàn bộ Design Tokens.

---

## 4. Hướng Dẫn Triển Khai Lên VPS (Nginx Web Server)

Trên máy chủ VPS chạy Linux (Ubuntu/Debian), ta sử dụng Nginx để vừa phục vụ các file tĩnh của Frontend, vừa đóng vai trò Reverse Proxy chuyển tiếp request API sang Spring Boot Backend đang chạy trên cổng `8080`.

### Cấu hình Nginx chuẩn (`/etc/nginx/sites-available/storagehub`):

```nginx
server {
    listen 80;
    server_name storagehub.vn demo.storagehub.vn;

    # Thư mục chứa mã nguồn Frontend đã build (dist)
    root /var/www/storagehub/frontend/dist;
    index index.html;

    # 1. Phục vụ tài nguyên tĩnh của Frontend & Hỗ trợ Client-side Routing (SPA)
    location / {
        try_files $uri $uri/ /index.html;
    }

    # 2. Reverse Proxy chuyển tiếp API tới Spring Boot Backend (Port 8080)
    location /api/ {
        proxy_pass http://127.0.0.1:8080;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_connect_timeout 60s;
        proxy_read_timeout 60s;
    }

    # 3. Phục vụ ảnh hợp đồng và tài liệu đã tải lên
    location /storage/ {
        proxy_pass http://127.0.0.1:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # 4. Tối ưu nén Gzip cho tài nguyên tĩnh
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml;
}
```

> **Điểm mấu chốt: `try_files $uri $uri/ /index.html;`**  
> Do StorageHub sử dụng React Router với cơ chế HTML5 History API, khi người dùng truy cập trực tiếp các đường dẫn con như `/rentals/30` hoặc F5 refresh trang, Nginx phải luôn trả về file `index.html` để React Router tự xử lý việc hiển thị component. Nếu thiếu dòng này, Nginx sẽ trả về lỗi `404 Not Found`.

---

## 5. Hướng Dẫn Chẩn Đoán Lỗi Thường Gặp (Troubleshooting)

| Hiện Tượng / Lỗi | Nguyên Nhân Khả Dĩ | Cách Xử Lý |
|---|---|---|
| **Lỗi `404 Not Found` khi F5 hoặc gõ URL trực tiếp** | Nginx chưa có cấu hình `try_files $uri $uri/ /index.html;` | Bổ sung directive `try_files` vào block `location /` trong cấu hình Nginx và restart Nginx. |
| **Lỗi `502 Bad Gateway` khi gọi API `/api/v1/...`** | Backend Spring Boot chưa khởi động hoặc bị dừng đột ngột | Kiểm tra tiến trình backend bằng lệnh: `systemctl status storagehub-backend` hoặc kiểm tra log tại `http://localhost:8080/actuator/health`. |
| **Lỗi `401 Unauthorized` lặp vô tận** | Token JWT hết hạn hoặc secret JWT giữa FE và BE không khớp | Đăng xuất tài khoản, xóa sạch localStorage bằng `tokenStorage.clear()`, sau đó đăng nhập lại. |
| **Lỗi `TypeError: Failed to fetch`** | Vite dev server không thể kết nối tới port 8080 do sai cấu hình `VITE_BACKEND_URL` | Kiểm tra file `frontend/.env`, đảm bảo Backend đang lắng nghe đúng cổng `8080`. |
| **Cảnh báo `Mixed Content` trên HTTPS** | Giao diện chạy trên `https://` nhưng proxy lại gọi Backend qua `http://` | Đảm bảo cấu hình proxy chuyển tiếp đúng giao thức hoặc kích hoạt SSL cert qua Let's Encrypt (Certbot). |
