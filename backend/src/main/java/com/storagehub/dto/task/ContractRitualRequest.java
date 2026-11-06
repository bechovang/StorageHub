package com.storagehub.dto.task;

/** Ký hợp đồng/phụ lục tại quầy; task gia hạn cần thêm 100% rent + ảnh chứng từ. */
public record ContractRitualRequest(
        String contractPhotoUrl,
        String paymentMethod,
        String paymentProofPhoto,
        String notes
) {
}
