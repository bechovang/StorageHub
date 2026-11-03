ALTER TABLE reservations
    ADD COLUMN policy_id INT NULL AFTER unit_id,
    ADD CONSTRAINT fk_reservations_policy FOREIGN KEY (policy_id) REFERENCES rental_policies (policy_id);

ALTER TABLE payments
    ADD COLUMN policy_id INT NULL AFTER unit_id,
    ADD CONSTRAINT fk_payments_policy FOREIGN KEY (policy_id) REFERENCES rental_policies (policy_id);

ALTER TABLE extensions
    ADD COLUMN policy_id INT NULL AFTER reservation_id,
    ADD CONSTRAINT fk_extensions_policy FOREIGN KEY (policy_id) REFERENCES rental_policies (policy_id);

ALTER TABLE contract_addendums
    ADD COLUMN policy_id INT NULL AFTER contract_id,
    ADD CONSTRAINT fk_addendums_policy FOREIGN KEY (policy_id) REFERENCES rental_policies (policy_id);

-- Backfill cho dữ liệu cũ: reservation lấy policy của contract gần nhất (nếu có).
UPDATE reservations r
JOIN (
    SELECT c.reservation_id, c.policy_id
    FROM contracts c
    JOIN (
        SELECT reservation_id, MAX(contract_id) AS contract_id
        FROM contracts
        GROUP BY reservation_id
    ) latest ON latest.contract_id = c.contract_id
) x ON x.reservation_id = r.reservation_id
SET r.policy_id = x.policy_id
WHERE r.policy_id IS NULL AND x.policy_id IS NOT NULL;

UPDATE payments p
JOIN reservations r ON r.reservation_id = p.reservation_id
SET p.policy_id = r.policy_id
WHERE p.policy_id IS NULL AND r.policy_id IS NOT NULL;

UPDATE extensions e
JOIN (
    SELECT c.reservation_id, c.policy_id
    FROM contracts c
    JOIN (
        SELECT reservation_id, MAX(contract_id) AS contract_id
        FROM contracts
        GROUP BY reservation_id
    ) latest ON latest.contract_id = c.contract_id
) x ON x.reservation_id = e.reservation_id
SET e.policy_id = x.policy_id
WHERE e.policy_id IS NULL AND x.policy_id IS NOT NULL;

UPDATE contract_addendums a
JOIN contracts c ON c.contract_id = a.contract_id
SET a.policy_id = c.policy_id
WHERE a.policy_id IS NULL AND c.policy_id IS NOT NULL;
