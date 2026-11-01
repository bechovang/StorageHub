-- ============================================================================
-- StorageHub — V23: lưu ảnh ritual trên Task để xem lại sau khi hoàn thành
-- Ảnh gửi từ UI là data URL Base64 → MEDIUMTEXT.
-- ============================================================================

ALTER TABLE tasks
    ADD COLUMN payment_proof_photo MEDIUMTEXT NULL AFTER status,
    ADD COLUMN contract_photo      MEDIUMTEXT NULL AFTER payment_proof_photo,
    ADD COLUMN settlement_photo    MEDIUMTEXT NULL AFTER contract_photo;
