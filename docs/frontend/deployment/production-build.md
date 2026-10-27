# Quy Trình Đóng Gói Sản Phẩm (Production Build)

Tài liệu hướng dẫn quy trình biên dịch và tối ưu hóa mã nguồn Frontend trước khi phát hành.

---

## 1. Lệnh Đóng Gói (Build Command)

```bash
cd frontend
npm run build
```

---

## 2. Các Bước Rollup Tối Ưu Tự Động

1. **Tree-shaking**: Loại bỏ toàn bộ các hàm và thư viện không được import hoặc không sử dụng thực tế.
2. **Minification & Mangling**: Thu nhỏ kích thước file JavaScript và CSS, rút gọn tên biến.
3. **Asset Hashing**: Đặt tên file theo mã băm nội dung (ví dụ: `index-Bf9xL2.js`), giúp trình duyệt người dùng tự động nhận bản mới khi deploy mà không bị dính cache cũ.

---

## 3. Cấu Trúc Thư Mục Kết Quả (`frontend/dist/`)

```text
frontend/dist/
├── index.html           # File HTML gốc duy nhất
└── assets/
    ├── index-xxx.js     # Toàn bộ mã nguồn JS ứng dụng
    └── index-xxx.css    # Toàn bộ CSS Design Tokens
```

Thư mục `dist/` này là gói tài nguyên tĩnh duy nhất cần tải lên máy chủ web (Nginx / S3 / Cloudflare Pages).
