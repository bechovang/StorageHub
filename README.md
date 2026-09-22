# StorageHub

Dự án môn học SWP391 — Nền tảng đặt thuê kho (self-storage): khách hàng tìm kho, đặt chỗ, check-in/check-out, thanh toán; chủ kho vận hành đơn vị, nhân sự, chính sách; hệ thống hỗ trợ giao việc, ticket hỗ trợ và thanh toán tự động.

## Thành viên & branch

| Thành viên | Vai trò | Branch cá nhân |
|---|---|---|
| An | Backend | `be/an` |
| Phúc | Backend | `be/phuc` |
| Nhật Huy | Backend | `be/huy` |
| Phú | Frontend | `fe/phu` |
| Tuấn Anh | Frontend | `fe/tuan_anh` |

## Cấu trúc repo

```
StorageHub/
├── backend/          # mã nguồn backend
├── frontend/         # mã nguồn frontend
└── docs/             # tài liệu dự án
    ├── prd/          # PRD (41 FR, 5 role)
    ├── architecture/ # kiến trúc hệ thống (architecture spine)
    ├── ux/           # thiết kế UX + mockups (HTML/PNG)
    ├── models/       # mô hình: conceptual V3, ERD (dbml), statecharts, business flows (drawio)
    └── sprint/       # Sprint Backlog (3 sprint × 2 tuần, 33 user stories)
```

## Quy trình làm việc với Git

1. Ch checkout branch cá nhân: `git checkout be/an` (theo bảng trên)
2. Cập nhật từ master trước khi code: `git pull origin master`
3. Code → `git add` → `git commit -m "mô tả ngắn"`
4. Push lên branch cá nhân: `git push origin <branch>`
5. Tạo **Pull Request** vào `master` trên GitHub, ít nhất 1 người review rồi mới merge

**Nguyên tắc:**
- ❌ Không push trực tiếp vào `master`
- ✅ Commit thường xuyên, message rõ nghĩa
- ✅ Trước khi tạo PR, pull `master` và xử lý conflict ở branch cá nhân

## Tech stack

- Backend: Java 21 + Spring Boot (contract-first OpenAPI) — chi tiết: `docs/architecture/ARCHITECTURE-SPINE.md`
- Frontend: React + Vite
- Database: MySQL 8.4
