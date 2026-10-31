package com.storagehub.dto.policy;

import com.fasterxml.jackson.annotation.JsonFormat;

import java.time.LocalDateTime;
import java.util.List;

/** GET /api/v1/policies/active — shape khớp FE policyService (baseRates + surcharges). */
public record PolicyActiveResponse(
        Long policyId,
        String version,
        Integer status,
        @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd'T'HH:mm:ss")
        LocalDateTime updatedAt,
        String updatedBy,
        List<PolicyRateItem> baseRates,
        Surcharges surcharges
) {

    public record Surcharges(
            Integer lateCheckoutPercent,
            Integer depositPercent,
            Integer turnoverBufferDays
    ) {
    }
}
