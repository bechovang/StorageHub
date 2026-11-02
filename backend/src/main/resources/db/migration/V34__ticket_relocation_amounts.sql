ALTER TABLE support_tickets
    ADD COLUMN relocation_compensation BIGINT NULL AFTER relocated_unit_code,
    ADD COLUMN relocation_absorbed BIGINT NULL AFTER relocation_compensation;
