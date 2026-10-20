package com.storagehub.dto.user;

import com.storagehub.entity.Role;
import jakarta.validation.constraints.NotNull;

/**
 * Request cập nhật vai trò người dùng (FR-37).
 */
public record UpdateUserRoleRequest(
        @NotNull(message = "Vai trò mới không được để trống")
        Role.Name role
) {
}
