# Hướng Dẫn Chi Tiết Triển Khai Backend: Browse Units, Unit Detail, Booking Reserve & Contract Auto-Draft

> **Người thực hiện:** Kỹ sư Backend StorageHub (Phúc)  
> **Phạm vi hoàn thiện:** Sprint 1 — Feature 4.2 & Contract Management / User Stories:  
> - **US-6:** Browse Units với Availability chính xác (FR-4)  
> - **US-7:** Unit Detail & Bảng giá minh bạch (FR-6, AD-11)  
> - **US-9:** Booking Summary & Reserve re-check chống Stale data (FR-5, FR-7)  
> - **US-11/13:** Contract auto-draft & chuỗi hợp đồng read-only (FR-10, FR-13, Thuần BE)  
> **Nguồn đối chiếu:** `contracts/openapi.yaml`, `docs/architecture/ARCHITECTURE-SPINE.md`, `docs/prd/prd.md`, `docs/ux/DESIGN.md`, `docs/ux/EXPERIENCE.md`, Mockups `F1-03-browse-units.html`, `F1-04-unit-detail.html`, `F1-05-booking-summary.html`  
> **Branch Git:** `be/phuc`  
> **Trạng thái:** Đã hoàn thành 100% code backend & bộ test suite (**40/40 test cases passed**).

---

## 1. Bản Chất Nghiệp Vụ & Quy Tắc Bất Biến (Architecture Invariants)

Toàn bộ mã nguồn backend tuân thủ nghiêm ngặt các nguyên tắc kiến trúc đã đóng băng trong `ARCHITECTURE-SPINE.md`:

```
+-----------------------------------------------------------------------------------+
|                            ARCHITECTURE INVARIANTS                                |
+-----------------------------------------------------------------------------------+
|  AD-2: Contract-First API     -> 100% wire format, path, query param từ openapi. |
|  AD-3: Layer-First            -> Controller -> Service -> Repository (DTOs only). |
|  AD-4: Server Exclusive Time  -> AVAILABLE_SOON & EXPIRED là derived state on-read|
|  AD-5: Auth Matrix            -> Yêu cầu Bearer token hợp lệ trên mọi endpoint.  |
|  AD-6: Data Ownership         -> UnitService làm chủ units; ReservationService    |
|                                  làm chủ reservations (trọn vòng đời đặt & thuê).|
|  AD-7: Money & Time Format    -> Tiền VND nguyên (Long), ngày YYYY-MM-DD (ICT).   |
|  AD-8: Envelope Thống Nhất    -> UnitPage / ReservationPage / ApiError chuẩn hóa. |
|  AD-11: Pricing Single-Source -> PricingEngine là nguồn DUY NHẤT của mọi dòng tiền|
+-----------------------------------------------------------------------------------+
```

### Các nguyên tắc nghiệp vụ cốt lõi:
1. **AD-2 (Contract-First API):** 
   - `contracts/openapi.yaml` là chân lý duy nhất. Mọi URL, HTTP method, query parameter kebab-case (`type-id`, `size-m2`, `start-date`, `duration-months`), JSON key camelCase (`baseMonthlyRent`, `availableFromDate`, `depositAmount`, `totalRent`), Enum value, Error envelope phải chính xác từng ký tự.
2. **AD-3 (Layer-First Discipline):**
   - `Controller` chỉ nhận HTTP, validate param, gọi Service, trả `ResponseEntity<DTO>`.
   - `Entity` JPA không bao giờ được lọt ra ngoài Controller.
3. **AD-4 (Backend Độc Quyền State & Thời Gian):**
   - Trạng thái `AVAILABLE_SOON` (do đệm dọn dẹp Turnover Buffer) và `EXPIRED` (do quá hạn nhận kho mà không check-in) là **trạng thái tính toán on-read (derived state)**.
   - **TUYỆT ĐỐI CẤM** persist `AVAILABLE_SOON` hay `EXPIRED` trực tiếp vào cột `status` trong database.
4. **AD-6 (Data Ownership & Concurrency Guard):**
   - `UnitService` sở hữu catalog kho.
   - `ReservationService` độc quyền ghi và quản lý toàn bộ vòng đời đặt chỗ (`reservations`).
   - Chống double-booking (FR-5): Reserve chạy trong `@Transactional` kiểm tra xung đột lịch đặt. Cột `lock_version` (`@Version`) trên `units` bảo vệ chống race-condition đồng thời.
5. **AD-11 (Pricing Single-Source - Bảng Giá Minh Bạch):**
   - Mọi số liệu tài chính hiển thị tại **Unit Detail**, **Booking Summary**, **Payment Modal** và **Hợp đồng điện tử** đều bắt buộc phải được tính toán từ một nguồn duy nhất: `PricingEngine`.
   - Không dòng tiền nào xuất hiện ở bước thanh toán mà vắng mặt ở Booking Summary.

---

## 2. Danh Sách 8 Endpoints Hoàn Thiện

```mermaid
flowchart TD
    Client([Frontend / Client]) -->|1. Dropdown bộ lọc| GET_FILTER["GET /api/v1/units/filter-options"]
    Client -->|2. Tìm kho khả dụng| GET_UNITS["GET /api/v1/units"]
    Client -->|3. Xem thông số kho| GET_DETAIL["GET /api/v1/units/{unitId}"]
    Client -->|4. Tính bảng giá minh bạch| GET_QUOTE["GET /api/v1/units/{unitId}/quote"]
    Client -->|5. Bấm Reserve đặt chỗ| POST_RES["POST /api/v1/reservations"]
    Client -->|6. Xem chi tiết đặt chỗ| GET_RES["GET /api/v1/reservations/{reservationId}"]
    Client -->|7. Chuỗi hợp đồng| GET_CHAIN["GET /api/v1/reservations/{reservationId}/contracts"]
    Client -->|8. Chi tiết hợp đồng| GET_CT["GET /api/v1/contracts/{contractId}"]
```

### 2.1. `GET /api/v1/units/filter-options`
- Cung cấp danh mục loại kho và danh sách kích thước m² có sẵn.
- **Response `200 OK`:**
```json
{
  "types": [
    { "id": 1, "name": "Locker" },
    { "id": 2, "name": "S" },
    { "id": 3, "name": "M" },
    { "id": 4, "name": "L" }
  ],
  "sizesM2": [1.5, 5.0, 8.0, 15.0]
}
```

### 2.2. `GET /api/v1/units`
- Tìm kiếm kho với availability tính động (turnover buffer, anti-overlap conflict check), phân trang 1-based.
- **Response `200 OK` (`UnitPage`):**
```json
{
  "items": [
    {
      "id": 1,
      "code": "S-1",
      "typeName": "S",
      "sizeM2": 5.0,
      "floor": 1,
      "zoneCode": "A",
      "facilityName": "Tân Bình Depot",
      "accessType": "PIN",
      "baseMonthlyRent": 345000,
      "availability": {
        "status": "AVAILABLE",
        "availableFromDate": null
      },
      "photoUrl": "/units/S-1.jpg"
    }
  ],
  "page": 1,
  "pageSize": 25,
  "total": 1
}
```

### 2.3. `GET /api/v1/units/{unitId}`
- Trả về thông số chi tiết đầy đủ (spec) của 1 kho.
- **Response `200 OK` (`UnitDetail`):**
```json
{
  "id": 3,
  "code": "S-3",
  "typeName": "S",
  "sizeM2": 5.0,
  "floor": 1,
  "zoneCode": "A",
  "facilityName": "Tân Bình Depot",
  "accessType": "PIN",
  "baseMonthlyRent": 345000,
  "availability": {
    "status": "AVAILABLE",
    "availableFromDate": null
  },
  "photoUrl": "/units/S-3.jpg",
  "dimensions": "2.0 × 2.5 × 2.2 m",
  "security": "24/7 PIN + CCTV + Motion sensors",
  "photoUrls": [
    "/units/S-3.jpg",
    "/units/S-3-interior.jpg"
  ]
}
```

### 2.4. `GET /api/v1/units/{unitId}/quote`
- Bảng giá minh bạch tính từ `PricingEngine` (AD-11) làm nền cho màn Booking Summary.
- **Query Params:** `start-date` (YYYY-MM-DD), `duration-months` (1..36).
- **Response `200 OK` (`Quote`):**
```json
{
  "unitId": 3,
  "startDate": "2026-10-03",
  "endDate": "2027-01-02",
  "durationMonths": 3,
  "lines": [
    {
      "kind": "RENT",
      "code": "RENT_RATE",
      "label": "Rent 345.000 ₫ × 3 months",
      "amount": 1035000,
      "refundable": false
    },
    {
      "kind": "DEPOSIT",
      "code": "DEPOSIT_RATE",
      "label": "Deposit (10%, refundable)",
      "amount": 103500,
      "refundable": true
    }
  ],
  "totalRent": 1035000,
  "depositAmount": 103500,
  "dueNow": 103500,
  "policyVersion": "v3"
}
```

### 2.5. `POST /api/v1/reservations` (Reserve Re-check - FR-5)
- Re-check availability trong Transaction: Nếu kho bị chiếm giữa chừng -> **HTTP 409 Conflict** (`BOOKING_UNIT_TAKEN`). Nếu còn trống -> tạo đơn ở trạng thái `PENDING_PAYMENT` và snapshot bảng giá.
- **Request Body:**
```json
{
  "unitId": 3,
  "startDate": "2026-10-03",
  "durationMonths": 3
}
```
- **Response `201 Created` (`ReservationDetail`):**
```json
{
  "id": 1042,
  "code": "BK-2026-0001",
  "status": "PENDING_PAYMENT",
  "unit": {
    "code": "S-3",
    "sizeM2": 5.0,
    "typeName": "S"
  },
  "startDate": "2026-10-03",
  "endDate": "2027-01-02",
  "depositAmount": 103500,
  "depositStatus": null,
  "durationMonths": 3,
  "quote": {
    "unitId": 3,
    "startDate": "2026-10-03",
    "endDate": "2027-01-02",
    "durationMonths": 3,
    "lines": [
      { "kind": "RENT", "code": "RENT_RATE", "label": "Rent 345.000 ₫ × 3 months", "amount": 1035000, "refundable": false },
      { "kind": "DEPOSIT", "code": "DEPOSIT_RATE", "label": "Deposit (10%, refundable)", "amount": 103500, "refundable": true }
    ],
    "totalRent": 1035000,
    "depositAmount": 103500,
    "dueNow": 103500,
    "policyVersion": "v3"
  },
  "checkInDeadline": "2026-10-03",
  "depositForfeitReason": null,
  "accessCode": null,
  "payments": [],
  "contracts": []
}
```
- **Error Response `409 Conflict` (khi kho vừa bị người khác đặt):**
```json
{
  "code": "BOOKING_UNIT_TAKEN",
  "message": "S-3 vừa được đặt. 5 unit tương tự còn trống.",
  "fieldErrors": []
}
```

### 2.6. `GET /api/v1/reservations/{reservationId}`
- Chi tiết hồ sơ đặt chỗ/thuê kho (Rental Detail), hỗ trợ suy diễn `EXPIRED` on-read nếu quá ngày nhận kho mà chưa check-in (FR-36, AD-4).
- **Response `200 OK` (`ReservationDetail`)**

### 2.7. `GET /api/v1/reservations/{reservationId}/contracts`
- Lấy chuỗi hợp đồng liên kết với đặt chỗ theo thứ tự thời gian sinh (`createdAt ASC`) cho màn Rental Detail (FR-13).
- Bao gồm bản hợp đồng gốc, các bản superseded (khi re-draft) và phụ lục (ADDENDUM).
- **Response `200 OK` (`List<ContractChainItem>`):**
```json
[
  {
    "id": 101,
    "code": "CT-2026-0001",
    "kind": "ORIGINAL",
    "status": "SUPERSEDED",
    "isLatest": false,
    "signedPhotoUrl": null,
    "signatureDueDate": null
  },
  {
    "id": 102,
    "code": "CT-2026-0002",
    "kind": "ORIGINAL",
    "status": "DRAFT",
    "isLatest": true,
    "signedPhotoUrl": null,
    "signatureDueDate": null
  }
]
```

### 2.8. `GET /api/v1/contracts/{contractId}`
- Lấy chi tiết đầy đủ 1 bản hợp đồng — bao gồm `contentSnapshot` để Frontend render print view nguyên vẹn theo chuẩn in ấn (FR-11).
- **Response `200 OK` (`ContractDetail`):**
```json
{
  "id": 102,
  "code": "CT-2026-0002",
  "kind": "ORIGINAL",
  "status": "DRAFT",
  "isLatest": true,
  "signedPhotoUrl": null,
  "signatureDueDate": null,
  "reservationId": 1042,
  "policyVersion": "v3",
  "contentSnapshot": "CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM\nĐộc lập - Tự do - Hạnh phúc\n---\nHỢP ĐỒNG THUÊ KHO LƯU TRỮ TỰ QUẢN (STORAGEHUB)...",
  "createdAt": "2026-09-27T10:00:00Z"
}
```
- **Error Response `404 Not Found` (khi không tìm thấy hoặc user không có quyền):**
```json
{
  "code": "CONTRACT_NOT_FOUND",
  "message": "Không tìm thấy hợp đồng này.",
  "fieldErrors": []
}
```

---

## 3. Kiến Trúc Thuật Toán & Xử Lý Concurrency (FR-5, FR-7)

```mermaid
sequenceDiagram
    autonumber
    actor Customer as Khách hàng (FE)
    participant Ctrl as ReservationController
    participant Svc as ReservationService
    participant PE as PricingEngine
    participant Repo as Reservation / Unit Repositories
    participant DB as MySQL Database

    Customer->>Ctrl: POST /api/v1/reservations {unitId, startDate, durationMonths}
    Ctrl->>Svc: createReservation(userEmail, request)
    Note over Svc,Repo: Bắt đầu Transaction
    Svc->>Repo: Re-check Unit tồn tại & status (AVAILABLE / PREPARING)
    Svc->>Repo: Re-check Turnover buffer & Anti-overlap với Reservations active
    alt Bị chiếm giữa chừng hoặc trùng lịch
        Svc->>Repo: Đếm số unit tương tự còn trống (cùng typeId tại facility)
        Svc-->>Ctrl: Ném BookingUnitTakenException
        Ctrl-->>Customer: 409 Conflict { code: BOOKING_UNIT_TAKEN, message: "S-3 vừa được đặt. N unit tương tự còn trống." }
    else Kho khả dụng
        Svc->>PE: calculateQuote(unit, startDate, durationMonths)
        PE-->>Svc: QuoteResponse (AD-11 single-source)
        Svc->>Repo: Sinh mã BK-YYYY-NNNN & Lưu Reservation (PENDING_PAYMENT)
        Note over Svc,Repo: Commit Transaction
        Svc-->>Ctrl: ReservationDetailResponse
        Ctrl-->>Customer: 201 Created (Kèm quote snapshot để mở Payment Modal)
    end
```

### Thuật toán Re-check Availability khi Reserve (FR-5):
1. **Kiểm tra trạng thái vật lý:** `unit.status` phải là `AVAILABLE` hoặc `PREPARING`. Nếu là `RENTED`, `MAINTENANCE`, `RETIRED` -> Đánh dấu bị chiếm.
2. **Kiểm tra Turnover Buffer:** Nếu `unit.status == PREPARING`, tính ngày dọn xong `readyDate = latestClosedRes.endDate + bufferDays`. Nếu `startDate < readyDate` -> Đánh dấu bị chiếm.
3. **Kiểm tra Anti-Overlap:** Truy vấn các reservation đã giữ kho (`RESERVED`, `CHECKED_IN`, `CHECKOUT_REQUESTED`). Khoảng thời gian yêu cầu `[startDate, endDate + bufferDays]` không được giao nhau với bất kỳ reservation active nào.
4. **Đếm Unit tương tự khi bị chiếm:**
   - Tìm danh sách các kho cùng `typeId` trong cùng cơ sở có trạng thái `AVAILABLE` hoặc `PREPARING` và không bị trùng lịch.
   - Trả về thông báo thân thiện: `"{code} vừa được đặt. {count} unit tương tự còn trống."` hoặc `"{code} vừa được đặt. Không còn unit tương tự trống trong thời gian này."`.

---

## 4. Kiến Trúc Contract Auto-Draft & Quản Lý Chuỗi Hợp Đồng (FR-10, FR-13, Thuần BE)

```mermaid
sequenceDiagram
    autonumber
    actor Customer as Khách hàng (FE)
    participant Ctrl as ContractController
    participant Svc as ContractService
    participant PE as PricingEngine
    participant Repo as ContractRepository
    participant DB as MySQL Database

    Note over Customer,DB: 1. AUTO-DRAFT (FR-10): Kích hoạt tự động khi Deposit thành công
    Customer->>Svc: autoDraftContract(reservation) [Độc quyền từ Payment Service]
    Svc->>Repo: Khóa RentalPolicy active (v3)
    Svc->>PE: calculateQuote(unit, startDate, durationMonths)
    Svc->>Svc: Sinh nội dung pháp lý & tài chính (contentSnapshot)
    opt Đã có bản hợp đồng trước đó
        Svc->>Repo: Bản cũ -> status=SUPERSEDED, isLatest=false (FR-13)
        Repo->>DB: UPDATE contracts SET status='SUPERSEDED', is_latest=0
    end
    Svc->>Repo: Lưu bản mới -> status=DRAFT, isLatest=true, supersedes=bản cũ
    Repo->>DB: INSERT INTO contracts (is_latest=1, latest_key=reservation_id)
    Note over Svc,DB: uk_contracts_latest (latest_key) bảo vệ đúng 1 bản latest

    Note over Customer,DB: 2. TRA CỨU CHUỖI HỢP ĐỒNG (FR-13)
    Customer->>Ctrl: GET /api/v1/reservations/{reservationId}/contracts
    Ctrl->>Svc: listContractsByReservation(userEmail, reservationId)
    Svc->>Repo: findByReservation_ReservationIdOrderByCreatedAtAsc(reservationId)
    Svc-->>Ctrl: List<ContractChainItemResponse>
    Ctrl-->>Customer: 200 OK (Chuỗi hợp đồng: SUPERSEDED -> DRAFT)

    Note over Customer,DB: 3. CHI TIẾT ĐỂ IN VIEW (FR-11)
    Customer->>Ctrl: GET /api/v1/contracts/{contractId}
    Ctrl->>Svc: getContract(userEmail, contractId)
    Svc->>Repo: findWithDetailsById(contractId)
    Svc-->>Ctrl: ContractDetailResponse (kèm contentSnapshot)
    Ctrl-->>Customer: 200 OK (FE render bản in chuẩn nguyên vẹn)
```

### 4.1. Quy Tắc Bất Biến Về Hợp Đồng (AD-6, FR-10, FR-13):
1. **Tự động sinh (Auto-draft, FR-10):** Hợp đồng được sinh hoàn toàn tự động ngay khi thanh toán tiền cọc (Deposit) thành công. Hệ thống **không cung cấp bất kỳ API nào cho phép tạo hợp đồng thủ công**.
2. **Bất biến (Strictly Read-Only):** Hợp đồng không thể bị chỉnh sửa dưới bất kỳ hình thức nào. Không tồn tại endpoint `PUT` hoặc `PATCH` cho Contract.
3. **Cơ chế Superseded & Chuỗi hợp đồng (FR-13):**
   - Khi cần phát hành lại hợp đồng (re-draft), bản hiện hành được cập nhật sang trạng thái `SUPERSEDED` và `isLatest = false`.
   - Bản hợp đồng mới được tạo ở trạng thái `DRAFT`, `isLatest = true`, liên kết tự tham chiếu `supersedes` trỏ về bản cũ.
   - Bản `SUPERSEDED` vẫn được lưu trữ vĩnh viễn và hiển thị đầy đủ trong chuỗi hợp đồng trên màn hình Rental Detail để đảm bảo tính minh bạch và truy vết kiểm toán.
4. **Bảo vệ toàn vẹn cấp Database (Database-Level Invariant):**
   - Bảng `contracts` sử dụng generated column: `latest_key AS (CASE WHEN is_latest = 1 THEN reservation_id ELSE NULL END) STORED`.
   - Đi kèm ràng buộc duy nhất: `UNIQUE KEY uk_contracts_latest (latest_key)`.
   - Cơ chế này loại bỏ hoàn toàn rủi ro có 2 bản hợp đồng cùng là `isLatest = true` cho cùng một reservation ngay ở tầng hệ quản trị cơ sở dữ liệu.
5. **Snapshot Điều Khoản & Chi Phí (`contentSnapshot`):**
   - Nội dung hợp đồng được cố định dạng chuỗi văn bản pháp lý đầy đủ (`SqlTypes.LONGVARCHAR`), bao gồm thông tin các bên, số hiệu kho, thời hạn thuê, đơn giá tháng, tổng tiền thuê, tiền cọc bảo đảm, và cam kết vận hành.
   - Frontend chỉ việc lấy trường này hiển thị trực tiếp lên Print View / Modal xem trước mà không cần dựng dịch vụ PDF cồng kềnh.

---

## 5. Kết Quả Kiểm Thử Tự Động (Automated Testing)

Toàn bộ **40 test cases** thuộc tất cả các tầng (Controller, Service, PricingEngine) đã vượt qua kiểm thử tự động với **100% BUILD SUCCESS**:

```
[INFO] -------------------------------------------------------
[INFO]  T E S T S
[INFO] -------------------------------------------------------
[INFO] Running com.storagehub.controller.ContractControllerTest
[INFO] Tests run: 4, Failures: 0, Errors: 0, Skipped: 0, Time elapsed: 2.901 s -- in com.storagehub.controller.ContractControllerTest
[INFO] Running com.storagehub.controller.ReservationControllerTest
[INFO] Tests run: 5, Failures: 0, Errors: 0, Skipped: 0, Time elapsed: 0.947 s -- in com.storagehub.controller.ReservationControllerTest
[INFO] Running com.storagehub.controller.UnitControllerTest
[INFO] Tests run: 6, Failures: 0, Errors: 0, Skipped: 0, Time elapsed: 0.497 s -- in com.storagehub.controller.UnitControllerTest
[INFO] Running com.storagehub.service.ContractServiceTest
[INFO] Tests run: 8, Failures: 0, Errors: 0, Skipped: 0, Time elapsed: 0.312 s -- in com.storagehub.service.ContractServiceTest
[INFO] Running com.storagehub.service.PricingEngineTest
[INFO] Tests run: 3, Failures: 0, Errors: 0, Skipped: 0, Time elapsed: 0.060 s -- in com.storagehub.service.PricingEngineTest
[INFO] Running com.storagehub.service.ReservationServiceTest
[INFO] Tests run: 6, Failures: 0, Errors: 0, Skipped: 0, Time elapsed: 0.130 s -- in com.storagehub.service.ReservationServiceTest
[INFO] Running com.storagehub.service.UnitServiceTest
[INFO] Tests run: 8, Failures: 0, Errors: 0, Skipped: 0, Time elapsed: 0.067 s -- in com.storagehub.service.UnitServiceTest
[INFO] 
[INFO] Results:
[INFO] 
[INFO] Tests run: 40, Failures: 0, Errors: 0, Skipped: 0
[INFO] 
[INFO] ------------------------------------------------------------------------
[INFO] BUILD SUCCESS
[INFO] ------------------------------------------------------------------------
```

### Chi tiết các kịch bản kiểm thử:
1. **`ContractServiceTest` (8 tests):**
   - `testAutoDraftContract_FirstContract_Success`: Sinh hợp đồng tự động lần đầu, mã `CT-YYYY-NNNN`, trạng thái `DRAFT`, `isLatest = true`, khóa chính sách giá `v3`, nội dung pháp lý `contentSnapshot` đầy đủ.
   - `testAutoDraftContract_ReDraft_MarksPreviousContractSuperseded`: Khi re-draft, bản hợp đồng cũ tự động chuyển sang `SUPERSEDED`, `isLatest = false`, bản mới trỏ `supersedes` về bản cũ.
   - `testReDraftContract_CustomerOwner_Success`: Khách hàng sở hữu reservation kích hoạt re-draft thành công.
   - `testReDraftContract_UnauthorizedOtherCustomer_ThrowsReservationNotFound`: Khách hàng khác cố tình can thiệp bị chặn và trả mã lỗi bảo mật.
   - `testListContractsByReservation_Success`: Trả về danh sách chuỗi hợp đồng sắp xếp tăng dần theo thời gian tạo.
   - `testGetContract_Success`: Lấy chi tiết hợp đồng kèm nội dung snapshot.
   - `testGetContract_NotFound_ThrowsContractNotFoundException`: Ném `ContractNotFoundException` khi mã hợp đồng không tồn tại.
   - `testGetContract_UnauthorizedCustomer_ThrowsContractNotFoundException`: Ẩn thông tin và ném ngoại lệ khi user không có quyền đọc hợp đồng của người khác.
2. **`ContractControllerTest` (4 tests):**
   - `testListContractsByReservation_Success`: `GET /api/v1/reservations/{id}/contracts` trả về **200 OK** với chuỗi hợp đồng.
   - `testListContractsByReservation_NotFound`: Trả về **404 Not Found** với mã `RESERVATION_NOT_FOUND`.
   - `testGetContract_Success`: `GET /api/v1/contracts/{id}` trả về **200 OK** với thông tin chi tiết và `contentSnapshot`.
   - `testGetContract_NotFound`: Trả về **404 Not Found** với mã `CONTRACT_NOT_FOUND` và thông báo `"Không tìm thấy hợp đồng này."`.
3. **`ReservationServiceTest` (6 tests)** & **`ReservationControllerTest` (5 tests):** Kiểm thử luồng đặt chỗ, re-check availability chống double-booking, tính bảng giá minh bạch và phân quyền.
4. **`UnitServiceTest` (8 tests)** & **`UnitControllerTest` (6 tests):** Kiểm thử tìm kiếm kho, filter bar, turnover buffer đệm dọn dẹp và phân trang.
5. **`PricingEngineTest` (3 tests):** Kiểm thử công thức tính tiền thuê, phụ phí và tiền cọc đơn nguồn duy nhất (AD-11).

---

## 6. Hướng Dẫn Kiểm Thử Thực Tế Bằng cURL

Khởi chạy backend:
```bash
cd backend
mvn spring-boot:run
```

### Bước 1: Đăng nhập lấy JWT Token
```bash
curl -X POST http://localhost:8080/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"<USER_EMAIL>","password":"<USER_PASSWORD>"}'
```

### Bước 2: Xem Bảng Giá Minh Bạch Trước Khi Đặt (Booking Summary)
```bash
curl -X GET "http://localhost:8080/api/v1/units/3/quote?start-date=2026-10-03&duration-months=3" \
  -H "Authorization: Bearer <TOKEN>"
```

### Bước 3: Bấm Reserve Tạo Đơn Đặt Chỗ (Reserve Re-check)
```bash
curl -X POST http://localhost:8080/api/v1/reservations \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"unitId": 3, "startDate": "2026-10-03", "durationMonths": 3}'
```
Kết quả trả về **201 Created** với `status: "PENDING_PAYMENT"`, mã `code: "BK-2026-0001"`, `depositAmount: 103500`.

### Bước 4: Thử Đặt Trùng Kho Đã Bị Chiếm (Kiểm thử 409 Conflict)
Khi unit đã được xác nhận đặt hoặc bị trùng lịch:
```bash
curl -X POST http://localhost:8080/api/v1/reservations \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"unitId": 3, "startDate": "2026-10-03", "durationMonths": 3}'
```
Kết quả trả về **409 Conflict**:
```json
{
  "code": "BOOKING_UNIT_TAKEN",
  "message": "S-3 vừa được đặt. 5 unit tương tự còn trống.",
  "fieldErrors": []
}
```

### Bước 5: Xem Chuỗi Hợp Đồng Của Reservation (Rental Detail)
```bash
curl -X GET "http://localhost:8080/api/v1/reservations/1042/contracts" \
  -H "Authorization: Bearer <TOKEN>"
```
Trả về mảng JSON các bản hợp đồng theo thứ tự thời gian (`SUPERSEDED` -> `DRAFT`).

### Bước 6: Xem Chi Tiết 1 Bản Hợp Đồng (Print View)
```bash
curl -X GET "http://localhost:8080/api/v1/contracts/101" \
  -H "Authorization: Bearer <TOKEN>"
```
Trả về chi tiết hợp đồng gồm trường `contentSnapshot` nguyên vẹn nội dung pháp lý và cam kết cho FE hiển thị bản in.

