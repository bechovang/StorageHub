package com.storagehub.dto.contract;

import com.fasterxml.jackson.annotation.JsonFormat;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * Chi tiết hợp đồng theo schema ContractDetail trong contracts/openapi.yaml.
 */
public record ContractDetailResponse(
        Long id,
        String code,
        String kind,
        String status,
        boolean isLatest,
        String signedPhotoUrl,
        @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd")
        LocalDate signatureDueDate,
        Long reservationId,
        String policyVersion,
        String contentSnapshot,
        @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd'T'HH:mm:ss'Z'")
        LocalDateTime createdAt
) {
}
