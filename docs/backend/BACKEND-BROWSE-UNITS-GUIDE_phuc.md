# Hướng Dẫn Chi Tiết Triển Khai Backend: Browse Units & Availability Chính Xác

> **Dành cho:** Kỹ sư Backend StorageHub (An / Phúc / Huy)  
> **Phạm vi:** Sprint 1 — Feature 4.2 / User Story US-6 (FR-4, FR-5, AD-1..AD-11)  
> **Nguồn đối chiếu:** `contracts/openapi.yaml`, `docs/architecture/ARCHITECTURE-SPINE.md`, `docs/prd/prd.md`, `docs/ux/DESIGN.md`, `docs/ux/EXPERIENCE.md`, Mockup `F1-03-browse-units.html`

---

## 1. Bản Chất Nghiệp Vụ & Các Quy Tắc Bất Biến (Architecture Invariants)

Trước khi viết code, cần nắm vững các nguyên tắc kiến trúc đã đóng băng trong `ARCHITECTURE-SPINE.md` và `contracts/openapi.yaml`:

1. **AD-2 (Contract-First API):** OpenAPI spec tại `contracts/openapi.yaml` là nguồn chân lý duy nhất. Mọi URL, HTTP Method, Query Parameter, JSON field name, Enum value, Error envelope phải **khớp 100%**.
2. **AD-3 (Layer-First Discipline):** 
   - `Controller` chỉ nhận HTTP, validate param, gọi đúng `UnitService`, trả DTO. Cấm Controller gọi `Repository`.
   - `Entity` JPA không bao giờ được lọt ra ngoài Controller. Chỉ trả DTO ra client.
3. **AD-4 (Backend Độc Quyền State & Thời Gian):**
   - Trạng thái `AVAILABLE_SOON` (do dính Turnover Buffer) là **trạng thái suy diễn on-read (derived state)**, được tính toán động tại thời điểm query.
   - **TUYỆT ĐỐI CẤM** persist `AVAILABLE_SOON` vào cột `units.status` trong database. Trong database, cột `status` chỉ lưu: `AVAILABLE`, `RESERVED`, `RENTED`, `PREPARING`, `MAINTENANCE`, `RETIRED`.
4. **AD-5 (Auth & Permission Matrix):**
   - Khác với Login/Register/Forgot-Password, endpoint Browse Units **YÊU CẦU ĐĂNG NHẬP** (JWT Bearer token hợp lệ). Khách vãng lai chưa có tài khoản sẽ không duyệt kho.
5. **AD-6 (Data Ownership):**
   - `UnitService` là owner duy nhất của 4 bảng: `facilities`, `zones`, `unit_types`, `units`.
   - Dữ liệu `rental_policies` / `policy_rules` và `reservations` được đọc phục vụ tính toán on-read.
6. **AD-7 (Money & Time Wire Format):**
   - Tiền VND là số nguyên `Long` / `BigDecimal` (không float). `baseMonthlyRent` là số nguyên (VND/tháng).
   - Ngày nghiệp vụ dùng định dạng chuỗi `"YYYY-MM-DD"` theo múi giờ Việt Nam (`Asia/Ho_Chi_Minh` / ICT).
7. **AD-8 (Envelope Thống Nhất):**
   - Envelope danh sách phân trang: `{ "items": [...], "page": 1, "pageSize": 25, "total": 6 }`.
   - Lưu ý quan trọng: **`page` là 1-based** (trang đầu tiên là `1`, không phải `0`).
8. **AD-11 (Pricing Single-Source):**
   - `baseMonthlyRent` của unit lấy từ Policy Rule `RENT_RATE` thuộc phiên bản Rental Policy đang hoạt động (`status = 1`, ví dụ bản `v3`). Dùng giá này để hiển thị trên thẻ và làm tiêu chí sắp xếp (`price-asc` / `price-desc`).

---

## 2. Đặc Tả Hai Endpoint Cần Xây Dựng

### 2.1. `GET /api/v1/units/filter-options`
Cung cấp dữ liệu danh mục để Frontend render các dropdown trong Filter Bar (Type, Size).

- **Authentication:** Bearer Token.
- **Request:** Không tham số.
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
Tìm kiếm kho với trạng thái khả dụng và lịch dọn dẹp chính xác.

- **Authentication:** Bearer Token.
- **Query Parameters (kebab-case theo contract):**
  - `type-id` (`Long`, optional): Lọc theo ID loại kho (từ filter-options).
  - `size-m2` (`BigDecimal`, optional): Lọc chính xác diện tích m² (ví dụ: `5.0`).
  - `start-date` (`LocalDate`, format `YYYY-MM-DD`, optional): Ngày khách dự kiến bắt đầu thuê.
  - `duration-months` (`Integer`, min `1`, max `36`, optional): Số tháng dự kiến thuê.
  - `sort` (`String`, default `"price-asc"`, enum: `[price-asc, price-desc]`): Sắp xếp theo giá thuê/tháng.
  - `page` (`Integer`, default `1`, min `1`): Số trang (1-based).
  - `page-size` (`Integer`, default `25`, min `1`, max `100`): Kích thước trang.

- **Response `200 OK` (Schema `UnitPage`):**
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
      "accessType": "QR",
      "baseMonthlyRent": 345000,
      "availability": {
        "status": "AVAILABLE",
        "availableFromDate": null
      },
      "photoUrl": "/units/S-1.jpg"
    },
    {
      "id": 8,
      "code": "M-4",
      "typeName": "M",
      "sizeM2": 8.0,
      "floor": 2,
      "zoneCode": "B",
      "facilityName": "Tân Bình Depot",
      "accessType": "smart lock",
      "baseMonthlyRent": 380000,
      "availability": {
        "status": "AVAILABLE_SOON",
        "availableFromDate": "2026-10-21"
      },
      "photoUrl": "/units/M-4.jpg"
    }
  ],
  "page": 1,
  "pageSize": 25,
  "total": 2
}
```

---

## 3. Thuật Toán Tính Toán Availability & Turnover Buffer (Cốt Lõi Nghiệp Vụ)

### 3.1. Nguyên tắc sàng lọc cơ bản (Base Filtering)
Theo quy định PRD FR-4 và OpenAPI:
- **Loại trừ ngay lập tức các Unit có `status` trong DB là:** `RENTED` (đang có người thuê), `MAINTENANCE` (đang bảo trì sự cố), `RETIRED` (đã loại bỏ khỏi vận hành).
- Các Unit có trạng thái tiềm năng hiển thị cho khách:
  - `AVAILABLE`: Kho đang trống.
  - `PREPARING`: Kho vừa checkout hoặc bảo trì xong, đang trong thời gian dọn dẹp vệ sinh (Turnover Buffer).

### 3.2. Lấy tham số giá và Turnover Buffer từ Active Policy
- Tìm `RentalPolicy` có `status = 1` (phiên bản đang dùng, trong seed là `v3`).
- Với mỗi `unit_type`:
  - `RENT_RATE`: Lấy giá trị tiền thuê tháng (`value` = 100.000 / 345.000 / 380.000 / 890.000) làm `baseMonthlyRent`.
  - `TURNOVER_BUFFER`: Lấy số ngày cần dọn dẹp sau checkout (`value` = 1 ngày trong demo).

### 3.3. Thuật toán kiểm tra khả dụng (Availability Algorithm)

Giả sử khách tìm kiếm với:
- `requestedStartDate` (nếu null -> mặc định là `today = LocalDate.now(ZoneId.of("Asia/Ho_Chi_Minh"))`).
- `durationMonths` (nếu có giá trị $M \ge 1$ -> `requestedEndDate = requestedStartDate.plusMonths(M).minusDays(1)`).

#### Bước 1: Tính ngày hoàn thành chuẩn bị của kho ($D_{ready}$)
1. **Nếu Unit có status `AVAILABLE`:**
   - Kiểm tra xem Unit có vừa mới checkout gần đây hay không. Nếu không có đợt checkout nào đang dính buffer, $D_{ready} = today$.
2. **Nếu Unit có status `PREPARING`:**
   - Kho đang dọn dẹp. Ngày hoàn thành dọn dẹp được tính từ ngày checkout của hợp đồng vừa đóng gần nhất:
     $$D_{ready} = lastClosedReservation.endDate + turnoverBufferDays$$
     *(Hoặc từ `task.workDate` của task `CLEANING` liên quan)*.
   - Ví dụ trong seed: S-3 checkout ngày `2026-10-18`, buffer 1 ngày $\rightarrow$ sẵn sàng ngày `2026-10-19`.

#### Bước 2: Kiểm tra xung đột với các Reservation trong tương lai (Anti-Overlap Guard)
Một kho không thể cho thuê trong khoảng $[Start_{req}, End_{req}]$ nếu nó đã có một `Reservation` khác đã được xác nhận hoặc đang giữ chỗ:
- Xét tất cả Reservation của Unit có trạng thái:
  `PENDING_PAYMENT`, `RESERVED`, `CHECKED_IN`, `CHECKOUT_REQUESTED`.
- Với mỗi reservation $R$, khoảng thời gian chiếm dụng thực tế của nó (gồm cả thời gian dọn dẹp sau khi trả) là:
  $$[R.startDate, R.endDate + turnoverBufferDays]$$
- **Điều kiện xung đột (Overlap):**
  Khoảng $[Start_{req}, End_{req} + turnoverBufferDays]$ bị trùng với $[R.startDate, R.endDate + turnoverBufferDays]$ khi và chỉ khi:
  $$Start_{req} \le (R.endDate + turnoverBufferDays) \quad \text{VÀ} \quad R.startDate \le (End_{req} + turnoverBufferDays)$$
- **Hệ quả:** Nếu có bất kỳ reservation nào xung đột trong khoảng ngày khách muốn thuê $\rightarrow$ **Loại Unit này khỏi danh sách kết quả** (vì khách không thể thuê xuyên qua thời gian đã có người khác đặt).

#### Bước 3: Xác định nhãn hiển thị `AVAILABLE` hay `AVAILABLE_SOON`
Nếu Unit không bị xung đột ở Bước 2:
1. **Trường hợp `requestedStartDate >= D_ready`:**
   - Kho đã sẵn sàng trước hoặc đúng ngày khách cần.
   - `availability.status = "AVAILABLE"`
   - `availability.availableFromDate = null` (hoặc bằng `requestedStartDate`).
   - FE sẽ hiển thị: Dot màu xanh lá + text `"Available {date}"` + nút chính `"Book {code}"`.
2. **Trường hợp `requestedStartDate < D_ready` (Turnover Buffer đang trễ hơn ngày khách muốn):**
   - Kho chưa kịp dọn xong vào ngày khách yêu cầu, nhưng sẽ xong vào ngày $D_{ready}$.
   - Khách vẫn có thể đặt trước (pre-book) bắt đầu từ ngày $D_{ready}$.
   - `availability.status = "AVAILABLE_SOON"`
   - `availability.availableFromDate = D_ready` (chuỗi YYYY-MM-DD).
   - FE sẽ hiển thị: Dot màu cam hổ phách + text `"Available {D_ready} · cleaning buffer"` + nút viền phụ `"Pre-book {code}"` (khớp chính xác Mockup Card 6 của `F1-03-browse-units.html`).

---

## 4. Cấu Trúc File & Mã Nguồn Cần Viết

Các file cần tạo mới nằm trong package `com.storagehub`:

```text
backend/src/main/java/com/storagehub/
├── controller/
│   └── UnitController.java                  <-- Endpoint REST
├── dto/
│   └── unit/
│       ├── UnitFilterOptionsResponse.java   <-- DTO dropdown filter
│       ├── UnitTypeOptionDto.java
│       ├── UnitAvailabilityDto.java         <-- status & availableFromDate
│       ├── UnitSummaryResponse.java         <-- DTO thẻ kho trong lưới
│       └── UnitPageResponse.java            <-- Envelope phân trang AD-8
├── repository/
│   ├── UnitRepository.java                  <-- Query units & distinct sizes
│   ├── UnitTypeRepository.java              <-- Query unit types
│   ├── RentalPolicyRepository.java          <-- Query active policy
│   ├── PolicyRuleRepository.java            <-- Query RENT_RATE & BUFFER
│   └── ReservationRepository.java           <-- Query active reservations
└── service/
    └── UnitService.java                     <-- Logic tính availability & filter
```

---

## 5. Chi Tiết Triển Khai Từng Lớp

### 5.1. Lớp DTO (`com.storagehub.dto.unit`)

#### `UnitTypeOptionDto.java`
```java
package com.storagehub.dto.unit;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class UnitTypeOptionDto {
    private Long id;
    private String name;
}
```

#### `UnitFilterOptionsResponse.java`
```java
package com.storagehub.dto.unit;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class UnitFilterOptionsResponse {
    private List<UnitTypeOptionDto> types;
    private List<BigDecimal> sizesM2;
}
```

#### `UnitAvailabilityDto.java`
```java
package com.storagehub.dto.unit;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class UnitAvailabilityDto {
    /** AVAILABLE hoặc AVAILABLE_SOON */
    private String status;

    /** Ngày sớm nhất có thể thuê nếu vướng buffer (nullable) */
    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd")
    private LocalDate availableFromDate;
}
```

#### `UnitSummaryResponse.java`
```java
package com.storagehub.dto.unit;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UnitSummaryResponse {
    private Long id;
    private String code;
    private String typeName;
    private BigDecimal sizeM2;
    private Integer floor;
    private String zoneCode;
    private String facilityName;
    private String accessType;
    private Long baseMonthlyRent;
    private UnitAvailabilityDto availability;
    private String photoUrl;
}
```

#### `UnitPageResponse.java` (Chuẩn Envelope AD-8)
```java
package com.storagehub.dto.unit;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class UnitPageResponse {
    private List<UnitSummaryResponse> items;
    private Integer page;
    private Integer pageSize;
    private Long total;
}
```

---

### 5.2. Lớp Repository (`com.storagehub.repository`)

#### `UnitTypeRepository.java`
```java
package com.storagehub.repository;

import com.storagehub.entity.UnitType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface UnitTypeRepository extends JpaRepository<UnitType, Integer> {
}
```

#### `RentalPolicyRepository.java`
```java
package com.storagehub.repository;

import com.storagehub.entity.RentalPolicy;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface RentalPolicyRepository extends JpaRepository<RentalPolicy, Integer> {
    /** Tìm chính sách giá đang hoạt động (status = 1) */
    Optional<RentalPolicy> findByStatus(Integer status);
}
```

#### `PolicyRuleRepository.java`
```java
package com.storagehub.repository;

import com.storagehub.entity.PolicyRule;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PolicyRuleRepository extends JpaRepository<PolicyRule, Long> {
    List<PolicyRule> findByPolicy_PolicyId(Integer policyId);
}
```

#### `ReservationRepository.java`
```java
package com.storagehub.repository;

import com.storagehub.entity.Reservation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;

@Repository
public interface ReservationRepository extends JpaRepository<Reservation, Long> {

    /** Lấy các reservation đang hoạt động của danh sách units để kiểm tra overlap */
    @Query("SELECT r FROM Reservation r " +
           "WHERE r.unit.unitId IN :unitIds " +
           "AND r.status IN :activeStatuses")
    List<Reservation> findActiveReservationsForUnits(
            @Param("unitIds") Collection<Long> unitIds,
            @Param("activeStatuses") Collection<Reservation.Status> activeStatuses
    );

    /** Lấy reservation closed gần nhất của unit để tính ngày buffer */
    @Query("SELECT r FROM Reservation r " +
           "WHERE r.unit.unitId = :unitId " +
           "AND r.status = 'CLOSED' " +
           "ORDER BY r.endDate DESC")
    List<Reservation> findLatestClosedReservations(@Param("unitId") Long unitId);
}
```

#### `UnitRepository.java`
```java
package com.storagehub.repository;

import com.storagehub.entity.Unit;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.Collection;
import java.util.List;

@Repository
public interface UnitRepository extends JpaRepository<Unit, Long>, JpaSpecificationExecutor<Unit> {

    /** Lấy danh sách các kích thước m² khác nhau đang có trong hệ thống */
    @Query("SELECT DISTINCT u.sizeM2 FROM Unit u WHERE u.status <> 'RETIRED' ORDER BY u.sizeM2 ASC")
    List<BigDecimal> findDistinctSizesM2();

    /** Lấy candidate units (loại trừ RENTED, MAINTENANCE, RETIRED) */
    @Query("SELECT u FROM Unit u " +
           "JOIN FETCH u.type t " +
           "JOIN FETCH u.zone z " +
           "JOIN FETCH z.facility f " +
           "WHERE u.status IN :candidateStatuses")
    List<Unit> findCandidateUnits(Collection<Unit.Status> candidateStatuses);
}
```

---

### 5.3. Lớp Service (`com.storagehub.service.UnitService`)

Dưới đây là phần triển khai nghiệp vụ hoàn chỉnh của `UnitService`:

```java
package com.storagehub.service;

import com.storagehub.dto.unit.UnitAvailabilityDto;
import com.storagehub.dto.unit.UnitFilterOptionsResponse;
import com.storagehub.dto.unit.UnitPageResponse;
import com.storagehub.dto.unit.UnitSummaryResponse;
import com.storagehub.dto.unit.UnitTypeOptionDto;
import com.storagehub.entity.PolicyRule;
import com.storagehub.entity.RentalPolicy;
import com.storagehub.entity.Reservation;
import com.storagehub.entity.Unit;
import com.storagehub.repository.PolicyRuleRepository;
import com.storagehub.repository.RentalPolicyRepository;
import com.storagehub.repository.ReservationRepository;
import com.storagehub.repository.UnitRepository;
import com.storagehub.repository.UnitTypeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class UnitService {

    private final UnitRepository unitRepository;
    private final UnitTypeRepository unitTypeRepository;
    private final RentalPolicyRepository rentalPolicyRepository;
    private final PolicyRuleRepository policyRuleRepository;
    private final ReservationRepository reservationRepository;

    private static final ZoneId ICT_ZONE = ZoneId.of("Asia/Ho_Chi_Minh");

    /**
     * 1. Lấy dữ liệu dropdown filter bar
     */
    public UnitFilterOptionsResponse getFilterOptions() {
        List<UnitTypeOptionDto> types = unitTypeRepository.findAll().stream()
                .map(t -> new UnitTypeOptionDto(t.getTypeId().longValue(), t.getName()))
                .toList();

        List<BigDecimal> sizesM2 = unitRepository.findDistinctSizesM2();
        return new UnitFilterOptionsResponse(types, sizesM2);
    }

    /**
     * 2. Tìm kiếm kho với availability chính xác
     */
    public UnitPageResponse searchUnits(
            Long typeId,
            BigDecimal sizeM2,
            LocalDate startDate,
            Integer durationMonths,
            String sort,
            Integer page,
            Integer pageSize
    ) {
        // Chuẩn hóa phân trang 1-based (AD-8)
        int validPage = (page == null || page < 1) ? 1 : page;
        int validPageSize = (pageSize == null || pageSize < 1) ? 25 : Math.min(pageSize, 100);
        String validSort = (sort == null || sort.isBlank()) ? "price-asc" : sort;

        LocalDate today = LocalDate.now(ICT_ZONE);
        LocalDate queryStartDate = (startDate != null) ? startDate : today;
        int duration = (durationMonths != null && durationMonths >= 1) ? durationMonths : 1;
        LocalDate queryEndDate = queryStartDate.plusMonths(duration).minusDays(1);

        // Lấy active policy (status = 1) để trích xuất base rent và turnover buffer
        RentalPolicy activePolicy = rentalPolicyRepository.findByStatus(1)
                .orElseThrow(() -> new IllegalStateException("Hệ thống chưa cấu hình chính sách giá hoạt động"));

        List<PolicyRule> rules = policyRuleRepository.findByPolicy_PolicyId(activePolicy.getPolicyId());

        // Map: TypeId -> BaseMonthlyRent
        Map<Integer, Long> rentRateMap = new HashMap<>();
        // Map: TypeId -> TurnoverBufferDays
        Map<Integer, Integer> bufferDaysMap = new HashMap<>();

        for (PolicyRule r : rules) {
            Integer tId = r.getType().getTypeId();
            if (r.getRuleType() == PolicyRule.RuleType.RENT_RATE) {
                rentRateMap.put(tId, r.getValue().longValue());
            } else if (r.getRuleType() == PolicyRule.RuleType.TURNOVER_BUFFER) {
                bufferDaysMap.put(tId, r.getValue().intValue());
            }
        }

        // Ứng viên: Loại trừ RENTED, MAINTENANCE, RETIRED (PRD FR-4 & OpenAPI)
        List<Unit.Status> candidateStatuses = List.of(Unit.Status.AVAILABLE, Unit.Status.PREPARING);
        List<Unit> candidates = unitRepository.findCandidateUnits(candidateStatuses);

        // Lọc theo typeId và sizeM2 nếu có
        List<Unit> filteredUnits = candidates.stream()
                .filter(u -> typeId == null || u.getType().getTypeId().longValue() == typeId)
                .filter(u -> sizeM2 == null || u.getSizeM2().compareTo(sizeM2) == 0)
                .toList();

        if (filteredUnits.isEmpty()) {
            return new UnitPageResponse(List.of(), validPage, validPageSize, 0L);
        }

        List<Long> unitIds = filteredUnits.stream().map(Unit::getUnitId).toList();

        // Lấy tất cả reservation đang active của các unit này
        Set<Reservation.Status> activeReservationStatuses = Set.of(
                Reservation.Status.PENDING_PAYMENT,
                Reservation.Status.RESERVED,
                Reservation.Status.CHECKED_IN,
                Reservation.Status.CHECKOUT_REQUESTED
        );
        List<Reservation> activeReservations = reservationRepository.findActiveReservationsForUnits(
                unitIds, activeReservationStatuses
        );

        Map<Long, List<Reservation>> reservationsByUnit = activeReservations.stream()
                .collect(Collectors.groupingBy(r -> r.getUnit().getUnitId()));

        List<UnitSummaryResponse> resultItems = new ArrayList<>();

        for (Unit unit : filteredUnits) {
            Integer typeIdVal = unit.getType().getTypeId();
            int bufferDays = bufferDaysMap.getOrDefault(typeIdVal, 1);
            long monthlyRent = rentRateMap.getOrDefault(typeIdVal, 0L);

            // 1. Kiểm tra ngày hoàn thành chuẩn bị của kho
            LocalDate readyDate = today;
            if (unit.getStatus() == Unit.Status.PREPARING) {
                List<Reservation> closedList = reservationRepository.findLatestClosedReservations(unit.getUnitId());
                if (!closedList.isEmpty()) {
                    readyDate = closedList.get(0).getEndDate().plusDays(bufferDays);
                } else {
                    readyDate = today.plusDays(bufferDays);
                }
            }

            // 2. Kiểm tra xung đột với reservation trong tương lai
            List<Reservation> unitReservations = reservationsByUnit.getOrDefault(unit.getUnitId(), List.of());
            boolean hasOverlap = false;

            for (Reservation res : unitReservations) {
                LocalDate resEffectiveEnd = res.getEndDate().plusDays(bufferDays);
                LocalDate reqEffectiveEnd = queryEndDate.plusDays(bufferDays);

                // Overlap: Start1 <= End2 && Start2 <= End1
                if (!queryStartDate.isAfter(resEffectiveEnd) && !res.getStartDate().isAfter(reqEffectiveEnd)) {
                    hasOverlap = true;
                    break;
                }
            }

            // Nếu xung đột khoảng ngày đặt -> Loại kho này
            if (hasOverlap) {
                continue;
            }

            // 3. Xác định availability status
            UnitAvailabilityDto availability;
            if (queryStartDate.isBefore(readyDate)) {
                // Đang trong buffer, ngày sớm nhất thuê được là readyDate
                availability = new UnitAvailabilityDto("AVAILABLE_SOON", readyDate);
            } else {
                availability = new UnitAvailabilityDto("AVAILABLE", null);
            }

            UnitSummaryResponse summary = UnitSummaryResponse.builder()
                    .id(unit.getUnitId())
                    .code(unit.getCode())
                    .typeName(unit.getType().getName())
                    .sizeM2(unit.getSizeM2())
                    .floor(unit.getFloor())
                    .zoneCode(unit.getZone().getCode())
                    .facilityName(unit.getZone().getFacility().getName())
                    .accessType(unit.getAccessType())
                    .baseMonthlyRent(monthlyRent)
                    .availability(availability)
                    .photoUrl("/units/" + unit.getCode() + ".jpg")
                    .build();

            resultItems.add(summary);
        }

        // Sắp xếp theo giá (AD-8 & contract)
        if ("price-desc".equalsIgnoreCase(validSort)) {
            resultItems.sort(Comparator.comparing(UnitSummaryResponse::getBaseMonthlyRent).reversed()
                    .thenComparing(UnitSummaryResponse::getCode));
        } else {
            resultItems.sort(Comparator.comparing(UnitSummaryResponse::getBaseMonthlyRent)
                    .thenComparing(UnitSummaryResponse::getCode));
        }

        // Phân trang offset 1-based (AD-8)
        long total = resultItems.size();
        int fromIndex = (validPage - 1) * validPageSize;
        List<UnitSummaryResponse> pagedItems;

        if (fromIndex >= total) {
            pagedItems = List.of();
        } else {
            int toIndex = Math.min(fromIndex + validPageSize, (int) total);
            pagedItems = resultItems.subList(fromIndex, toIndex);
        }

        return new UnitPageResponse(pagedItems, validPage, validPageSize, total);
    }
}
```

---

### 5.4. Lớp Controller (`com.storagehub.controller.UnitController`)

```java
package com.storagehub.controller;

import com.storagehub.dto.unit.UnitFilterOptionsResponse;
import com.storagehub.dto.unit.UnitPageResponse;
import com.storagehub.service.UnitService;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.math.BigDecimal;
import java.time.LocalDate;

@Validated
@RestController
@RequestMapping("/api/v1/units")
@RequiredArgsConstructor
public class UnitController {

    private final UnitService unitService;

    @GetMapping("/filter-options")
    public ResponseEntity<UnitFilterOptionsResponse> getFilterOptions() {
        return ResponseEntity.ok(unitService.getFilterOptions());
    }

    @GetMapping
    public ResponseEntity<UnitPageResponse> searchUnits(
            @RequestParam(name = "type-id", required = false) Long typeId,
            @RequestParam(name = "size-m2", required = false) BigDecimal sizeM2,
            @RequestParam(name = "start-date", required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(name = "duration-months", required = false)
            @Min(value = 1, message = "Thời hạn thuê tối thiểu 1 tháng")
            @Max(value = 36, message = "Thời hạn thuê tối đa 36 tháng") Integer durationMonths,
            @RequestParam(name = "sort", defaultValue = "price-asc") String sort,
            @RequestParam(name = "page", defaultValue = "1")
            @Min(value = 1, message = "Trang phải từ 1 trở lên") Integer page,
            @RequestParam(name = "page-size", defaultValue = "25")
            @Min(value = 1) @Max(value = 100) Integer pageSize
    ) {
        UnitPageResponse response = unitService.searchUnits(
                typeId,
                sizeM2,
                startDate,
                durationMonths,
                sort,
                page,
                pageSize
        );
        return ResponseEntity.ok(response);
    }
}
```

---

## 6. Kiểm Thử & Đối Chiếu Seed Data Chuẩn (Verification Checklist)

Khi khởi động ứng dụng với profile `dev` (`mvn spring-boot:run -Dspring.profiles.active=dev`), Flyway sẽ chạy migration `V1` và seed `V2`. Hãy kiểm tra các kịch bản sau:

| STT | Kịch bản kiểm thử | Kỳ vọng API trả về |
|:---|:---|:---|
| 1 | `GET /api/v1/units/filter-options` | Trả về 4 loại kho (Locker, S, M, L) và mảng kích thước `[1.50, 5.00, 8.00, 15.00]`. |
| 2 | `GET /api/v1/units` (không param) | Không chứa `S-3` (RENTED), `M-2` (RENTED), `L-2` (MAINTENANCE), `LOCK-4` (RETIRED). |
| 3 | Lưới trả về kho `M-4` (đang PREPARING) | `availability.status = "AVAILABLE_SOON"`, `availableFromDate` hiển thị ngày sau khi kết thúc buffer dọn dẹp. |
| 4 | Lưới trả về kho `S-1`, `S-2` (đang AVAILABLE) | `availability.status = "AVAILABLE"`, `availableFromDate = null`. |
| 5 | Lọc `start-date=2026-10-19` trên kho `S-3` | `S-3` đang có `BK-1044` thuê từ `2026-10-19` đến `2026-12-19` $\rightarrow$ `S-3` bị loại khỏi kết quả (không bị double-booking). |
| 6 | Sort `sort=price-asc` | Giá tăng dần: Locker (100.000) $\rightarrow$ S (345.000) $\rightarrow$ M (380.000) $\rightarrow$ L (890.000). |
| 7 | Sort `sort=price-desc` | Giá giảm dần từ L (890.000) xuống Locker (100.000). |
| 8 | Truy cập không có Bearer token | Trả về `401 Unauthorized` đúng chuẩn Error envelope (`AUTH_TOKEN_INVALID`). |

---

## 7. Các Lưu Ý Kỹ Thuật Khi Tích Hợp Sprint Tiếp Theo

1. **FR-5 (Reserve re-check chống stale):** Khi khách bấm nút Reserve ở Booking Summary (`POST /api/v1/reservations`), `ReservationService` phải gọi lại chính logic kiểm tra overlap của `UnitService` trong transaction có optimistic lock (`lockVersion` trên entity `Unit`). Nếu phát hiện kho vừa bị khách khác đặt $\rightarrow$ bắn mã lỗi `409 BOOKING_UNIT_TAKEN`.
2. **Ảnh tĩnh của kho (`photoUrl`):** Theo AD-6 delta, backend trả đường dẫn tương đối `/units/{code}.jpg` (ví dụ `/units/S-1.jpg`). Frontend React Vite sẽ phục vụ ảnh tĩnh này từ thư mục `frontend/public/units/`.
3. **Múi giờ:** Luôn quy đổi thời gian về `Asia/Ho_Chi_Minh` khi tính ngày nghiệp vụ (`LocalDate`). Timestamp lưu DB ở dạng UTC (`Instant` / `LocalDateTime`).
