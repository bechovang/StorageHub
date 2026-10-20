package com.storagehub.service;

import com.storagehub.dto.auth.AuthSessionResponse;
import com.storagehub.dto.auth.LoginRequest;
import com.storagehub.entity.Role;
import com.storagehub.entity.User;
import com.storagehub.exception.AccountLockedException;
import com.storagehub.exception.InvalidCredentialsException;
import com.storagehub.repository.RoleRepository;
import com.storagehub.repository.UserRepository;
import com.storagehub.security.JwtService;
import com.storagehub.service.impl.AuthServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.Instant;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private RoleRepository roleRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private JwtService jwtService;

    @Mock
    private LogService logService;

    private AuthServiceImpl authService;

    private User activeUser;
    private Role customerRole;

    @BeforeEach
    void setUp() {
        when(passwordEncoder.encode("storagehub-dummy-password")).thenReturn("dummy-hash");
        authService = new AuthServiceImpl(userRepository, roleRepository, passwordEncoder, jwtService, logService);

        customerRole = new Role();
        customerRole.setName(Role.Name.CUSTOMER);

        activeUser = new User();
        activeUser.setUserId(10L);
        activeUser.setEmail("lan@demo.storagehub.vn");
        activeUser.setFullName("Nguyễn Thị Lan");
        activeUser.setPasswordHash("hashed-password");
        activeUser.setStatus(1); // ACTIVE
        activeUser.setRole(customerRole);
    }

    @Test
    @DisplayName("FR-38: Đăng nhập thành công -> ghi nhận LOGIN (SUCCESS) vào ActivityLog")
    void testLogin_Success_LogsActivity() {
        LoginRequest request = new LoginRequest("lan@demo.storagehub.vn", "Password123!");

        when(userRepository.findByEmailIgnoreCase("lan@demo.storagehub.vn")).thenReturn(Optional.of(activeUser));
        when(passwordEncoder.matches("Password123!", "hashed-password")).thenReturn(true);
        when(jwtService.generateToken(activeUser)).thenReturn(new JwtService.TokenResult("jwt-token", Instant.now().plusSeconds(3600)));

        AuthSessionResponse response = authService.login(request);

        assertThat(response).isNotNull();
        assertThat(response.token()).isEqualTo("jwt-token");

        verify(logService).log(
                eq(activeUser),
                eq("USER"),
                eq(10L),
                eq("LOGIN"),
                isNull(),
                eq("SUCCESS"),
                eq("Đăng nhập thành công")
        );
    }

    @Test
    @DisplayName("FR-38: Đăng nhập sai mật khẩu -> ghi nhận LOGIN_FAILED (Wrong password) và ném InvalidCredentialsException")
    void testLogin_WrongPassword_LogsActivityFailed() {
        LoginRequest request = new LoginRequest("lan@demo.storagehub.vn", "WrongPassword");

        when(userRepository.findByEmailIgnoreCase("lan@demo.storagehub.vn")).thenReturn(Optional.of(activeUser));
        when(passwordEncoder.matches("WrongPassword", "hashed-password")).thenReturn(false);

        assertThatThrownBy(() -> authService.login(request))
                .isInstanceOf(InvalidCredentialsException.class);

        verify(logService).log(
                eq(activeUser),
                eq("USER"),
                eq(10L),
                eq("LOGIN_FAILED"),
                isNull(),
                eq("FAILED"),
                eq("Wrong password")
        );
    }

    @Test
    @DisplayName("FR-38: Đăng nhập tài khoản bị khóa -> ghi nhận LOGIN_FAILED (Account locked) và ném AccountLockedException")
    void testLogin_LockedAccount_LogsActivityFailed() {
        activeUser.setStatus(2); // LOCKED
        LoginRequest request = new LoginRequest("lan@demo.storagehub.vn", "Password123!");

        when(userRepository.findByEmailIgnoreCase("lan@demo.storagehub.vn")).thenReturn(Optional.of(activeUser));
        when(passwordEncoder.matches("Password123!", "hashed-password")).thenReturn(true);

        assertThatThrownBy(() -> authService.login(request))
                .isInstanceOf(AccountLockedException.class);

        verify(logService).log(
                eq(activeUser),
                eq("USER"),
                eq(10L),
                eq("LOGIN_FAILED"),
                isNull(),
                eq("FAILED"),
                eq("Account locked")
        );
    }
}
