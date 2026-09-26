package com.storagehub.service;

import com.storagehub.entity.Reservation;

/**
 * Owner của RESERVATIONS (arch spine ownership matrix) — module khác ghi qua
 * method công khai của service này, cấm tự save repository.
 * US-8 chỉ cần flip deposit; US-9 (booking) / US-10 (lifecycle) mở rộng tiếp.
 */
public interface ReservationService {

    /**
     * Deposit đã thanh toán thành công → PENDING_PAYMENT → RESERVED.
     * Caller (PaymentService) đảm bảo đang trong cùng transaction.
     *
     * @throws IllegalStateException nếu trạng thái không phải PENDING_PAYMENT.
     */
    Reservation markDepositPaid(Reservation reservation);
}
