package com.storagehub.dto.task;

import java.time.LocalDate;

/** Thiết bị trong kho để nhân viên kiểm tra khi checkout. */
public record TaskAssetDto(
        Long assetId,
        String code,
        String name,
        String serialNo,
        String status,
        LocalDate lastServiceAt,
        String note
) {
}
