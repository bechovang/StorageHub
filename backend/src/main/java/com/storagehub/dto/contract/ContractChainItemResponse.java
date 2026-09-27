package com.storagehub.dto.contract;

import com.fasterxml.jackson.annotation.JsonFormat;

import java.time.LocalDate;

/**
 * Mục trong chuỗi hợp đồng theo schema ContractChainItem trong contracts/openapi.yaml.
 */
public record ContractChainItemResponse(
        Long id,
        String code,
        String kind,
        String status,
        boolean isLatest,
        String signedPhotoUrl,
        @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd")
        LocalDate signatureDueDate
) {
}
