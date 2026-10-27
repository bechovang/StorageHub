# Xử Lý Lỗi & Bản Địa Hóa Thông Báo (Error Handling & i18n)

Tài liệu này quy định cách thức bắt lỗi từ Backend, chuẩn hóa mã lỗi và hiển thị thông báo tiếng Việt thân thiện với người dùng.

---

## 1. Chuẩn Cấu Trúc Lỗi (Envelope AD-8)

Toàn bộ lỗi từ Backend Spring Boot đều tuân thủ cấu trúc đồng nhất:

```json
{
  "code": "RESERVATION_CONFLICT",
  "message": "Kho đã có khách đặt trước trong khoảng thời gian này.",
  "fieldErrors": [
    {
      "field": "startDate",
      "message": "Ngày bắt đầu bị trùng với lịch hiện có."
    }
  ]
}
```

---

## 2. Bản Địa Hóa Thông Điệp Lỗi (`src/utils/statusLabels.js`)

Frontend sử dụng hàm `translateBackendMessage(code, fallbackMessage)` để dịch mã lỗi kỹ thuật sang câu tiếng Việt tự nhiên:

| Mã Lỗi Backend (`code`) | Câu Thông Báo Hiển Thị Trên UI |
|---|---|
| `AUTH_CREDENTIALS_INVALID` | Email hoặc mật khẩu không chính xác. |
| `AUTH_TOKEN_INVALID` | Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại. |
| `ACCESS_DENIED` | Bạn không có quyền thực hiện thao tác này. |
| `UNIT_ALREADY_RESERVED` | Đơn vị kho này vừa được khách hàng khác đặt chỗ. Vui lòng chọn kho khác. |
| `PAYMENT_EXPIRED` | Phiên thanh toán đã hết thời gian chờ (5 phút). |
| `SNAP_BACK_VIOLATION` | Chưa hoàn tất nghi thức bắt buộc (chụp ảnh hợp đồng hoặc kiểm tra vệ sinh). |
| `EXTENSION_COLLISION` | Không thể gia hạn vượt quá ngày bắt đầu của đơn thuê tiếp theo trên cùng kho. |
| `POLICY_RULE_CAP_EXCEEDED` | Mức phụ thu đã vượt quá trần quy định tối đa cho phép. |
| `BACKEND_UNAVAILABLE` | Không thể kết nối tới máy chủ Backend (Port 8080). Vui lòng kiểm tra lại dịch vụ. |

---

## 3. Hiển Thị Lỗi Trên Biểu Mẫu (Form Field Errors)

Khi API trả về mảng `fieldErrors`, các trường nhập liệu tương ứng trên Form sẽ:
- Đổi màu viền sang đỏ cảnh báo (`--sh-red-600`).
- Hiển thị dòng giải thích nhỏ ngay dưới ô nhập liệu tương ứng.
- Tự động xóa cảnh báo khi người dùng bắt đầu gõ lại vào ô đó.
