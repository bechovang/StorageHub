-- ============================================================================
-- V51 — Chuẩn hoá scope của policy_rules
--
-- Thiết kế chốt: RENT_RATE là rule theo từng cơ sở (facility_id NOT NULL),
-- các rule vận hành còn lại (cọc, buffer, phạt trễ, grace...) là global
-- (facility_id NULL). Seed V40/V45/V46 đang nhân bản mọi rule cho từng cơ sở;
-- migration này gom các rule không phải RENT_RATE về một bản global duy nhất
-- (lấy giá trị của cơ sở có facility_id nhỏ nhất — Tân Bình) rồi xoá bản sao
-- theo cơ sở để tránh mỗi cơ sở đọc một giá trị khác nhau.
-- ============================================================================

-- 1. Tạo rule global cho các rule không phải RENT_RATE (nếu chưa có).
INSERT INTO policy_rules (policy_id, facility_id, type_id, rule_type, surcharge_type, value, cap)
SELECT pr.policy_id,
       NULL,
       pr.type_id,
       pr.rule_type,
       pr.surcharge_type,
       pr.value,
       pr.cap
FROM policy_rules pr
JOIN rental_policies p ON p.policy_id = pr.policy_id AND p.status = 1
WHERE pr.rule_type <> 'RENT_RATE'
  AND pr.facility_id IS NOT NULL
  AND pr.facility_id = (
      SELECT MIN(src.facility_id)
      FROM policy_rules src
      WHERE src.policy_id = pr.policy_id
        AND src.rule_type <> 'RENT_RATE'
        AND src.facility_id IS NOT NULL
  )
  AND NOT EXISTS (
      SELECT 1
      FROM policy_rules g
      WHERE g.policy_id = pr.policy_id
        AND g.facility_id IS NULL
        AND g.type_id = pr.type_id
        AND g.rule_type = pr.rule_type
  );

-- 2. Xoá bản sao rule vận hành theo cơ sở của policy đang hiệu lực.
DELETE pr
FROM policy_rules pr
JOIN rental_policies p ON p.policy_id = pr.policy_id
WHERE p.status = 1
  AND pr.rule_type <> 'RENT_RATE'
  AND pr.facility_id IS NOT NULL;

-- 3. Chặn rule trùng trong cùng một policy/cơ sở/loại kho/rule.
--    MySQL cho phép nhiều NULL ở cột facility_id nên ràng buộc này chỉ áp cho
--    rule theo cơ sở (RENT_RATE); app vẫn đảm bảo duy nhất cho rule global.
ALTER TABLE policy_rules
    ADD UNIQUE KEY uk_policy_rule_scope (policy_id, facility_id, type_id, rule_type);
