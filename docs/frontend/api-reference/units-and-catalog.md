# API Reference: Danh Mục Kho & Báo Giá (Units & Catalog)

Các API phục vụ tìm kiếm kho, xem thông số kỹ thuật và tính toán báo giá thuê.

---

## 1. Lấy Tùy Chọn Bộ Lọc Kho

- **Method / URL**: `GET /api/v1/units/filter-options`
- **Quyền hạn**: Công khai (Public)
- **Hàm Service**: `src/services/unitService.js` ➔ `getUnitFilterOptions()`
- **Response Thành Công (`200 OK`)**:
```json
{
  "facilities": [
    { "id": 1, "name": "Tân Bình Depot", "address": "123 Hoàng Văn Thụ, Tân Bình" }
  ],
  "types": [
    { "id": 1, "name": "Locker", "sizeM2": 1.5, "baseMonthlyRent": 100000 },
    { "id": 2, "name": "Small (S)", "sizeM2": 4.0, "baseMonthlyRent": 345000 },
    { "id": 3, "name": "Medium (M)", "sizeM2": 8.0, "baseMonthlyRent": 380000 },
    { "id": 4, "name": "Large (L)", "sizeM2": 16.0, "baseMonthlyRent": 900000 }
  ],
  "statuses": ["AVAILABLE", "RESERVED", "RENTED", "MAINTENANCE", "RETIRED"]
}
```

---

## 2. Tìm Kiếm Danh Sách Kho (Catalog Search)

- **Method / URL**: `GET /api/v1/units`
- **Quyền hạn**: Công khai (Public)
- **Query Params**:
  - `facility-id`: ID chi nhánh (tùy chọn)
  - `type-id`: ID loại kho (tùy chọn)
  - `status`: Mặc định `"AVAILABLE"`
  - `q`: Từ khóa tìm kiếm theo mã kho (ví dụ `"S-2"`)
  - `page`: Trang (1-based, mặc định `1`)
  - `page-size`: Số lượng mỗi trang (mặc định `25`)
- **Hàm Service**: `src/services/unitService.js` ➔ `searchUnits(params)`
- **Response Thành Công (`200 OK`)**:
```json
{
  "items": [
    {
      "id": 2,
      "code": "S-2",
      "typeName": "Small (S)",
      "sizeM2": 4.0,
      "floor": 1,
      "zoneCode": "A",
      "facilityName": "Tân Bình Depot",
      "accessType": "PIN",
      "baseMonthlyRent": 345000,
      "status": "AVAILABLE"
    }
  ],
  "page": 1,
  "pageSize": 25,
  "total": 1
}
```

> [!NOTE]
> **Quy Tắc Hiển Thị Trạng Thái Khả Dụng (Availability Business Rule)**:
> - Danh sách catalog hiển thị các kho có trạng thái `AVAILABLE`.
> - Nếu một khách hàng mới chỉ khởi tạo đơn đặt chỗ (`PENDING_PAYMENT`) nhưng **chưa thanh toán tiền cọc**, ô kho vẫn tiếp tục được coi là khả dụng trên danh mục tìm kiếm (`Còn trống · Cọc để giữ chỗ`).
> - Ô kho chỉ chính thức chuyển sang `RESERVED` và khóa lại sau khi có giao dịch thanh toán cọc thành công (`SUCCEEDED`).

---

## 3. Báo Giá Dự Kiến Đơn Thuê (Pricing Engine Quote)

- **Method / URL**: `GET /api/v1/units/{unitId}/quote`
- **Quyền hạn**: Công khai (Public)
- **Query Params**: `start-date` (YYYY-MM-DD), `duration-months` (1, 3, 6, 12)
- **Hàm Service**: `src/services/unitService.js` ➔ `getUnitQuote(unitId, params)`
- **Response Thành Công (`200 OK`)**:
```json
{
  "unitId": 2,
  "unitCode": "S-2",
  "monthlyRent": 345000,
  "durationMonths": 3,
  "totalRent": 1035000,
  "depositRate": 10,
  "depositAmount": 34500,
  "totalDueNow": 34500,
  "policyVersion": "v3"
}
```
