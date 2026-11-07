-- V42: late checkout fee, manager escalation, liquidation.
-- PRD: no OVERDUE reservation status; lateness is derived on-read (AD-4).
-- Manager decisions live in late_checkout_cases.

ALTER TABLE reservations
    ADD COLUMN closed_at DATETIME(6) NULL AFTER status;

ALTER TABLE checkout_requests
    ADD COLUMN reason VARCHAR(500) NULL AFTER checkout_type;

ALTER TABLE settlements
    ADD COLUMN late_days INT NOT NULL DEFAULT 0 AFTER damage_reason,
    ADD COLUMN late_fee DECIMAL(15,0) NOT NULL DEFAULT 0 AFTER late_days,
    ADD COLUMN settlement_type VARCHAR(20) NOT NULL DEFAULT 'NORMAL' AFTER late_fee,
    ADD COLUMN liquidation_reason VARCHAR(30) NULL AFTER settlement_type,
    ADD COLUMN note VARCHAR(500) NULL AFTER liquidation_reason;

CREATE TABLE late_checkout_cases (
    case_id          BIGINT        NOT NULL AUTO_INCREMENT,
    reservation_id   BIGINT        NOT NULL,
    status           VARCHAR(30)   NOT NULL, -- LATE / PENDING_MANAGER / EXTENDED / RESOLVED / LIQUIDATED
    decision         VARCHAR(20)   NULL,     -- EXTEND / LIQUIDATE
    days_late        INT           NOT NULL DEFAULT 0,
    accrued_fee      DECIMAL(15,0) NOT NULL DEFAULT 0,
    escalation_count INT           NOT NULL DEFAULT 0,
    manager_id       BIGINT        NULL,
    extension_days   INT           NULL,
    extended_until   DATE          NULL,
    reason           VARCHAR(1000) NULL,
    settlement_id    BIGINT        NULL,
    created_at       DATETIME(6)   NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at       DATETIME(6)   NULL,
    decided_at       DATETIME(6)   NULL,
    PRIMARY KEY (case_id),
    UNIQUE KEY uk_late_cases_reservation (reservation_id),
    KEY idx_late_cases_status (status),
    CONSTRAINT fk_late_cases_reservation FOREIGN KEY (reservation_id) REFERENCES reservations (reservation_id),
    CONSTRAINT fk_late_cases_manager     FOREIGN KEY (manager_id)     REFERENCES users (user_id),
    CONSTRAINT fk_late_cases_settlement  FOREIGN KEY (settlement_id)  REFERENCES settlements (settlement_id)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci;

-- Seed the two new policy rules on the currently effective policy(ies).
-- 300% of the daily rent per late day; manager escalation after 3 late days.
INSERT INTO policy_rules (policy_id, facility_id, type_id, rule_type, surcharge_type, value, cap)
SELECT p.policy_id, f.facility_id, t.type_id, 'LATE_FEE_PERCENT', NULL, 300, NULL
FROM rental_policies p
CROSS JOIN facilities f
CROSS JOIN unit_types t
LEFT JOIN policy_rules pr
       ON pr.policy_id = p.policy_id
      AND pr.facility_id = f.facility_id
      AND pr.type_id = t.type_id
      AND pr.rule_type = 'LATE_FEE_PERCENT'
WHERE p.status = 1
  AND pr.rule_id IS NULL;

INSERT INTO policy_rules (policy_id, facility_id, type_id, rule_type, surcharge_type, value, cap)
SELECT p.policy_id, f.facility_id, t.type_id, 'LATE_ESCALATION_DAYS', NULL, 3, NULL
FROM rental_policies p
CROSS JOIN facilities f
CROSS JOIN unit_types t
LEFT JOIN policy_rules pr
       ON pr.policy_id = p.policy_id
      AND pr.facility_id = f.facility_id
      AND pr.type_id = t.type_id
      AND pr.rule_type = 'LATE_ESCALATION_DAYS'
WHERE p.status = 1
  AND pr.rule_id IS NULL;
