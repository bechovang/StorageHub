package com.storagehub.dto.user;

/**
 * Phản hồi sau khi reset mật khẩu thành công kèm mật khẩu tạm mới (FR-37).
 */
public record ResetPasswordResponse(
        Long userId,
        String email,
        String temporaryPassword
) {
}
