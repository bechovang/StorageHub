package com.storagehub.service;

import com.storagehub.dto.auth.*;
import com.storagehub.entity.Role;
import com.storagehub.entity.User;
import com.storagehub.exception.AccountLockedException;
import com.storagehub.exception.InvalidCredentialsException;
import com.storagehub.repository.UserRepository;
import com.storagehub.security.JwtService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Locale;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    private final String dummyPasswordHash;

    public AuthService(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            JwtService jwtService
    ) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;

        this.dummyPasswordHash = passwordEncoder.encode(
                "storagehub-dummy-password"
        );
    }

    @Transactional(readOnly = true)
    public AuthSessionResponse login(LoginRequest request) {
        String normalizedEmail =
                normalizeEmail(request.email());

        User user = userRepository
                .findByEmailIgnoreCase(normalizedEmail)
                .orElse(null);

        if (user == null) {
            passwordEncoder.matches(
                    request.password(),
                    dummyPasswordHash
            );

            throw new InvalidCredentialsException();
        }

        boolean passwordMatches = passwordEncoder.matches(
                request.password(),
                user.getPasswordHash()
        );

        if (!passwordMatches) {
            throw new InvalidCredentialsException();
        }

        // Chỉ kiểm tra trạng thái sau khi mật khẩu đúng.
        if (!user.isActive()) {
            throw new AccountLockedException();
        }

        JwtService.TokenResult tokenResult =
                jwtService.generateToken(user);

        return new AuthSessionResponse(
                tokenResult.token(),
                tokenResult.expiresAt(),
                UserSummaryResponse.from(user),
                landingRoute(user.getRole().getName())
        );
    }

    @Transactional(readOnly = true)
    public MeResponse getMe(String email) {
        User user = userRepository
                .findByEmailIgnoreCase(normalizeEmail(email))
                .orElseThrow(InvalidCredentialsException::new);

        if (!user.isActive()) {
            throw new AccountLockedException();
        }

        return MeResponse.from(
                user,
                landingRoute(user.getRole().getName())
        );
    }

    public String landingRoute(Role.Name role) {
        return switch (role) {
            case CUSTOMER -> "/browse";
            case STAFF -> "/tasks";
            case FACILITY_MANAGER -> "/facility";
            case BUSINESS_OPS -> "/overview";
            case SYSTEM_ADMIN -> "/users";
        };
    }

    private String normalizeEmail(String email) {
        return email
                .trim()
                .toLowerCase(Locale.ROOT);
    }
}