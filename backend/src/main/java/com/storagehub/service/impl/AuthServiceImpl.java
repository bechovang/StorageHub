package com.storagehub.service.impl;

import com.storagehub.dto.auth.*;
import com.storagehub.entity.Role;
import com.storagehub.entity.User;
import com.storagehub.exception.AccountLockedException;
import com.storagehub.exception.EmailAlreadyExistsException;
import com.storagehub.exception.InvalidCredentialsException;
import com.storagehub.repository.RoleRepository;
import com.storagehub.repository.UserRepository;
import com.storagehub.security.JwtService;
import com.storagehub.service.AuthService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Locale;

@Service
public class AuthServiceImpl implements AuthService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    private final String dummyPasswordHash;

    public AuthServiceImpl(
            UserRepository userRepository,
            RoleRepository roleRepository,
            PasswordEncoder passwordEncoder,
            JwtService jwtService
    ) {
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;

        this.dummyPasswordHash = passwordEncoder.encode(
                "storagehub-dummy-password"
        );
    }

    @Override
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

    @Override
    @Transactional
    public AuthSessionResponse register(RegisterRequest request) {
        String normalizedEmail = normalizeEmail(request.email());

        if (userRepository.findByEmailIgnoreCase(normalizedEmail).isPresent()) {
            throw new EmailAlreadyExistsException();
        }

        Role customerRole = roleRepository.findByName(Role.Name.CUSTOMER)
                .orElseThrow(() -> new IllegalStateException("CUSTOMER role not found in database"));

        User user = new User();
        user.setFullName(request.fullName().trim());
        user.setEmail(normalizedEmail);
        user.setPhone(request.phone().trim());
        user.setPasswordHash(passwordEncoder.encode(request.password()));
        user.setRole(customerRole);
        user.setStatus(1); // 1 = active
        user.setFacility(null);

        User savedUser = userRepository.save(user);

        JwtService.TokenResult tokenResult = jwtService.generateToken(savedUser);

        return new AuthSessionResponse(
                tokenResult.token(),
                tokenResult.expiresAt(),
                UserSummaryResponse.from(savedUser),
                landingRoute(savedUser.getRole().getName())
        );
    }

    @Override
    public ForgotPasswordResponse forgotPassword(ForgotPasswordRequest request) {
        // FR-3 & AD-5: Generic response stub, does not send real email in v1
        return ForgotPasswordResponse.defaultMessage();
    }

    @Override
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

    private String landingRoute(Role.Name role) {
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
