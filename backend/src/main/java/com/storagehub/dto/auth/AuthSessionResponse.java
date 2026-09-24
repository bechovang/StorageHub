package com.storagehub.dto.auth;

import com.storagehub.dto.auth.UserSummaryResponse;

import java.time.Instant;

public record AuthSessionResponse(
        String token,
        Instant expiresAt,
        UserSummaryResponse user,
        String landingRoute
) {
}