# STORAGEHUB FRONTEND ARCHITECTURE & CLIENT CONVENTIONS

> **Quy Chuẩn Thiết Kế & Lập Trình Frontend (React + Vite)** cho StorageHub.
> AI Agent **BẮT BUỘC** phải tuân theo các mẫu thiết kế và quy ước này khi thêm/sửa trang hoặc component.

---

## 1. Chuẩn Mực Gọi API & Xử Lý Dữ Liệu (`apiClient`)

### ❌ TUYỆT ĐỐI KHÔNG:
- Không dùng `fetch()` trực tiếp kèm gán thủ công `Authorization: Bearer ...`.
- Không dùng `axios` bên ngoài vì hệ thống đã chuẩn hóa qua `apiClient`.
- Không parse JSON bằng `response.json()` trực tiếp (dễ gặp lỗi crash `Unexpected end of JSON input` khi server trả về rỗng).

### ✅ MẪU GỌI API CHUẨN (Gold Standard Service Pattern):
Tất cả các lời gọi API phải đặt trong thư mục `frontend/src/services/`:

```javascript
import { apiClient, safeParseJson } from "./apiClient.js";

export async function fetchUnitDetail(unitId) {
  const response = await apiClient(`/api/v1/units/${unitId}`);
  const data = await safeParseJson(response);

  if (!response.ok) {
    throw new Error(data.message || `Lỗi khi tải thông tin kho (${response.status})`);
  }

  return data;
}

export async function submitBooking(payload) {
  const response = await apiClient("/api/v1/reservations", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  const data = await safeParseJson(response);

  if (!response.ok) {
    throw new Error(data.message || "Không thể khởi tạo đơn đặt kho.");
  }

  return data;
}
```

---

## 2. Quản Lý Phiên Đăng Nhập & Token

- **Khóa lưu trữ Token**: `storagehub_token`
- **Khóa lưu trữ Thông tin User**: `storagehub_user`
- **Thời gian hết hạn**: `storagehub_expires_at`
- **Xử lý mã lỗi 401**:
  - `apiClient` tự động xóa token và chuyển hướng về `/login` nếu phiên làm việc của người dùng hết hạn (ngoại trừ các trang public như `/`, `/browse`, `/units/:id`).

---

## 3. Cấu Trúc Thư Mục Frontend

```
frontend/src/
├── app/
│   └── router.jsx                # Định nghĩa toàn bộ Route hệ thống (Public, Customer, Staff, Manager, Admin)
├── components/
│   ├── AppShell/                 # Layout bọc chung (Header, Navigation, Footer)
│   ├── Facility3DViewer/         # Bộ trình diễn mô hình số 3D sa hình
│   └── ui/                       # Primitive components tái sử dụng
├── features/                     # Custom hooks và domain logic theo tính năng
│   ├── auth/
│   ├── catalog/
│   └── support/
├── pages/                        # Giao diện màn hình theo nhóm vai trò
│   ├── public/                   # LandingPage, BrowsePage, UnitDetailPage
│   ├── customer/                 # Portal khách thuê (Reservations, Payments, Tickets)
│   ├── staff/                    # Portal nhân viên hiện trường (Tasks, Rituals, Checkin)
│   ├── manager/                  # Portal quản lý cơ sở (Shifts, Roster, Unit Admin)
│   └── admin/                    # Portal quản trị cấp cao (Users, Policies, Financial Reports)
└── services/                     # Lớp giao tiếp API máy chủ (Single Source of Truth)
```

---

## 4. Design Tokens & Thẩm Mỹ Neo-Brutalist

Hệ thống tuân thủ triệt để ngôn ngữ thiết kế **StorageHub Neo-Brutalist**:
- **Bảng màu Token**:
  - `Ink Black`: `#000000` (Viền khung, chữ tiêu đề, biểu tượng)
  - `Accent Red`: `#dc2626` (Nút hành động chính Primary CTA, huy hiệu cảnh báo)
  - `Accent Yellow`: `#facc15` (Highlight cảnh báo, tag nổi bật, vạch an toàn)
  - `Brand Blue`: `#0284c7` (Thông tin trạng thái, vạch phân khu)
  - `Surface White`: `#ffffff` (Nền thẻ, nội dung card)
  - `Background Canvas`: `#f8fafc` hoặc `#f1f5f9` (Nền trang tổng thể)
- **Đặc trưng viền & bóng đổ (Signature Brutalist Borders & Shadows)**:
  - Khung viền cứng: `border: 2px solid #000000;` hoặc `3px solid #000000;`
  - Đổ bóng cứng hình học (Hard drop shadow, không làm mờ blur): `box-shadow: 4px 4px 0px #000000;`
  - Bo góc nhẹ hoặc vuông vức: `border-radius: 0px;` hoặc `border-radius: 4px;`
  - Nút bấm tương tác: Khi hover dịch chuyển `translate(-2px, -2px)` kèm shadow tăng lên `6px 6px 0px #000000;`.
