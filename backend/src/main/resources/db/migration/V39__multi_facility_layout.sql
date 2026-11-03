-- ============================================================================
-- Multi-facility catalog: codes, 5x5 grid, per-facility prices, unit assets.
-- Seed data for the three demo facilities is in db/seed/V39.
-- ============================================================================

ALTER TABLE facilities
    ADD COLUMN code VARCHAR(10) NULL AFTER facility_id,
    ADD COLUMN description VARCHAR(255) NULL AFTER name,
    ADD COLUMN photo_url VARCHAR(255) NULL AFTER phone,
    ADD UNIQUE KEY uk_facilities_code (code);

ALTER TABLE users
    ADD COLUMN unit_type_id INT NULL AFTER facility_id,
    ADD CONSTRAINT fk_users_unit_type FOREIGN KEY (unit_type_id) REFERENCES unit_types (type_id);

ALTER TABLE units
    ADD COLUMN grid_row TINYINT NULL AFTER floor,
    ADD COLUMN grid_col TINYINT NULL AFTER grid_row;

ALTER TABLE policy_rules
    ADD COLUMN facility_id INT NULL AFTER policy_id,
    ADD CONSTRAINT fk_policy_rules_facility FOREIGN KEY (facility_id) REFERENCES facilities (facility_id);

CREATE TABLE unit_type_images (
    image_id   BIGINT       NOT NULL AUTO_INCREMENT,
    type_id    INT          NOT NULL,
    url        VARCHAR(255) NOT NULL,
    sort_order INT          NOT NULL DEFAULT 1,
    caption    VARCHAR(120) NULL,
    PRIMARY KEY (image_id),
    KEY idx_unit_type_images_type (type_id, sort_order),
    CONSTRAINT fk_unit_type_images_type FOREIGN KEY (type_id) REFERENCES unit_types (type_id)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci;

CREATE TABLE asset_types (
    asset_type_id INT         NOT NULL AUTO_INCREMENT,
    code          VARCHAR(30) NOT NULL,
    name          VARCHAR(100) NOT NULL,
    description   VARCHAR(255) NULL,
    PRIMARY KEY (asset_type_id),
    UNIQUE KEY uk_asset_types_code (code)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci;

CREATE TABLE unit_assets (
    unit_asset_id BIGINT      NOT NULL AUTO_INCREMENT,
    unit_id       BIGINT      NOT NULL,
    asset_type_id INT         NOT NULL,
    serial_no      VARCHAR(60) NULL,
    status         VARCHAR(20) NOT NULL DEFAULT 'OK',
    installed_at   DATE        NULL,
    last_service_at DATE       NULL,
    note           VARCHAR(255) NULL,
    PRIMARY KEY (unit_asset_id),
    KEY idx_unit_assets_unit (unit_id),
    CONSTRAINT fk_unit_assets_unit FOREIGN KEY (unit_id) REFERENCES units (unit_id),
    CONSTRAINT fk_unit_assets_type FOREIGN KEY (asset_type_id) REFERENCES asset_types (asset_type_id)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci;
