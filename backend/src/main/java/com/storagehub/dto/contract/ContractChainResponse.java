package com.storagehub.dto.contract;

import java.util.List;

/**
 * Chuỗi hợp đồng gồm hợp đồng gốc và danh sách phụ lục theo thời gian (FR-13, US-19).
 */
public record ContractChainResponse(
        ContractDetailResponse contract,
        List<ContractAddendumResponse> addendums
) {
}
