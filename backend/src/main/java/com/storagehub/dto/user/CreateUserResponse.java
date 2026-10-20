package com.storagehub.dto.user;

/**
 * Phản hồi sau khi tạo người dùng thành công kèm mật khẩu tạm (FR-37).
 */
public record CreateUserResponse(
        UserDetailResponse user,
        String temporaryPassword
) {
}
