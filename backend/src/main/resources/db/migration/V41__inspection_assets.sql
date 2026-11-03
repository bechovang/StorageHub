-- Asset-level inspection results captured during checkout rituals.
CREATE TABLE inspection_assets (
    inspection_asset_id BIGINT      NOT NULL AUTO_INCREMENT,
    settlement_id       BIGINT      NOT NULL,
    unit_asset_id       BIGINT      NOT NULL,
    result              VARCHAR(20) NOT NULL,
    note                VARCHAR(255) NULL,
    PRIMARY KEY (inspection_asset_id),
    KEY idx_inspection_assets_settlement (settlement_id),
    CONSTRAINT fk_inspection_assets_settlement FOREIGN KEY (settlement_id) REFERENCES settlements (settlement_id),
    CONSTRAINT fk_inspection_assets_asset FOREIGN KEY (unit_asset_id) REFERENCES unit_assets (unit_asset_id)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci;
