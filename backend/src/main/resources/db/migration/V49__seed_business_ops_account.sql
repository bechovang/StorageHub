-- ============================================================================
-- StorageHub — V49: seed tài khoản BUSINESS_OPS cho demo
-- V40 truncate users rồi seed lại nhưng bỏ sót role BUSINESS_OPS, khiến không
-- thể demo /overview, /reports, /policy (RUNBOOK + DEMO_SCRIPT vẫn ghi
-- hang@demo.storagehub.vn / password). Idempotent: bỏ qua nếu email đã tồn tại
-- (trường hợp admin đã provisioning tay trên prod).
-- ============================================================================

INSERT INTO users (full_name, email, phone, password_hash, role_id, facility_id, status)
SELECT 'Lê Thị Hằng',
       'hang@demo.storagehub.vn',
       '0903456789',
       '$2a$10$dXJ3SW6G7P50lGmMkkmwe.20cQQubK3.HZWzG3YB1tlRy.fqvM/BG',
       4,
       NULL,
       1
WHERE NOT EXISTS (
    SELECT 1 FROM users WHERE email = 'hang@demo.storagehub.vn'
);
