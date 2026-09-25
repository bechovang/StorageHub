package com.storagehub.controller;

import com.storagehub.dto.auth.AuthSessionResponse;
import com.storagehub.dto.auth.ForgotPasswordRequest;
import com.storagehub.dto.auth.ForgotPasswordResponse;
import com.storagehub.dto.auth.LoginRequest;
import com.storagehub.dto.auth.MeResponse;
import com.storagehub.dto.auth.RegisterRequest;
import com.storagehub.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/login")
    public ResponseEntity<AuthSessionResponse> login(
            @Valid @RequestBody LoginRequest request
    ) {
        return ResponseEntity.ok(
                authService.login(request)
        );
    }

    @PostMapping("/register")
    public ResponseEntity<AuthSessionResponse> register(
            @Valid @RequestBody RegisterRequest request
    ) {
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(authService.register(request));
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<ForgotPasswordResponse> forgotPassword(
            @Valid @RequestBody ForgotPasswordRequest request
    ) {
        return ResponseEntity.ok(
                authService.forgotPassword(request)
        );
    }

    @GetMapping("/me")
    public ResponseEntity<MeResponse> getMe(
            Authentication authentication
    ) {
        return ResponseEntity.ok(
                authService.getMe(authentication.getName())
        );
    }
}