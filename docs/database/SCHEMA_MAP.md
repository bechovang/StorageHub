# STORAGEHUB DATABASE SCHEMA & MIGRATION MAP

> **Single Source of Truth** cho Cơ Sở Dữ Liệu PostgreSQL / H2 của StorageHub.
> Trạng thái Migration hiện tại: **V52** (`V52__late_fee_percent_policy.sql`).
> AI Agent **BẮT BUỘC** phải tra cứu tệp này để biết chính xác tên bảng, tên cột, kiểu dữ liệu và giá trị Enum trước khi viết query, migration SQL hay JPA Repository.

---

## 1. Danh Sách Enums Chuẩn Hệ Thống

| Tên Enum | Vị Trí Lưu Trữ | Các Giá Trị Hợp Lệ (Chuỗi UPPER_SNAKE) |
| :--- | :--- | :--- |
| **`Role.Name`** | `roles.name` | `CUSTOMER`, `STAFF`, `FACILITY_MANAGER`, `BUSINESS_OPS`, `SYSTEM_ADMIN` |
| **`Unit.Status`** | `units.status` | `AVAILABLE`, `RESERVED`, `OCCUPIED`, `MAINTENANCE`, `OVERDUE`, `LOCKED` |
| **`Reservation.Status`**| `reservations.status` | `PENDING_PAYMENT`, `ACTIVE`, `OVERDUE`, `CHECKED_OUT`, `CANCELLED` |
| **`Payment.Status`** | `payments.status` | `PENDING`, `COMPLETED`, `FAILED`, `CANCELLED`, `REFUNDED` |
| **`Payment.Method`** | `payments.method` | `PAYOS`, `VNPAY`, `MOMO`, `BANK_TRANSFER`, `CASH` |
| **`Task.Type`** | `tasks.type` | `CHECK_IN`, `CHECK_OUT`, `INSPECTION`, `MAINTENANCE`, `SUPPORT`, `RELOCATION` |
| **`Task.Status`** | `tasks.status` | `PENDING`, `IN_PROGRESS`, `COMPLETED`, `CANCELLED` |
| **`Ticket.Status`** | `support_tickets.status` | `OPEN`, `IN_PROGRESS`, `RESOLVED`, `CLOSED` |
| **`Ticket.Priority`** | `support_tickets.priority` | `LOW`, `MEDIUM`, `HIGH`, `CRITICAL` |
| **`LateCheckoutCase.Status`** | `late_checkout_cases.status` | `LATE`, `PENDING_MANAGER`, `EXTENDED`, `RESOLVED`, `LIQUIDATED` |
| **`LateCheckoutCase.Decision`** | `late_checkout_cases.decision` | `EXTEND`, `LIQUIDATE` |

---

## 2. Bảng Dữ Liệu Cốt Lõi (Core Tables)

### 🏢 2.1. Quản Lý Cơ Sở & Không Gian
```sql
-- Cơ sở kho bãi (3 cơ sở hiện tại)
facilities (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL, -- 'TB' (Tân Bình), 'TD' (Thủ Đức), 'BT' (Bình Thạnh)
    address TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Phân khu trong cơ sở
zones (
    id SERIAL PRIMARY KEY,
    facility_id INT NOT NULL REFERENCES facilities(id),
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) NOT NULL,         -- '1A', '1B', 'PORT', 'RACK-A',...
    floor INT DEFAULT 1,
    type_id INT REFERENCES unit_types(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Loại hình kho
unit_types (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,        -- 'Kho tiêu chuẩn', 'Kho lạnh', 'Kho pallet hàng nặng', 'Kho hút ẩm', 'Kho cấp đông'
    description TEXT,
    base_price_monthly NUMERIC(15, 2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Ô kho chi tiết
units (
    id SERIAL PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,  -- 'TB-1A-01', 'TD-PORT-01', 'BT-1A-01'
    facility_id INT NOT NULL REFERENCES facilities(id),
    zone_id INT NOT NULL REFERENCES zones(id),
    type_id INT NOT NULL REFERENCES unit_types(id),
    status VARCHAR(50) NOT NULL,       -- AVAILABLE, OCCUPIED, MAINTENANCE,...
    size_m2 NUMERIC(8, 2) NOT NULL,
    floor INT DEFAULT 1,
    grid_row INT DEFAULT 1,
    grid_col INT DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

### 👤 2.2. Tài Khoản & Phân Ca
```sql
users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    role_id INT NOT NULL REFERENCES roles(id),
    facility_id INT REFERENCES facilities(id), -- NULL nếu là System Admin / Customer
    status VARCHAR(50) DEFAULT 'ACTIVE',       -- ACTIVE, SUSPENDED, DELETED
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

staff_assignments (
    id SERIAL PRIMARY KEY,
    staff_id INT NOT NULL REFERENCES users(id),
    facility_id INT NOT NULL REFERENCES facilities(id),
    shift_date DATE NOT NULL,
    shift_type VARCHAR(50) NOT NULL, -- 'MORNING', 'AFTERNOON', 'NIGHT', 'FULL_DAY'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

### 📑 2.3. Hợp Đồng, Đặt Chỗ & Thanh Toán
```sql
reservations (
    id SERIAL PRIMARY KEY,
    customer_id INT NOT NULL REFERENCES users(id),
    unit_id INT NOT NULL REFERENCES units(id),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status VARCHAR(50) NOT NULL,          -- PENDING_PAYMENT, ACTIVE, OVERDUE, CHECKED_OUT
    closed_at DATETIME(6),                -- V46: thời điểm đóng hợp đồng
    monthly_rate NUMERIC(15, 2) NOT NULL,
    deposit_amount NUMERIC(15, 2) NOT NULL,
    total_amount NUMERIC(15, 2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

contracts (
    id SERIAL PRIMARY KEY,
    reservation_id INT NOT NULL REFERENCES reservations(id),
    contract_number VARCHAR(100) UNIQUE NOT NULL,
    terms_text TEXT,
    signed_at TIMESTAMP,
    status VARCHAR(50) DEFAULT 'ACTIVE',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

contract_addendums (
    id SERIAL PRIMARY KEY,
    contract_id INT NOT NULL REFERENCES contracts(id),
    addendum_type VARCHAR(50) NOT NULL, -- 'EXTENSION', 'TRANSFER', 'PRICE_ADJUST'
    content TEXT,
    is_signed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

payments (
    id SERIAL PRIMARY KEY,
    reservation_id INT NOT NULL REFERENCES reservations(id),
    amount NUMERIC(15, 2) NOT NULL,
    payment_type VARCHAR(50) NOT NULL, -- 'RENTAL', 'DEPOSIT', 'EXTENSION', 'SETTLEMENT'
    payment_method VARCHAR(50) NOT NULL,
    status VARCHAR(50) NOT NULL,        -- PENDING, COMPLETED, FAILED
    transaction_code VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

checkout_requests (
    id SERIAL PRIMARY KEY,
    reservation_id INT NOT NULL REFERENCES reservations(id),
    expected_checkout_date DATE NOT NULL,
    time_slot VARCHAR(50),              -- 'MORNING' (08:00 - 12:00), 'AFTERNOON' (13:00 - 17:00)
    status VARCHAR(50) NOT NULL,        -- 'PENDING', 'APPROVED', 'COMPLETED', 'REJECTED'
    reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- V46: Quyết định gia hạn / thanh lý của quản lý cơ sở khi khách trễ hạn
late_checkout_cases (
    case_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    reservation_id BIGINT NOT NULL UNIQUE REFERENCES reservations(id),
    status VARCHAR(30) NOT NULL,        -- LATE, PENDING_MANAGER, EXTENDED, RESOLVED, LIQUIDATED
    decision VARCHAR(20),               -- EXTEND, LIQUIDATE
    days_late INT NOT NULL DEFAULT 0,
    accrued_fee NUMERIC(15, 0) NOT NULL DEFAULT 0,
    escalation_count INT NOT NULL DEFAULT 0,
    manager_id BIGINT REFERENCES users(id),
    extension_days INT,
    extended_until DATE,
    reason VARCHAR(1000),
    settlement_id BIGINT REFERENCES settlements(id),
    created_at DATETIME(6) DEFAULT CURRENT_TIMESTAMP(6),
    updated_at DATETIME(6),
    decided_at DATETIME(6)
);

-- Quyết toán hoàn cọc, phụ phí & thanh lý
settlements (
    settlement_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    reservation_id BIGINT NOT NULL REFERENCES reservations(id),
    damage_fee NUMERIC(15, 2) DEFAULT 0,
    damage_reason TEXT,
    late_days INT NOT NULL DEFAULT 0,   -- V46
    late_fee NUMERIC(15, 0) DEFAULT 0,  -- V46
    settlement_type VARCHAR(20) DEFAULT 'NORMAL', -- 'NORMAL', 'LIQUIDATION' (V46)
    liquidation_reason VARCHAR(30),     -- V46
    note VARCHAR(500),                  -- V46
    refund_amount NUMERIC(15, 2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

### 🛠 2.4. Tác Vụ Nhân Viên, Sự Cố & Hỗ Trợ
```sql
tasks (
    id SERIAL PRIMARY KEY,
    facility_id INT NOT NULL REFERENCES facilities(id),
    unit_id INT REFERENCES units(id),
    reservation_id INT REFERENCES reservations(id),
    assigned_to INT REFERENCES users(id),
    task_type VARCHAR(50) NOT NULL,     -- 'CHECK_IN', 'CHECK_OUT', 'INSPECTION', 'SUPPORT'
    status VARCHAR(50) NOT NULL,        -- 'PENDING', 'IN_PROGRESS', 'COMPLETED'
    title VARCHAR(255) NOT NULL,
    note TEXT,
    completed_at DATETIME(6),           -- V50: thời điểm hoàn thành
    completed_by BIGINT REFERENCES users(id), -- V50: nhân viên hoàn thành
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

support_tickets (
    id SERIAL PRIMARY KEY,
    customer_id INT NOT NULL REFERENCES users(id),
    unit_id INT REFERENCES units(id),
    facility_id INT NOT NULL REFERENCES facilities(id),
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    priority VARCHAR(50) NOT NULL,      -- 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'
    status VARCHAR(50) NOT NULL,        -- 'OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'
    assigned_to INT REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Audit trail hệ thống (V47: phân quyền theo facility_id)
activity_logs (
    log_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    actor_id BIGINT REFERENCES users(id),
    facility_id INT REFERENCES facilities(id), -- V47: NULL = toàn hệ thống
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id BIGINT NOT NULL,
    details TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

### ⚖️ 2.5. Chính Sách Giá & Quy Tắc Vận Hành (V51 & V52 Scope)
- **`RENT_RATE`**: Áp dụng riêng theo từng cơ sở (`facility_id NOT NULL`).
- **Các rule vận hành (Global - `facility_id IS NULL`)**:
  - `CHECKIN_LATE_FEE_PERCENT` (300% giá ngày)
  - `EXTENSION_LATE_FEE_PERCENT` (300% giá ngày)
  - `LATE_FEE_PERCENT` (300% giá ngày)
  - `LATE_ESCALATION_DAYS` (3 ngày trễ chuyển Manager)
  - `DAMAGE_DEPOSIT_MULTIPLIER`, `BUFFER_DAYS`, `GRACE_PERIOD_DAYS`.
```
