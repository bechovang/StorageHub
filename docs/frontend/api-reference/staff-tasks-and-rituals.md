# API Reference: Bảng Công Việc & 4 Nghi Thức (Staff Tasks & Rituals)

Các API quản lý thẻ công việc Kanban của nhân viên và thực thi 4 nghi thức nghiệp vụ (Check-in, Checkout, Vệ sinh, Ký hợp đồng).

---

## 1. Lấy Danh Sách Nhiệm Vụ Nhân Viên

- **Method / URL**: `GET /api/v1/tasks`
- **Quyền hạn**: `STAFF`, `FACILITY_MANAGER`, `SYSTEM_ADMIN`
- **Hàm Service**: `src/services/taskService.js` ➔ `getStaffTasks()`
- **Response Thành Công (`200 OK`)**:
```json
{
  "items": [
    {
      "id": 40,
      "type": "CHECKOUT",
      "refCode": "BK-1050",
      "unitCode": "M-1",
      "assignedStaffName": "Trần Minh",
      "workDate": "2026-10-27",
      "status": "TODO",
      "ritualsCompleted": false
    }
  ],
  "total": 1
}
```

---

## 2. Hoàn Tất Nghi Thức & Cập Nhật Trạng Thái

- **Method / URL**: `PATCH /api/v1/tasks/{taskId}/status`
- **Quyền hạn**: `STAFF`, `FACILITY_MANAGER`, `SYSTEM_ADMIN`

### Request Body Theo Từng Nghi Thức:

#### (A) Nghi thức Check-in Nhận kho (`CHECKIN`):
```json
{
  "status": "DONE",
  "ritualType": "CHECKIN",
  "payload": {
    "contractPhotoUrl": "/storage/contracts/CT-2031-signed.jpg",
    "paymentMethod": "CARD",
    "accessPin": "482913"
  }
}
```

#### (B) Nghi thức Checkout & Tất toán (`CHECKOUT`):
```json
{
  "status": "DONE",
  "ritualType": "CHECKOUT",
  "payload": {
    "damageCharges": 50000,
    "damageReason": "Móp ổ khóa ngăn số 2",
    "refundAmount": 0,
    "extraCharged": 12000,
    "checklist": { "cleanFloor": true, "keyReturned": true }
  }
}
```

#### (C) Nghi thức Vệ sinh kho (`CLEANING`):
```json
{
  "status": "DONE",
  "ritualType": "CLEANING",
  "payload": { "sweptAndMopped": true, "deodorized": true, "lockTested": true }
}
```

- **Ràng buộc Snap-Back**: Nếu cố tình gửi `DONE` mà chưa upload ảnh hoặc bỏ sót checklist, API trả về `422 SNAP_BACK_VIOLATION` và thẻ tự dời về cột `IN_PROGRESS`.
