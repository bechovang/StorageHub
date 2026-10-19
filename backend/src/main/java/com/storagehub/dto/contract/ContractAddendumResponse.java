package com.storagehub.dto.contract;

import com.fasterxml.jackson.annotation.JsonFormat;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * Phản hồi chi tiết phụ lục hợp đồng (FR-12, US-19).
 */
public record ContractAddendumResponse(
        Long addendumId,
        Long contractId,
        Long extensionId,
        String code,
        String contentSnapshot,
        String signedPhotoUrl,
        @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd")
        LocalDate signatureDueDate,
        String status,
        @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd'T'HH:mm:ss'Z'")
        LocalDateTime createdAt
) {
}
