package com.storagehub.dto.auth;

import com.storagehub.enums.RoleName;
import com.storagehub.entity.User;

public record MeResponse(
        Long id,
        String fullName,
        String email,
        String phone,
        RoleName role,
        String landingRoute
) {

    public static MeResponse from(User user, String landingRoute) {
        return new MeResponse(
                user.getId(),
                user.getFullName(),
                user.getEmail(),
                user.getPhone(),
                user.getRole().getName(),
                landingRoute
        );
    }
}