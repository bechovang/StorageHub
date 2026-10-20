package com.storagehub.dto.user;

import com.storagehub.entity.Role;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

/**
 * Request tạo tài khoản người dùng mới (FR-37).
 */
public record CreateUserRequest(
        @NotBlank(message = "Họ và tên không được để trống")
        String fullName,

        @NotBlank(message = "Email không được để trống")
        @Email(message = "Email không đúng định dạng")
        String email,

        String phone,

        @NotNull(message = "Vai trò (role) không được để trống")
        Role.Name role,

        Long facilityId
) {
}
