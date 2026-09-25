package com.storagehub.dto.auth;

public record ForgotPasswordResponse(
        String message
) {
    public static final String DEFAULT_MESSAGE =
            "If an account exists for that email, password reset instructions have been sent.";

    public static ForgotPasswordResponse defaultMessage() {
        return new ForgotPasswordResponse(DEFAULT_MESSAGE);
    }
}
