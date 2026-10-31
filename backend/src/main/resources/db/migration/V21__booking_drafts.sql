-- ============================================================================
-- StorageHub — V21: Booking draft (giữ chỗ tạm trước khi trả cọc)
-- Không còn Reservation ở trạng thái PENDING_PAYMENT: khách chỉ có đơn thuê
-- sau khi PayOS xác nhận cọc. Trong lúc chờ thanh toán, hệ thống giữ một
-- booking draft (TTL 30 phút) để chống overbook; draft không xuất hiện trong
-- danh sách đơn thuê của khách.
-- ============================================================================

CREATE TABLE booking_drafts (
    draft_id       BIGINT        NOT NULL AUTO_INCREMENT,
    customer_id    BIGINT        NOT NULL,
    unit_id        BIGINT        NOT NULL,
    start_date     DATE          NOT NULL,
    end_date       DATE          NOT NULL,
    deposit_amount DECIMAL(15,0) NOT NULL,
    status         VARCHAR(20)   NOT NULL, -- PENDING / CONVERTED / EXPIRED
    expires_at     DATETIME(6)   NOT NULL,
    created_at     DATETIME(6)   NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    PRIMARY KEY (draft_id),
    KEY idx_booking_drafts_unit_window (unit_id, status, expires_at),
    KEY idx_booking_drafts_customer (customer_id),
    CONSTRAINT fk_booking_drafts_customer FOREIGN KEY (customer_id) REFERENCES users (user_id),
    CONSTRAINT fk_booking_drafts_unit     FOREIGN KEY (unit_id)     REFERENCES units (unit_id),
    CONSTRAINT chk_booking_drafts_dates   CHECK (end_date >= start_date)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci;

ALTER TABLE payments
    ADD COLUMN booking_draft_id BIGINT NULL AFTER reservation_id,
    ADD CONSTRAINT fk_payments_booking_draft
        FOREIGN KEY (booking_draft_id) REFERENCES booking_drafts (draft_id);

ALTER TABLE payments DROP CHECK chk_payments_one_source;

ALTER TABLE payments
    ADD CONSTRAINT chk_payments_one_source CHECK (
        (reservation_id IS NOT NULL)
        + (extension_id IS NOT NULL)
        + (settlement_id IS NOT NULL)
        + (booking_draft_id IS NOT NULL) = 1
    );
