package com.storagehub.dto.user;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

/**
 * Request cập nhật trạng thái người dùng (0: DEACTIVATED, 1: ACTIVE, 2: LOCKED) (FR-37).
 */
public record UpdateUserStatusRequest(
        @NotNull(message = "Trạng thái không được để trống")
        @Min(value = 0, message = "Trạng thái chỉ có thể là 0 (DEACTIVATED), 1 (ACTIVE), 2 (LOCKED)")
        @Max(value = 2, message = "Trạng thái chỉ có thể là 0 (DEACTIVATED), 1 (ACTIVE), 2 (LOCKED)")
        Integer status,

        String reason
) {
}
