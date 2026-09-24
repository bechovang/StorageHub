package com.storagehub.dto.auth;

import com.storagehub.entity.Role;
import com.storagehub.entity.User;

public record MeResponse(
        Long id,
        String fullName,
        String email,
        String phone,
        Role.Name role,
        String landingRoute
) {

    public static MeResponse from(User user, String landingRoute) {
        return new MeResponse(
                user.getUserId(),
                user.getFullName(),
                user.getEmail(),
                user.getPhone(),
                user.getRole().getName(),
                landingRoute
        );
    }
}