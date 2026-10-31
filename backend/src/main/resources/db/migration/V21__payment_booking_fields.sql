-- ============================================================================
-- StorageHub — V21: payment mang thông tin đặt chỗ trước khi có Reservation
-- PayOS cần payment row + payload (unit/ngày) trước khi quét QR; Booking chỉ
-- sinh ở webhook SUCCEEDED. Không có booking draft / PENDING_PAYMENT booking.
-- ============================================================================

ALTER TABLE payments
    ADD COLUMN unit_id BIGINT NULL AFTER reservation_id,
    ADD COLUMN start_date DATE NULL AFTER unit_id,
    ADD COLUMN end_date DATE NULL AFTER start_date,
    ADD COLUMN refund_required TINYINT(1) NOT NULL DEFAULT 0,
    ADD COLUMN refund_reason VARCHAR(255) NULL,
    ADD CONSTRAINT fk_payments_unit FOREIGN KEY (unit_id) REFERENCES units (unit_id);

-- Rule cũ: đúng 1 trong reservation/extension/settlement. Nay DEPOSIT được phép
-- chưa có reservation khi payment còn PENDING/SUCCEEDED-nhưng-conflict.
ALTER TABLE payments DROP CHECK chk_payments_one_source;

ALTER TABLE payments
    ADD CONSTRAINT chk_payments_one_source CHECK (
        (reservation_id IS NOT NULL)
        + (extension_id IS NOT NULL)
        + (settlement_id IS NOT NULL) = 1
        OR (
            purpose = 'DEPOSIT'
            AND reservation_id IS NULL
            AND extension_id IS NULL
            AND settlement_id IS NULL
        )
    );
