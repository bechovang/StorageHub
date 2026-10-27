# Hướng Dẫn Triển Khai Nginx VPS & Chẩn Đoán Lỗi

Tài liệu cấu hình máy chủ Nginx phục vụ Frontend và làm Reverse Proxy cho Backend Spring Boot trên VPS.

---

## 1. Cấu Hình Nginx Chuẩn (`/etc/nginx/sites-available/storagehub`)

```nginx
server {
    listen 80;
    server_name storagehub.vn demo.storagehub.vn;

    # Đường dẫn tới thư mục dist đã build
    root /var/www/storagehub/frontend/dist;
    index index.html;

    # 1. Phục vụ Frontend SPA & HTML5 History API
    location / {
        try_files $uri $uri/ /index.html;
    }

    # 2. Reverse Proxy chuyển tiếp request API sang Spring Boot (Port 8080)
    location /api/ {
        proxy_pass http://127.0.0.1:8080;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # 3. Phục vụ tài nguyên ảnh hợp đồng đã upload
    location /storage/ {
        proxy_pass http://127.0.0.1:8080;
        proxy_set_header Host $host;
    }
}
```

> **Lưu ý quan trọng**: Dòng `try_files $uri $uri/ /index.html;` là bắt buộc. Nếu thiếu, người dùng khi refresh (F5) tại các trang con như `/rentals/30` sẽ bị lỗi `404 Not Found`.

---

## 2. Bảng Chẩn Đoán & Xử Lý Sự Cố (Troubleshooting)

| Sự Cố / Lỗi | Nguyên Nhân | Cách Xử Lý |
|---|---|---|
| **Lỗi `404 Not Found` khi F5** | Nginx thiếu directive `try_files` | Bổ sung `try_files $uri $uri/ /index.html;` vào `location /` rồi `nginx -s reload`. |
| **Lỗi `502 Bad Gateway` khi gọi API** | Backend Spring Boot chưa chạy trên port 8080 | Kiểm tra backend: `systemctl status storagehub-backend`. |
| **Lỗi `401 Unauthorized` lặp vô tận** | Token JWT hết hạn hoặc lệch Secret | Gọi `tokenStorage.clear()` trên console trình duyệt hoặc bấm Đăng xuất rồi đăng nhập lại. |
| **Lỗi `Mixed Content`** | Frontend chạy HTTPS nhưng proxy gọi HTTP | Đảm bảo chuyển tiếp đúng schema hoặc cấp chứng chỉ SSL Let's Encrypt cho domain. |
