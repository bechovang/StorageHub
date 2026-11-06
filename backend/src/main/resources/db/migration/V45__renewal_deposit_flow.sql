ALTER TABLE extensions
    ADD COLUMN old_deposit DECIMAL(15,0) NULL AFTER new_end_date,
    ADD COLUMN new_deposit DECIMAL(15,0) NULL AFTER old_deposit;

ALTER TABLE tasks
    ADD COLUMN expires_on DATE NULL AFTER work_date,
    ADD KEY idx_tasks_expiry (status, expires_on);

-- Default handover policy rules for every active policy / facility / unit type.
INSERT INTO policy_rules (policy_id, facility_id, type_id, rule_type, surcharge_type, value, cap)
SELECT p.policy_id, f.facility_id, ut.type_id, 'CHECKIN_GRACE_DAYS', NULL, 3, NULL
FROM rental_policies p CROSS JOIN facilities f CROSS JOIN unit_types ut
WHERE p.status = 1;

INSERT INTO policy_rules (policy_id, facility_id, type_id, rule_type, surcharge_type, value, cap)
SELECT p.policy_id, f.facility_id, ut.type_id, 'CHECKIN_LATE_FEE_PER_DAY', NULL, 50000, NULL
FROM rental_policies p CROSS JOIN facilities f CROSS JOIN unit_types ut
WHERE p.status = 1;

INSERT INTO policy_rules (policy_id, facility_id, type_id, rule_type, surcharge_type, value, cap)
SELECT p.policy_id, f.facility_id, ut.type_id, 'EXTENSION_GRACE_DAYS', NULL, 3, NULL
FROM rental_policies p CROSS JOIN facilities f CROSS JOIN unit_types ut
WHERE p.status = 1;

INSERT INTO policy_rules (policy_id, facility_id, type_id, rule_type, surcharge_type, value, cap)
SELECT p.policy_id, f.facility_id, ut.type_id, 'EXTENSION_LATE_FEE_PER_DAY', NULL, 50000, NULL
FROM rental_policies p CROSS JOIN facilities f CROSS JOIN unit_types ut
WHERE p.status = 1;
