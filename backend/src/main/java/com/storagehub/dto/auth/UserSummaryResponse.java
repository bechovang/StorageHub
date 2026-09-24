package com.storagehub.dto.auth;
import com.storagehub.entity.Role;
import com.storagehub.entity.User;

public record UserSummaryResponse(
        Long id,
        String fullName,
        String email,
        String phone,
        Role.Name role
) {

    public static UserSummaryResponse from(User user) {
        return new UserSummaryResponse(
                user.getUserId(),
                user.getFullName(),
                user.getEmail(),
                user.getPhone(),
                user.getRole().getName()
        );
    }
}