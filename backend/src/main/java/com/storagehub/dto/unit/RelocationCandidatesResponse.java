package com.storagehub.dto.unit;

import com.fasterxml.jackson.annotation.JsonFormat;

import java.time.LocalDate;
import java.util.List;

/**
 * Kho thay thế khi xử lý sự cố + thời gian còn lại của đơn hiện tại.
 * Manager không được đổi khoảng ngày: đơn mới phải giữ đúng phần còn lại.
 */
public record RelocationCandidatesResponse(
        @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd")
        LocalDate startDate,
        @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd")
        LocalDate endDate,
        List<UnitSummaryResponse> items
) {
}
