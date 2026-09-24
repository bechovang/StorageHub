package com.storagehub.controller;

import com.storagehub.dto.auth.AuthSessionResponse;
import com.storagehub.dto.auth.LoginRequest;
import com.storagehub.dto.auth.MeResponse;
import com.storagehub.service.AuthService;
import jakarta.validation.Valid;
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

    @GetMapping("/me")
    public ResponseEntity<MeResponse> getMe(
            Authentication authentication
    ) {
        return ResponseEntity.ok(
                authService.getMe(authentication.getName())
        );
    }
}