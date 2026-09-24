-- ============================================================================
-- StorageHub — Flyway V1 — toàn bộ model V3 (22 bảng, 31 quan hệ)
-- Nguồn: docs/models/ERD_StorageHub.dbml (V3 2026-09-18)
--        + docs/architecture/ARCHITECTURE-SPINE.md (AD-6, AD-7)
--
-- Quy ước (chốt 2026-09-23):
--   * Cột snake_case (user_id) — ánh xạ 1-1 field camelCase của JPA theo
--     naming strategy mặc định Spring Boot (CamelCaseToUnderscores), khỏi
--     @Column tay. Quy tắc đối chiếu ERD → DB: PascalCase bỏ sang
--     snake_case, giữ nguyên tên ngữ nghĩa của FK:
--     UserID→user_id, CustomerID→customer_id, PayerID→payer_id,
--     ActorID→actor_id, AssignedStaffID→assigned_staff_id,
--     MergedIntoID→merged_into_id, SupersedesContractID→supersedes_contract_id.
--   * Tên bảng lowercase số nhiều (users, reservations) — entity JPA khai
--     @Table(name = "users") vì strategy mặc định chỉ sinh số ít.
--   * Enum = VARCHAR(30) thuần, KHÔNG CHECK trên giá trị — validate ở
--     service (JPA @Enumerated(EnumType.STRING)).
--   * Tiền VND = DECIMAL(15,0) (AD-7 — ghi đè DECIMAL(18,2) của ERD).
--   * Ngày nghiệp vụ = DATE (ngữ nghĩa ICT); timestamp = DATETIME(6) UTC,
--     do app ghi (AD-7).
--   * FK toàn bộ ON DELETE RESTRICT — dữ liệu nghiệp vụ không xóa cứng.
--   * Charset utf8mb4 / utf8mb4_0900_ai_ci từng bảng.
--
-- Deltas so với dbml V3 (AD-6 chốt 2026-09-22 + 4 quyết định 2026-09-23):
--   1. Mọi cột tiền DECIMAL(15,0).
--   2. contracts: nới 1-1 thành 1-N mỗi reservation qua
--      supersedes_contract_id + is_latest; enforce "đúng 1 bản latest" bằng
--      latest_key (generated column) UNIQUE — MySQL không có partial index.
--   3. policy_rules.rule_type thêm TURNOVER_BUFFER / DISCOUNT / WAIVER_CAP.
--   4. users.facility_id nullable (scoping đa facility cho FM).
--   5. notifications.created_at (UX group theo ngày).
--   6. escalations.ticket_id giữ UNIQUE — mỗi ticket escalate đúng 1 lần.
--   7. contract_addendums.code UNIQUE (CT-2026-0001-A1).
--   8. created_at trên mọi bảng giao dịch + activity_logs (FR-31/32 báo cáo
--      theo kỳ cần mốc thời gian).
--   9. units.lock_version — optimistic lock chống double-booking FR-5
--      (overlap range không thể unique trên MySQL).
--  10. Reference data: roles = 5 dòng, gồm SYSTEM_ADMIN (PRD FR-37..41).
--
-- Lưu ý: database/schema do môi trường tạo (local/docker); Flyway owns DDL.
-- Seed demo (Lan/Minh/Hằng/Tuấn/Nam, BK-1042, policy v3...) = V2__seed_demo,
-- đặt ở db/seed, chỉ chạy profile dev.
-- ============================================================================

-- ------------------------------------------- NHÓM 1: NGƯỜI DÙNG & CƠ SỞ ----

-- 4+1 vai trò (CUSTOMER / STAFF / FACILITY_MANAGER / BUSINESS_OPS /
-- SYSTEM_ADMIN) — name là tên máy UPPER_SNAKE, khớp JWT claim (AD-5)
CREATE TABLE roles (
    role_id     INT          NOT NULL AUTO_INCREMENT,
    name        VARCHAR(50)  NOT NULL,
    description VARCHAR(200) NULL,
    PRIMARY KEY (role_id),
    UNIQUE KEY uk_roles_name (name)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci;

CREATE TABLE facilities (
    facility_id INT          NOT NULL AUTO_INCREMENT,
    name        VARCHAR(100) NOT NULL,
    address     VARCHAR(255) NOT NULL,
    phone       VARCHAR(20)  NULL,
    status      TINYINT      NOT NULL DEFAULT 1, -- 0=đóng cửa, 1=hoạt động
    PRIMARY KEY (facility_id)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci;

-- Bản ghi trung tâm dùng chung 5 vai trò; status 2 = khoá tài khoản (AD-5)
CREATE TABLE users (
    user_id       BIGINT       NOT NULL AUTO_INCREMENT,
    full_name     VARCHAR(100) NOT NULL,
    email         VARCHAR(100) NOT NULL,
    phone         VARCHAR(20)  NULL,
    password_hash VARCHAR(255) NOT NULL,
    role_id       INT          NOT NULL,
    facility_id   INT          NULL, -- delta 4: nullable — demo 1 facility
    status        TINYINT      NOT NULL DEFAULT 1, -- 0=off, 1=active, 2=locked
    created_at    DATETIME(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6), -- UTC
    PRIMARY KEY (user_id),
    UNIQUE KEY uk_users_email (email),
    KEY idx_users_facility (facility_id),
    CONSTRAINT fk_users_role     FOREIGN KEY (role_id)     REFERENCES roles (role_id),
    CONSTRAINT fk_users_facility FOREIGN KEY (facility_id) REFERENCES facilities (facility_id)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci;

CREATE TABLE zones (
    zone_id     INT         NOT NULL AUTO_INCREMENT,
    facility_id INT         NOT NULL,
    code        VARCHAR(20) NOT NULL, -- A/B/C...
    floor       INT         NOT NULL,
    PRIMARY KEY (zone_id),
    UNIQUE KEY uk_zones_facility_code (facility_id, code),
    CONSTRAINT fk_zones_facility FOREIGN KEY (facility_id) REFERENCES facilities (facility_id)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci;

-- Lịch trực theo ngày + ca + zone
CREATE TABLE staff_assignments (
    assignment_id BIGINT      NOT NULL AUTO_INCREMENT,
    staff_id      BIGINT      NOT NULL,
    zone_id       INT         NOT NULL,
    shift         VARCHAR(30) NOT NULL, -- MORNING / AFTERNOON / EVENING
    work_date     DATE        NOT NULL, -- ICT
    created_at    DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    PRIMARY KEY (assignment_id),
    UNIQUE KEY uk_staff_assignments_staff_date_shift (staff_id, work_date, shift),
    KEY idx_staff_assignments_zone_date_shift (zone_id, work_date, shift), -- định tuyến ticket
    CONSTRAINT fk_staff_assignments_staff FOREIGN KEY (staff_id) REFERENCES users (user_id),
    CONSTRAINT fk_staff_assignments_zone  FOREIGN KEY (zone_id)  REFERENCES zones (zone_id)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci;

-- ------------------------------------ NHÓM 2: KHO & ĐƠN VỊ LƯU TRỮ ----

CREATE TABLE unit_types (
    type_id     INT          NOT NULL AUTO_INCREMENT,
    name        VARCHAR(50)  NOT NULL, -- Locker, S, M, L...
    description VARCHAR(200) NULL,
    PRIMARY KEY (type_id),
    UNIQUE KEY uk_unit_types_name (name)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci;

-- Thực thể nghiệp vụ trung tâm; buffer "available soon" là trạng thái suy
-- dẫn on-read (AD-4) — không lưu cột
CREATE TABLE units (
    unit_id        BIGINT        NOT NULL AUTO_INCREMENT,
    code           VARCHAR(20)   NOT NULL,
    type_id        INT           NOT NULL,
    zone_id        INT           NOT NULL,
    size_m2        DECIMAL(6, 2) NOT NULL,
    floor          INT           NOT NULL,
    access_type    VARCHAR(20)   NOT NULL, -- PIN / QR / smart lock
    status         VARCHAR(30)   NOT NULL, -- AVAILABLE / RESERVED / RENTED / PREPARING / MAINTENANCE / RETIRED
    merged_into_id BIGINT        NULL,     -- merge 2 unit liền kề: unit cũ RETIRED trỏ sang unit mới
    lock_version   INT           NOT NULL DEFAULT 0, -- delta 9: optimistic lock FR-5
    PRIMARY KEY (unit_id),
    UNIQUE KEY uk_units_code (code),
    KEY idx_units_zone_status (zone_id, status),
    KEY idx_units_type (type_id),
    CONSTRAINT fk_units_type   FOREIGN KEY (type_id)        REFERENCES unit_types (type_id),
    CONSTRAINT fk_units_zone   FOREIGN KEY (zone_id)        REFERENCES zones (zone_id),
    CONSTRAINT fk_units_merged FOREIGN KEY (merged_into_id) REFERENCES units (unit_id)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci;

-- -------------------------------------------- NHÓM 3: CHÍNH SÁCH GIÁ ----

-- Chính sách theo phiên bản có ngày hiệu lực; contract snapshot policy_id
CREATE TABLE rental_policies (
    policy_id      INT         NOT NULL AUTO_INCREMENT,
    version        VARCHAR(20) NOT NULL,
    effective_date DATE        NOT NULL,
    status         TINYINT     NOT NULL DEFAULT 0, -- 0=nháp, 1=đang dùng, 2=ngừng
    PRIMARY KEY (policy_id),
    UNIQUE KEY uk_rental_policies_version (version)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci;

-- rule_type: DEPOSIT_RATE / RENT_RATE / LATE_FEE / SURCHARGE
--          + TURNOVER_BUFFER / DISCOUNT / WAIVER_CAP (delta 3, FR-40/41)
-- surcharge_type: PERCENT / FIXED (chỉ áp dụng cho SURCHARGE)
CREATE TABLE policy_rules (
    rule_id        BIGINT        NOT NULL AUTO_INCREMENT,
    policy_id      INT           NOT NULL,
    type_id        INT           NOT NULL,
    rule_type      VARCHAR(30)   NOT NULL,
    surcharge_type VARCHAR(10)   NULL,
    value          DECIMAL(15,0) NOT NULL,
    cap            DECIMAL(15,0) NULL, -- trần phụ thu
    PRIMARY KEY (rule_id),
    KEY idx_policy_rules_policy_type (policy_id, type_id),
    CONSTRAINT fk_policy_rules_policy FOREIGN KEY (policy_id) REFERENCES rental_policies (policy_id),
    CONSTRAINT fk_policy_rules_type   FOREIGN KEY (type_id)   REFERENCES unit_types (type_id)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci;

-- -------------------------------------- NHÓM 4: ĐẶT CHỖ & THUÊ (BK-) ----

-- V3: 1 bản ghi trọn vòng đời đặt chỗ → thuê → trả; CHECKED_IN = "đang thuê"
-- status: PENDING_PAYMENT / RESERVED / CHECKED_IN / CHECKOUT_REQUESTED /
--         CLOSED / EXPIRED / CANCELLED (dự phòng, v1 không kích hoạt)
-- EXPIRED là trạng thái suy diễn on-read (AD-4)
CREATE TABLE reservations (
    reservation_id BIGINT        NOT NULL AUTO_INCREMENT,
    code           VARCHAR(20)   NOT NULL, -- BK-2026-0001 — duy nhất suốt vòng đời
    customer_id    BIGINT        NOT NULL,
    unit_id        BIGINT        NOT NULL,
    start_date     DATE          NOT NULL, -- đã cộng turnover buffer
    end_date       DATE          NOT NULL, -- dịch ngay khi phí gia hạn được thanh toán
    deposit_amount DECIMAL(15,0) NOT NULL, -- cọc 10% giữ suốt phiên
    access_code    VARCHAR(10)   NULL,     -- cấp khi check-in (sensitive — AD-5)
    status         VARCHAR(30)   NOT NULL,
    created_at     DATETIME(6)   NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    PRIMARY KEY (reservation_id),
    UNIQUE KEY uk_reservations_code (code),
    KEY idx_reservations_unit_status (unit_id, status),
    KEY idx_reservations_customer_status (customer_id, status),
    CONSTRAINT fk_reservations_customer FOREIGN KEY (customer_id) REFERENCES users (user_id),
    CONSTRAINT fk_reservations_unit     FOREIGN KEY (unit_id)     REFERENCES units (unit_id),
    CONSTRAINT chk_reservations_dates CHECK (end_date >= start_date)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci;

-- Chuỗi kiểm toán mỗi lần gia hạn; căn cứ sinh phụ lục
CREATE TABLE extensions (
    extension_id   BIGINT        NOT NULL AUTO_INCREMENT,
    reservation_id BIGINT        NOT NULL,
    old_end_date   DATE          NOT NULL,
    new_end_date   DATE          NOT NULL,
    extension_fee  DECIMAL(15,0) NOT NULL,
    status         VARCHAR(30)   NOT NULL, -- PENDING_PAYMENT / APPLIED
    created_at     DATETIME(6)   NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    PRIMARY KEY (extension_id),
    CONSTRAINT fk_extensions_reservation FOREIGN KEY (reservation_id) REFERENCES reservations (reservation_id),
    CONSTRAINT chk_extensions_dates CHECK (new_end_date > old_end_date)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci;

-- Ngày trả mới nhất luôn thắng ("latest new checkout")
CREATE TABLE checkout_requests (
    request_id     BIGINT      NOT NULL AUTO_INCREMENT,
    reservation_id BIGINT      NOT NULL,
    requested_date DATE        NOT NULL,
    status         VARCHAR(30) NOT NULL, -- PENDING / DONE
    created_at     DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    PRIMARY KEY (request_id),
    KEY idx_checkout_requests_reservation_date (reservation_id, requested_date),
    CONSTRAINT fk_checkout_requests_reservation FOREIGN KEY (reservation_id) REFERENCES reservations (reservation_id)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci;

-- ------------------------------- NHÓM 5: HỢP ĐỒNG & PHỤ LỤC (CT-) ----

-- V1 delta 2: 1-N mỗi reservation (re-draft FR-10). "Đúng một hợp đồng gốc"
-- = đúng một bản is_latest — enforce bằng latest_key UNIQUE
-- status: DRAFT / PRINTED / SIGNED / ACTIVE / CLOSED / SUPERSEDED
CREATE TABLE contracts (
    contract_id            BIGINT       NOT NULL AUTO_INCREMENT,
    code                   VARCHAR(20)  NOT NULL, -- CT-2026-0001
    reservation_id         BIGINT       NOT NULL,
    policy_id              INT          NOT NULL, -- khoá phiên bản policy khi draft
    content_snapshot       TEXT         NOT NULL, -- không bao giờ bị sửa
    signed_photo_url       VARCHAR(255) NULL,     -- API path tương đối (AD-10)
    status                 VARCHAR(30)  NOT NULL,
    supersedes_contract_id BIGINT       NULL,     -- bản thay thế: flip SUPERSEDED khi bản mới sinh
    is_latest              TINYINT(1)   NOT NULL DEFAULT 1,
    latest_key             BIGINT       GENERATED ALWAYS AS (CASE WHEN is_latest = 1 THEN reservation_id ELSE NULL END) STORED,
    created_at             DATETIME(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    PRIMARY KEY (contract_id),
    UNIQUE KEY uk_contracts_code (code),
    UNIQUE KEY uk_contracts_latest (latest_key),
    KEY idx_contracts_reservation (reservation_id),
    CONSTRAINT fk_contracts_reservation FOREIGN KEY (reservation_id)        REFERENCES reservations (reservation_id),
    CONSTRAINT fk_contracts_policy     FOREIGN KEY (policy_id)              REFERENCES rental_policies (policy_id),
    CONSTRAINT fk_contracts_supersedes FOREIGN KEY (supersedes_contract_id) REFERENCES contracts (contract_id)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci;

-- V3: bảng riêng thay self-FK ParentContractID; sinh từ nghiệp vụ gia hạn
-- (extension_id 1-N: VOIDED soạn lại = bản ghi mới cùng extension)
-- status: AWAITING_SIGNATURE / SIGNED / EXPIRED / VOIDED
CREATE TABLE contract_addendums (
    addendum_id        BIGINT       NOT NULL AUTO_INCREMENT,
    contract_id        BIGINT       NOT NULL,
    extension_id       BIGINT       NULL,
    code               VARCHAR(20)  NOT NULL, -- CT-2026-0001-A1 (delta 7)
    content_snapshot   TEXT         NOT NULL,
    signed_photo_url   VARCHAR(255) NULL,
    signature_due_date DATE         NOT NULL, -- hạn ký 7 ngày
    status             VARCHAR(30)  NOT NULL,
    created_at         DATETIME(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    PRIMARY KEY (addendum_id),
    UNIQUE KEY uk_contract_addendums_code (code),
    KEY idx_contract_addendums_contract (contract_id),
    CONSTRAINT fk_addendums_contract  FOREIGN KEY (contract_id)  REFERENCES contracts (contract_id),
    CONSTRAINT fk_addendums_extension FOREIGN KEY (extension_id) REFERENCES extensions (extension_id)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci;

-- --------------------------------- NHÓM 6: THANH TOÁN & THANH LÝ ----

-- Tạo settlements TRƯỚC payments (payments FK tham chiếu settlements)
-- Bản thanh lý mỗi lần trả kho (1-0..1 với reservation)
CREATE TABLE settlements (
    settlement_id  BIGINT        NOT NULL AUTO_INCREMENT,
    reservation_id BIGINT        NOT NULL,
    contract_id    BIGINT        NOT NULL,
    staff_id       BIGINT        NOT NULL,
    damage_fee     DECIMAL(15,0) NOT NULL DEFAULT 0,
    damage_reason  VARCHAR(255)  NULL, -- bắt buộc khi damage_fee > 0
    refund_amount  DECIMAL(15,0) NOT NULL, -- hoàn = cọc giữ - phí hư hại
    receipt_code   VARCHAR(20)   NOT NULL, -- TL-… biên lai thanh lý (chốt 2026-09-23)
    created_at     DATETIME(6)   NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    PRIMARY KEY (settlement_id),
    UNIQUE KEY uk_settlements_reservation (reservation_id),
    UNIQUE KEY uk_settlements_receipt (receipt_code),
    KEY idx_settlements_contract (contract_id),
    CONSTRAINT fk_settlements_reservation FOREIGN KEY (reservation_id) REFERENCES reservations (reservation_id),
    CONSTRAINT fk_settlements_contract    FOREIGN KEY (contract_id)    REFERENCES contracts (contract_id),
    CONSTRAINT fk_settlements_staff       FOREIGN KEY (staff_id)       REFERENCES users (user_id),
    CONSTRAINT chk_settlements_damage_reason CHECK (damage_fee = 0 OR damage_reason IS NOT NULL)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci;

-- 4 touchpoint: DEPOSIT / RENT / EXTENSION_FEE / DAMAGE_FEE / EXTRA_FEE
-- method: CARD / MOMO / VNPAY — status: PENDING / PROCESSING / SUCCEEDED / FAILED / EXPIRED
-- CHECK: đúng 1 trong 3 cột nguồn (reservation / extension / settlement)
CREATE TABLE payments (
    payment_id     BIGINT        NOT NULL AUTO_INCREMENT,
    receipt_code   VARCHAR(20)   NOT NULL, -- RT-…
    payer_id       BIGINT        NOT NULL,
    reservation_id BIGINT        NULL, -- cọc 10% + thuê 100%
    extension_id   BIGINT        NULL, -- phí gia hạn
    settlement_id  BIGINT        NULL, -- phí hư hại / phát sinh vượt cọc
    purpose        VARCHAR(30)   NOT NULL,
    method         VARCHAR(20)   NOT NULL,
    amount         DECIMAL(15,0) NOT NULL,
    status         VARCHAR(30)   NOT NULL,
    created_at     DATETIME(6)   NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    PRIMARY KEY (payment_id),
    UNIQUE KEY uk_payments_receipt (receipt_code),
    KEY idx_payments_payer (payer_id),
    KEY idx_payments_created (created_at),
    CONSTRAINT fk_payments_payer       FOREIGN KEY (payer_id)       REFERENCES users (user_id),
    CONSTRAINT fk_payments_reservation FOREIGN KEY (reservation_id) REFERENCES reservations (reservation_id),
    CONSTRAINT fk_payments_extension   FOREIGN KEY (extension_id)   REFERENCES extensions (extension_id),
    CONSTRAINT fk_payments_settlement  FOREIGN KEY (settlement_id)  REFERENCES settlements (settlement_id),
    CONSTRAINT chk_payments_one_source CHECK ((reservation_id IS NOT NULL) + (extension_id IS NOT NULL) + (settlement_id IS NOT NULL) = 1),
    CONSTRAINT chk_payments_amount_positive CHECK (amount > 0)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci;

-- Checklist kiểm tra khi trả kho; MAJOR là căn cứ thu phí hư hại
-- item: ACCESS_CARD / PADLOCK / CLEANLINESS / STRUCTURE
-- result: OK / MINOR / MAJOR
CREATE TABLE inspections (
    inspection_id BIGINT       NOT NULL AUTO_INCREMENT,
    settlement_id BIGINT       NOT NULL,
    item          VARCHAR(30)  NOT NULL,
    result        VARCHAR(10)  NOT NULL,
    note          VARCHAR(255) NULL,
    PRIMARY KEY (inspection_id),
    CONSTRAINT fk_inspections_settlement FOREIGN KEY (settlement_id) REFERENCES settlements (settlement_id)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci;

-- ------------------------------------------------- NHÓM 7: HỖ TRỢ ----

-- Định tuyến tới staff trực ca theo unit + shift
-- incident_type: LOST_ACCESS / DEVICE_ISSUE / SECURITY / CLEANLINESS / OTHER
-- status: OPEN / IN_PROGRESS / RESOLVED / ESCALATED
CREATE TABLE support_tickets (
    ticket_id         BIGINT      NOT NULL AUTO_INCREMENT,
    code              VARCHAR(20) NOT NULL, -- SR-2026-0001
    customer_id       BIGINT      NOT NULL,
    unit_id           BIGINT      NOT NULL,
    reservation_id    BIGINT      NULL, -- ngữ cảnh phiên đặt chỗ - thuê
    incident_type     VARCHAR(30) NOT NULL,
    status            VARCHAR(30) NOT NULL,
    assigned_staff_id BIGINT      NULL,
    created_at        DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    PRIMARY KEY (ticket_id),
    UNIQUE KEY uk_support_tickets_code (code),
    KEY idx_tickets_status_staff (status, assigned_staff_id),
    KEY idx_tickets_customer (customer_id),
    CONSTRAINT fk_tickets_customer    FOREIGN KEY (customer_id)        REFERENCES users (user_id),
    CONSTRAINT fk_tickets_unit        FOREIGN KEY (unit_id)            REFERENCES units (unit_id),
    CONSTRAINT fk_tickets_reservation FOREIGN KEY (reservation_id)     REFERENCES reservations (reservation_id),
    CONSTRAINT fk_tickets_staff       FOREIGN KEY (assigned_staff_id)  REFERENCES users (user_id)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci;

-- Staff escalate bắt buộc kèm ghi chú; decision: PENDING /
-- MAINTENANCE_RELOCATE / RETURN_TO_STAFF
CREATE TABLE escalations (
    escalation_id          BIGINT      NOT NULL AUTO_INCREMENT,
    ticket_id              BIGINT      NOT NULL, -- UNIQUE: mỗi ticket escalate 1 lần
    escalated_by_staff_id  BIGINT      NOT NULL,
    manager_id             BIGINT      NULL,
    note                   TEXT        NOT NULL,
    decision               VARCHAR(30) NOT NULL DEFAULT 'PENDING',
    created_at             DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    PRIMARY KEY (escalation_id),
    UNIQUE KEY uk_escalations_ticket (ticket_id),
    CONSTRAINT fk_escalations_ticket  FOREIGN KEY (ticket_id)             REFERENCES support_tickets (ticket_id),
    CONSTRAINT fk_escalations_staff   FOREIGN KEY (escalated_by_staff_id) REFERENCES users (user_id),
    CONSTRAINT fk_escalations_manager FOREIGN KEY (manager_id)            REFERENCES users (user_id)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci;

-- ------------------------------------ NHÓM 8: VẬN HÀNH & HỆ THỐNG ----

-- Kanban; chặn kéo Done khi còn bước chốt (guard snap-back FR-22)
-- type: CHECK_IN / CHECKOUT / CLEANING / SUPPORT / CONTRACT
-- status: TODO / IN_PROGRESS / DONE
CREATE TABLE tasks (
    task_id           BIGINT      NOT NULL AUTO_INCREMENT,
    type              VARCHAR(20) NOT NULL,
    ref_code          VARCHAR(20) NULL, -- BK- / SR- / CT- (không còn RT-)
    assigned_staff_id BIGINT      NOT NULL,
    work_date         DATE        NOT NULL,
    status            VARCHAR(20) NOT NULL,
    created_at        DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    PRIMARY KEY (task_id),
    KEY idx_tasks_staff_date_status (assigned_staff_id, work_date, status),
    CONSTRAINT fk_tasks_staff FOREIGN KEY (assigned_staff_id) REFERENCES users (user_id)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci;

-- Chuông thông báo trong app; deep_link = FE route relative (routes.yaml)
CREATE TABLE notifications (
    notification_id BIGINT       NOT NULL AUTO_INCREMENT,
    user_id         BIGINT       NOT NULL,
    type            VARCHAR(50)  NOT NULL,
    title           VARCHAR(200) NOT NULL,
    deep_link       VARCHAR(255) NULL, -- /rentals/{id}
    is_read         TINYINT(1)   NOT NULL DEFAULT 0,
    created_at      DATETIME(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6), -- delta 5
    PRIMARY KEY (notification_id),
    KEY idx_notifications_user_read (user_id, is_read, created_at),
    CONSTRAINT fk_notifications_user FOREIGN KEY (user_id) REFERENCES users (user_id)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci;

-- Nhật ký kiểm toán append-only (chỉ INSERT — AD-6); action/entity_type là
-- enum registry trong code; reason bắt buộc
CREATE TABLE activity_logs (
    log_id      BIGINT       NOT NULL AUTO_INCREMENT,
    actor_id    BIGINT       NOT NULL,
    entity_type VARCHAR(50)  NOT NULL, -- UNIT / CONTRACT / RESERVATION...
    entity_id   BIGINT       NOT NULL,
    action      VARCHAR(50)  NOT NULL, -- STATUS_CHANGE / LOGIN...
    from_value  VARCHAR(255) NULL,
    to_value    VARCHAR(255) NULL,
    reason      VARCHAR(255) NOT NULL,
    created_at  DATETIME(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    PRIMARY KEY (log_id),
    KEY idx_activity_logs_entity (entity_type, entity_id),
    KEY idx_activity_logs_actor (actor_id, created_at),
    CONSTRAINT fk_activity_logs_actor FOREIGN KEY (actor_id) REFERENCES users (user_id)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci;

-- ------------------------------------------------ REFERENCE DATA ----
-- roles = reference data chạy mọi môi trường (khác V2__seed_demo chỉ dev).
-- name UPPER_SNAKE khớp JWT claim + enum trong code (AD-5, AD-8).

INSERT INTO roles (role_id, name, description) VALUES
    (1, 'CUSTOMER',        'Khách thuê — đặt chỗ, thanh toán, nhận kho, gia hạn, hỗ trợ'),
    (2, 'STAFF',           'Nhân viên trực zone — task board, check-in/checkout, xử lý ticket'),
    (3, 'FACILITY_MANAGER','Quản lý cơ sở — đơn vị kho, lịch trực, theo dõi hoạt động'),
    (4, 'BUSINESS_OPS',    'Vận hành kinh doanh — chính sách giá, báo cáo KPI'),
    (5, 'SYSTEM_ADMIN',    'Quản trị hệ thống — provisioning tài khoản, audit (PRD FR-37..41)');
