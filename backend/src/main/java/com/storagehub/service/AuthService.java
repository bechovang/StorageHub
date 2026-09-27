package com.storagehub.service;

import com.storagehub.dto.auth.*;

public interface AuthService {

    AuthSessionResponse login(LoginRequest request);

    AuthSessionResponse register(RegisterRequest request);

    ForgotPasswordResponse forgotPassword(ForgotPasswordRequest request);

    MeResponse getMe(String email);
}
