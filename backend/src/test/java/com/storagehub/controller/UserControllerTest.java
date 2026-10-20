package com.storagehub.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.storagehub.dto.user.*;
import com.storagehub.entity.Role;
import com.storagehub.exception.UserNotFoundException;
import com.storagehub.repository.UserRepository;
import com.storagehub.security.JwtService;
import com.storagehub.service.UserService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.TestingAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;
import java.util.List;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(UserController.class)
@AutoConfigureMockMvc(addFilters = false)
class UserControllerTest {

    @Autowired
    private MockMvc mockMvc;

    private final ObjectMapper objectMapper = new ObjectMapper().findAndRegisterModules();

    @MockitoBean
    private UserService userService;

    @MockitoBean
    private JwtService jwtService;

    @MockitoBean
    private UserRepository userRepository;

    private final Authentication adminAuth =
            new TestingAuthenticationToken("admin@storagehub.vn", null, "ROLE_SYSTEM_ADMIN");

    @Test
    @DisplayName("GET /api/v1/users: 200 OK trả về danh sách phân trang")
    void testListUsers_Success() throws Exception {
        UserDetailResponse userDetail = new UserDetailResponse(
                1L, "Nguyễn Văn Admin", "admin@storagehub.vn", "0901234567",
                Role.Name.SYSTEM_ADMIN, null, 1, LocalDateTime.now()
        );
        UserPageResponse pageResponse = new UserPageResponse(
                List.of(userDetail), 1, 20, 1L, 1
        );

        when(userService.listUsers(any(), any(), any(), eq(1), eq(20)))
                .thenReturn(pageResponse);

        mockMvc.perform(get("/api/v1/users")
                        .principal(adminAuth)
                        .param("page", "1")
                        .param("page-size", "20"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items").isArray())
                .andExpect(jsonPath("$.items[0].email").value("admin@storagehub.vn"))
                .andExpect(jsonPath("$.totalItems").value(1));
    }

    @Test
    @DisplayName("POST /api/v1/users: 201 Created trả về UserDetail và temporaryPassword")
    void testCreateUser_Success() throws Exception {
        CreateUserRequest request = new CreateUserRequest(
                "Trần Văn Staff", "staff@storagehub.vn", "0987654321", Role.Name.STAFF, null
        );
        UserDetailResponse userDetail = new UserDetailResponse(
                2L, "Trần Văn Staff", "staff@storagehub.vn", "0987654321",
                Role.Name.STAFF, null, 1, LocalDateTime.now()
        );
        CreateUserResponse response = new CreateUserResponse(userDetail, "TempPass#123");

        when(userService.createUser(eq("admin@storagehub.vn"), any(CreateUserRequest.class)))
                .thenReturn(response);

        mockMvc.perform(post("/api/v1/users")
                        .principal(adminAuth)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.user.id").value(2))
                .andExpect(jsonPath("$.user.email").value("staff@storagehub.vn"))
                .andExpect(jsonPath("$.temporaryPassword").value("TempPass#123"));
    }

    @Test
    @DisplayName("POST /api/v1/users: 400 Bad Request khi thiếu fullName hoặc email không hợp lệ")
    void testCreateUser_ValidationFailed() throws Exception {
        CreateUserRequest badRequest = new CreateUserRequest(
                "", "not-an-email", null, null, null
        );

        mockMvc.perform(post("/api/v1/users")
                        .principal(adminAuth)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(badRequest)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("VALIDATION_FAILED"));
    }

    @Test
    @DisplayName("GET /api/v1/users/{userId}: 200 OK trả về chi tiết người dùng")
    void testGetUserDetail_Success() throws Exception {
        UserDetailResponse userDetail = new UserDetailResponse(
                1L, "Nguyễn Văn Admin", "admin@storagehub.vn", "0901234567",
                Role.Name.SYSTEM_ADMIN, null, 1, LocalDateTime.now()
        );

        when(userService.getUserDetail(1L)).thenReturn(userDetail);

        mockMvc.perform(get("/api/v1/users/1")
                        .principal(adminAuth))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.role").value("SYSTEM_ADMIN"));
    }

    @Test
    @DisplayName("GET /api/v1/users/{userId}: 404 Not Found khi không tìm thấy")
    void testGetUserDetail_NotFound() throws Exception {
        when(userService.getUserDetail(99L)).thenThrow(new UserNotFoundException("Không tìm thấy người dùng"));

        mockMvc.perform(get("/api/v1/users/99")
                        .principal(adminAuth))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.code").value("USER_NOT_FOUND"));
    }

    @Test
    @DisplayName("PATCH /api/v1/users/{userId}/status: 200 OK cập nhật trạng thái")
    void testUpdateUserStatus_Success() throws Exception {
        UpdateUserStatusRequest request = new UpdateUserStatusRequest(2, "Khóa tài khoản do vi phạm");
        UserDetailResponse updated = new UserDetailResponse(
                2L, "Staff User", "staff@storagehub.vn", null,
                Role.Name.STAFF, null, 2, LocalDateTime.now()
        );

        when(userService.updateUserStatus(eq("admin@storagehub.vn"), eq(2L), any(UpdateUserStatusRequest.class)))
                .thenReturn(updated);

        mockMvc.perform(patch("/api/v1/users/2/status")
                        .principal(adminAuth)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value(2));
    }

    @Test
    @DisplayName("PATCH /api/v1/users/{userId}/status: 400 Bad Request khi status ngoài khoảng 0..2")
    void testUpdateUserStatus_InvalidStatus() throws Exception {
        UpdateUserStatusRequest badRequest = new UpdateUserStatusRequest(99, "Sai");

        mockMvc.perform(patch("/api/v1/users/2/status")
                        .principal(adminAuth)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(badRequest)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("VALIDATION_FAILED"));
    }

    @Test
    @DisplayName("PATCH /api/v1/users/{userId}/role: 200 OK đổi vai trò")
    void testUpdateUserRole_Success() throws Exception {
        UpdateUserRoleRequest request = new UpdateUserRoleRequest(Role.Name.BUSINESS_OPS);
        UserDetailResponse updated = new UserDetailResponse(
                2L, "User", "ops@storagehub.vn", null,
                Role.Name.BUSINESS_OPS, null, 1, LocalDateTime.now()
        );

        when(userService.updateUserRole(eq("admin@storagehub.vn"), eq(2L), any(UpdateUserRoleRequest.class)))
                .thenReturn(updated);

        mockMvc.perform(patch("/api/v1/users/2/role")
                        .principal(adminAuth)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.role").value("BUSINESS_OPS"));
    }

    @Test
    @DisplayName("POST /api/v1/users/{userId}/reset-password: 200 OK cấp mật khẩu mới")
    void testResetPassword_Success() throws Exception {
        ResetPasswordResponse response = new ResetPasswordResponse(2L, "staff@storagehub.vn", "NewResetPass#1");

        when(userService.resetPassword(eq("admin@storagehub.vn"), eq(2L)))
                .thenReturn(response);

        mockMvc.perform(post("/api/v1/users/2/reset-password")
                        .principal(adminAuth))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.userId").value(2))
                .andExpect(jsonPath("$.email").value("staff@storagehub.vn"))
                .andExpect(jsonPath("$.temporaryPassword").value("NewResetPass#1"));
    }
}
