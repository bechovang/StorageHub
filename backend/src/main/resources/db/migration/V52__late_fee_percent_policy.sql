-- ============================================================================
-- V52 — Check-in / extension late fee chuyển sang % giá thuê ngày
--
-- Check-in và contract/gia hạn dùng chung công thức:
--   phí = dailyRent × số ngày trễ × percent / 100
-- Thay rule tiền cố định cũ bằng rule phần trăm 300% trên policy đang hiệu lực.
-- ============================================================================

INSERT INTO policy_rules (policy_id, facility_id, type_id, rule_type, surcharge_type, value, cap)
SELECT p.policy_id, NULL, ut.type_id, 'CHECKIN_LATE_FEE_PERCENT', NULL, 300, NULL
FROM rental_policies p
CROSS JOIN unit_types ut
WHERE p.status = 1
  AND NOT EXISTS (
      SELECT 1 FROM policy_rules pr
      WHERE pr.policy_id = p.policy_id
        AND pr.facility_id IS NULL
        AND pr.type_id = ut.type_id
        AND pr.rule_type = 'CHECKIN_LATE_FEE_PERCENT'
  );

INSERT INTO policy_rules (policy_id, facility_id, type_id, rule_type, surcharge_type, value, cap)
SELECT p.policy_id, NULL, ut.type_id, 'EXTENSION_LATE_FEE_PERCENT', NULL, 300, NULL
FROM rental_policies p
CROSS JOIN unit_types ut
WHERE p.status = 1
  AND NOT EXISTS (
      SELECT 1 FROM policy_rules pr
      WHERE pr.policy_id = p.policy_id
        AND pr.facility_id IS NULL
        AND pr.type_id = ut.type_id
        AND pr.rule_type = 'EXTENSION_LATE_FEE_PERCENT'
  );

DELETE pr
FROM policy_rules pr
JOIN rental_policies p ON p.policy_id = pr.policy_id
WHERE p.status = 1
  AND pr.rule_type IN ('CHECKIN_LATE_FEE_PER_DAY', 'EXTENSION_LATE_FEE_PER_DAY');
