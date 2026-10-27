# API Reference: Quản Lý Cơ Sở & Phân Ca Trực (Facility & Shifts)

Các API dành cho Quản lý cơ sở (Facility Manager) để theo dõi trạng thái kho bãi và lập lịch ca trực cho nhân viên.

---

## 1. Bảng Giám Sát Cơ Sở (Facility Overview)

- **Method / URL**: `GET /api/v1/facility/overview`
- **Quyền hạn**: `FACILITY_MANAGER`, `SYSTEM_ADMIN`
- **Hàm Service**: `src/services/facilityService.js` ➔ `getFacilityOverview()`
- **Response Thành Công (`200 OK`)**:
```json
{
  "facilityId": 1,
  "facilityName": "Tân Bình Depot",
  "totalUnits": 20,
  "occupancyRate": 75.0,
  "counts": {
    "AVAILABLE": 5,
    "RENTED": 12,
    "RESERVED": 2,
    "MAINTENANCE": 1,
    "RETIRED": 0
  }
}
```

---

## 2. Lấy Danh Sách Ca Trực Trong Tuần

- **Method / URL**: `GET /api/v1/shifts`
- **Quyền hạn**: `FACILITY_MANAGER`, `SYSTEM_ADMIN`
- **Query Params**: `start-date` (YYYY-MM-DD), `end-date` (YYYY-MM-DD), `staff-id`
- **Hàm Service**: `src/services/shiftService.js` ➔ `getShifts(params)`
- **Response Thành Công (`200 OK`)**:
```json
{
  "items": [
    {
      "assignmentId": 101,
      "staffId": 2,
      "staffName": "Trần Minh",
      "workDate": "2026-10-27",
      "shiftWindow": "MORNING",
      "zoneCode": "A"
    }
  ]
}
```

---

## 3. Phân Công Ca Trực Mới

- **Method / URL**: `POST /api/v1/shifts`
- **Quyền hạn**: `FACILITY_MANAGER`, `SYSTEM_ADMIN`
- **Hàm Service**: `src/services/shiftService.js` ➔ `createShiftAssignment(body)`
- **Request Body**:
```json
{
  "staffId": 2,
  "workDate": "2026-10-28",
  "shiftWindow": "MORNING",
  "zoneCode": "A"
}
```
- **Response Thành Công (`201 Created`)**:
```json
{
  "assignmentId": 105,
  "staffId": 2,
  "workDate": "2026-10-28",
  "shiftWindow": "MORNING",
  "zoneCode": "A"
}
```
- **Lỗi xung đột lịch**: `409 SHIFT_CONFLICT` (Nhân viên đã có lịch trực ca này tại khu vực khác).
