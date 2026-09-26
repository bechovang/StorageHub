package com.storagehub.service;

import com.storagehub.entity.Contract;
import com.storagehub.entity.Payment;
import com.storagehub.entity.Reservation;

/**
 * Owner của CONTRACTS (arch spine) — US-11 do Phúc implement.
 * US-8 tiêu thụ qua ObjectProvider: bean chưa có thì response.contract = null,
 * không lỗi; khi US-11 merge thì draft tự động kích hoạt (FR-10).
 */
public interface ContractService {

    /** Auto-draft khi purpose=DEPOSIT thanh toán thành công — snapshot policy hiện hành. */
    Contract draftDepositContract(Reservation reservation, Payment payment);
}
