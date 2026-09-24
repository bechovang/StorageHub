package com.storagehub.dto.auth;
import com.storagehub.enums.RoleName;
import com.storagehub.entity.User;

public record UserSummaryResponse(
        Long id,
        String fullName,
        String email,
        String phone,
        RoleName role
) {

    public static UserSummaryResponse from(User user) {
        return new UserSummaryResponse(
                user.getId(),
                user.getFullName(),
                user.getEmail(),
                user.getPhone(),
                user.getRole().getName()
        );
    }
}