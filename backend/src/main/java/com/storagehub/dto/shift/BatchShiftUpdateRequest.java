package com.storagehub.dto.shift;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;

import java.util.List;

/** Lưu thay đổi phân ca theo lô: xoá + tạo trong cùng transaction. */
public record BatchShiftUpdateRequest(
        @NotNull(message = "Danh sách assignment cần xoá không được null")
        List<Long> deleteIds,
        @NotNull(message = "Danh sách assignment cần tạo không được null")
        @Valid
        List<CreateShiftAssignmentRequest> creates
) {}
