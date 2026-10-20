package com.storagehub.service;

import com.storagehub.dto.user.*;
import com.storagehub.entity.Facility;
import com.storagehub.entity.Role;
import com.storagehub.entity.User;
import com.storagehub.exception.EmailAlreadyExistsException;
import com.storagehub.exception.UserNotFoundException;
import com.storagehub.repository.FacilityRepository;
import com.storagehub.repository.RoleRepository;
import com.storagehub.repository.UserRepository;
import com.storagehub.service.impl.UserServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class UserServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private RoleRepository roleRepository;

    @Mock
    private FacilityRepository facilityRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private LogService logService;

    @InjectMocks
    private UserServiceImpl userService;

    private User adminActor;
    private Role adminRole;
    private Role staffRole;

    @BeforeEach
    void setUp() {
        adminRole = new Role();
        adminRole.setRoleId(5);
        adminRole.setName(Role.Name.SYSTEM_ADMIN);

        staffRole = new Role();
        staffRole.setRoleId(2);
        staffRole.setName(Role.Name.STAFF);

        adminActor = new User();
        adminActor.setUserId(1L);
        adminActor.setFullName("Admin User");
        adminActor.setEmail("admin@storagehub.vn");
        adminActor.setRole(adminRole);
        adminActor.setStatus(1);
        adminActor.setCreatedAt(LocalDateTime.now());
    }

    @Test
    @DisplayName("listUsers: Phân trang và tìm kiếm thành công")
    void testListUsers_Success() {
        User user1 = new User();
        user1.setUserId(2L);
        user1.setFullName("Staff One");
        user1.setEmail("staff1@demo.vn");
        user1.setRole(staffRole);
        user1.setStatus(1);
        user1.setCreatedAt(LocalDateTime.now());

        when(userRepository.findUsers(eq("staff"), eq(Role.Name.STAFF), eq(1), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of(user1)));

        UserPageResponse result = userService.listUsers("staff", Role.Name.STAFF, 1, 1, 20);

        assertThat(result).isNotNull();
        assertThat(result.items()).hasSize(1);
        assertThat(result.items().get(0).email()).isEqualTo("staff1@demo.vn");
        assertThat(result.totalItems()).isEqualTo(1);
    }

    @Test
    @DisplayName("createUser: Tạo người dùng thành công kèm mật khẩu tạm và ghi audit log")
    void testCreateUser_Success() {
        CreateUserRequest request = new CreateUserRequest(
                "New Staff",
                "staff.new@demo.vn",
                "0909123456",
                Role.Name.STAFF,
                null
        );

        when(userRepository.findByEmailIgnoreCase("admin@storagehub.vn")).thenReturn(Optional.of(adminActor));
        when(userRepository.existsByEmailIgnoreCase("staff.new@demo.vn")).thenReturn(false);
        when(roleRepository.findByName(Role.Name.STAFF)).thenReturn(Optional.of(staffRole));
        when(passwordEncoder.encode(anyString())).thenReturn("hashed-secret");
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> {
            User u = invocation.getArgument(0);
            u.setUserId(10L);
            u.setCreatedAt(LocalDateTime.now());
            return u;
        });

        CreateUserResponse response = userService.createUser("admin@storagehub.vn", request);

        assertThat(response).isNotNull();
        assertThat(response.user().id()).isEqualTo(10L);
        assertThat(response.user().email()).isEqualTo("staff.new@demo.vn");
        assertThat(response.temporaryPassword()).hasSize(10);

        verify(logService).log(eq(adminActor), eq("USER"), eq(10L), eq("USER_CREATED"), isNull(), eq("STAFF"), anyString());
    }

    @Test
    @DisplayName("createUser: Email đã tồn tại ném EmailAlreadyExistsException")
    void testCreateUser_EmailExists() {
        CreateUserRequest request = new CreateUserRequest(
                "Duplicate Staff",
                "admin@storagehub.vn",
                "0909123456",
                Role.Name.STAFF,
                null
        );

        when(userRepository.findByEmailIgnoreCase("admin@storagehub.vn")).thenReturn(Optional.of(adminActor));
        when(userRepository.existsByEmailIgnoreCase("admin@storagehub.vn")).thenReturn(true);

        assertThatThrownBy(() -> userService.createUser("admin@storagehub.vn", request))
                .isInstanceOf(EmailAlreadyExistsException.class);

        verify(userRepository, never()).save(any());
    }

    @Test
    @DisplayName("getUserDetail: Tìm thấy người dùng")
    void testGetUserDetail_Success() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(adminActor));

        UserDetailResponse response = userService.getUserDetail(1L);

        assertThat(response).isNotNull();
        assertThat(response.id()).isEqualTo(1L);
        assertThat(response.role()).isEqualTo(Role.Name.SYSTEM_ADMIN);
    }

    @Test
    @DisplayName("getUserDetail: Không tìm thấy ném UserNotFoundException")
    void testGetUserDetail_NotFound() {
        when(userRepository.findById(999L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> userService.getUserDetail(999L))
                .isInstanceOf(UserNotFoundException.class);
    }

    @Test
    @DisplayName("updateUserStatus: Đổi trạng thái thành công và ghi log")
    void testUpdateUserStatus_Success() {
        User targetUser = new User();
        targetUser.setUserId(2L);
        targetUser.setEmail("staff@demo.vn");
        targetUser.setRole(staffRole);
        targetUser.setStatus(1);

        UpdateUserStatusRequest request = new UpdateUserStatusRequest(0, "Nghỉ việc");

        when(userRepository.findByEmailIgnoreCase("admin@storagehub.vn")).thenReturn(Optional.of(adminActor));
        when(userRepository.findById(2L)).thenReturn(Optional.of(targetUser));
        when(userRepository.save(any(User.class))).thenReturn(targetUser);

        UserDetailResponse response = userService.updateUserStatus("admin@storagehub.vn", 2L, request);

        assertThat(response).isNotNull();
        assertThat(targetUser.getStatus()).isEqualTo(0);
        verify(logService).log(eq(adminActor), eq("USER"), eq(2L), eq("STATUS_CHANGED"), eq("1"), eq("0"), eq("Nghỉ việc"));
    }

    @Test
    @DisplayName("updateUserStatus: Anti-lockout cấm Admin tự deactivate chính mình")
    void testUpdateUserStatus_AntiLockout() {
        UpdateUserStatusRequest request = new UpdateUserStatusRequest(0, "Tự khóa");

        when(userRepository.findByEmailIgnoreCase("admin@storagehub.vn")).thenReturn(Optional.of(adminActor));
        when(userRepository.findById(1L)).thenReturn(Optional.of(adminActor));

        assertThatThrownBy(() -> userService.updateUserStatus("admin@storagehub.vn", 1L, request))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("không được phép tự vô hiệu hóa");
    }

    @Test
    @DisplayName("updateUserRole: Đổi vai trò thành công và ghi log")
    void testUpdateUserRole_Success() {
        User targetUser = new User();
        targetUser.setUserId(2L);
        targetUser.setEmail("staff@demo.vn");
        targetUser.setRole(staffRole);

        Role fmRole = new Role();
        fmRole.setRoleId(3);
        fmRole.setName(Role.Name.FACILITY_MANAGER);

        UpdateUserRoleRequest request = new UpdateUserRoleRequest(Role.Name.FACILITY_MANAGER);

        when(userRepository.findByEmailIgnoreCase("admin@storagehub.vn")).thenReturn(Optional.of(adminActor));
        when(userRepository.findById(2L)).thenReturn(Optional.of(targetUser));
        when(roleRepository.findByName(Role.Name.FACILITY_MANAGER)).thenReturn(Optional.of(fmRole));
        when(userRepository.save(any(User.class))).thenReturn(targetUser);

        UserDetailResponse response = userService.updateUserRole("admin@storagehub.vn", 2L, request);

        assertThat(response).isNotNull();
        assertThat(targetUser.getRole().getName()).isEqualTo(Role.Name.FACILITY_MANAGER);
        verify(logService).log(eq(adminActor), eq("USER"), eq(2L), eq("ROLE_CHANGED"), eq("STAFF"), eq("FACILITY_MANAGER"), anyString());
    }

    @Test
    @DisplayName("updateUserRole: Anti-lockout cấm Admin tự hạ quyền của chính mình")
    void testUpdateUserRole_AntiLockout() {
        UpdateUserRoleRequest request = new UpdateUserRoleRequest(Role.Name.CUSTOMER);

        when(userRepository.findByEmailIgnoreCase("admin@storagehub.vn")).thenReturn(Optional.of(adminActor));
        when(userRepository.findById(1L)).thenReturn(Optional.of(adminActor));

        assertThatThrownBy(() -> userService.updateUserRole("admin@storagehub.vn", 1L, request))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("không được phép tự hạ vai trò");
    }

    @Test
    @DisplayName("resetPassword: Cấp lại mật khẩu tạm thành công")
    void testResetPassword_Success() {
        User targetUser = new User();
        targetUser.setUserId(2L);
        targetUser.setEmail("target@demo.vn");

        when(userRepository.findByEmailIgnoreCase("admin@storagehub.vn")).thenReturn(Optional.of(adminActor));
        when(userRepository.findById(2L)).thenReturn(Optional.of(targetUser));
        when(passwordEncoder.encode(anyString())).thenReturn("new-hash");

        ResetPasswordResponse response = userService.resetPassword("admin@storagehub.vn", 2L);

        assertThat(response).isNotNull();
        assertThat(response.userId()).isEqualTo(2L);
        assertThat(response.email()).isEqualTo("target@demo.vn");
        assertThat(response.temporaryPassword()).hasSize(10);

        verify(userRepository).save(targetUser);
        verify(logService).log(eq(adminActor), eq("USER"), eq(2L), eq("PASSWORD_RESET"), isNull(), isNull(), anyString());
    }
}
