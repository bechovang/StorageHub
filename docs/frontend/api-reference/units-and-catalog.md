# API Reference: Danh Mục Kho & Báo Giá (Units & Catalog)

Các API phục vụ tìm kiếm kho, xem thông số kỹ thuật, phân trang, lịch khả dụng trực quan và tính toán báo giá thuê.

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

## 2. Tìm Kiếm Danh Sách Kho & Phân Trang (Catalog Search & Pagination)

- **Method / URL**: `GET /api/v1/units`
- **Quyền hạn**: Công khai (Public)
- **Query Params**:
  - `facility-id`: ID chi nhánh (tùy chọn)
  - `type-id`: ID loại kho (tùy chọn)
  - `status`: Mặc định `"AVAILABLE"`
  - `q`: Từ khóa tìm kiếm theo mã kho (ví dụ `"S-2"`)
  - `page`: Trang (1-based, mặc định `1`)
  - `page-size`: Số lượng mỗi trang (mặc định `12` cho lưới hiển thị chuẩn Swiss Neo-Brutalist)
- **Hàm Service**: `src/services/unitService.js` ➔ `searchUnits(params)`
- **Hook Xử Lý Giao Diện**: `src/features/catalog/hooks/useBrowseUnits.js`
  - Quản lý trạng thái: `page`, `pageSize: 12`, `total`, `totalPages`, `handlePageChange`.
  - Kết hợp với component `Pagination.jsx` hiển thị thanh chuyển trang với nút *Trước / Sau*, danh sách số trang và thông tin "Hiển thị X - Y trên tổng số Z kho".
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
  "pageSize": 12,
  "total": 40
}
```

> [!NOTE]
> **Quy Tắc Hiển Thị Trạng Thái Khả Dụng (Availability Business Rule)**:
> - Danh sách catalog hiển thị các kho có trạng thái `AVAILABLE`.
> - Nếu một khách hàng mới chỉ khởi tạo đơn đặt chỗ (`PENDING_PAYMENT`) nhưng **chưa thanh toán tiền cọc**, kho vẫn tiếp tục được coi là khả dụng trên danh mục tìm kiếm (`Còn trống · Cọc để giữ chỗ`).
> - Kho chỉ chính thức chuyển sang `RESERVED` và khóa lại sau khi có giao dịch thanh toán cọc thành công (`SUCCEEDED`).
>
> [!TIP]
> **Dữ Liệu Seed Demo (Flyway V19)**:
> - Cơ sở dữ liệu và mock service được nạp đầy đủ **40 kho khả dụng** (`AVAILABLE`) để phân bố trọn vẹn 4 trang (12 kho/trang: 12, 12, 12, 4).
> - Phân bổ gồm: 10 tủ Locker (1.5 m²), 11 kho nhỏ S (5 m²), 12 kho vừa M (8 m²), và 7 kho lớn L (15 m²) tại cơ sở Tân Bình.

---

## 3. Trải Nghiệm Thẻ Kho & Điều Hướng Chi Tiết (UnitCard Navigation)

- **Đơn giản hóa hành động trên Thẻ kho (`UnitCard.jsx`)**:
  - Lược bỏ hoàn toàn nút phụ "Chi tiết" để tối ưu hóa trải nghiệm người dùng, tránh gây phân tán sự chú ý.
  - Thẻ kho chỉ duy trì duy nhất một nút Call-To-Action (CTA) chính: **"Đặt kho"**.
  - Người dùng có thể click trực tiếp vào nút **"Đặt kho"** hoặc click vào bất kỳ vị trí nào trên thẻ kho để được điều hướng thẳng vào trang Chi tiết kho (`/units/:id`).

---

## 4. Lịch Khả Dụng Trực Quan Tô Đỏ Ngày Đã Đặt (Unit Availability Calendar)

- **Component**: `src/features/catalog/components/UnitAvailabilityCalendar.jsx`
- **Tích hợp tại**: Trang chi tiết kho (`/units/:id`) thông qua `UnitPricingCalculator.jsx`.
- **Đặc điểm giao diện & nghiệp vụ**:
  - **Lịch tháng trực quan**: Hiển thị lưới ngày trong tháng hiện tại và cho phép điều hướng tháng kế tiếp / tháng trước.
  - **Tô đỏ các ngày đã bị đặt (`is-booked`)**: Các ngày đã có khách thuê, các ngày đã khóa chỗ hoặc các ngày trước thời điểm kho sẵn sàng (`availableFromDate`) được đánh dấu nổi bật bằng màu đỏ cảnh báo, gạch ngang số ngày và có chấm đỏ báo bận.
  - **Chọn ngày bắt đầu thuê thuận tiện**: Khách hàng có thể click trực tiếp vào bất kỳ ô ngày còn trống nào để chọn làm ngày bắt đầu thuê (`startDate`), tự động cập nhật ngay lập tức vào công cụ tính báo giá và đặt cọc 10%.
  - **Trạng thái ô ngày được chọn**: Ô ngày đang chọn chuyển sang nền màu đen (`#0f172a`), chữ trắng tương phản cao, tối giản và sạch sẽ, không hiển thị biểu tượng tick xanh nhằm đảm bảo thị giác gọn gàng chuẩn Swiss Neo-Brutalist.
  - **Bảng chú giải rõ ràng**: Có phần ghi chú minh bạch (Đã bị đặt - Nền đỏ chữ đỏ; Ngày bạn chọn - Nền đen; Còn trống - Nền trắng viền xám).

---

## 5. Báo Giá Dự Kiến Đơn Thuê (Pricing Engine Quote)

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
