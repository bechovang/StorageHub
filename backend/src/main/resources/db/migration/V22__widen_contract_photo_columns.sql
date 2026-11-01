-- ============================================================================
-- StorageHub — V22: chứa ảnh hợp đồng dạng data URL (Base64) tại quầy
-- UI gửi ảnh chụp trực tiếp dưới dạng data:image/...;base64,... — dài hơn
-- VARCHAR(255) rất nhiều; MEDIUMTEXT chứa tới 16MB.
-- ============================================================================

ALTER TABLE contracts
    MODIFY signed_photo_url MEDIUMTEXT NULL;

ALTER TABLE contract_addendums
    MODIFY signed_photo_url MEDIUMTEXT NULL;
