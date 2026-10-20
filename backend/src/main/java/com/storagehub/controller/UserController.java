package com.storagehub.controller;

import com.storagehub.dto.user.*;
import com.storagehub.entity.Role;
import com.storagehub.service.UserService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

/**
 * Controller quản lý tài khoản người dùng — SYS-01 (FR-37).
 * Toàn bộ các thao tác được bảo vệ chỉ dành cho SYSTEM_ADMIN.
 */
@RestController
@RequestMapping("/api/v1/users")
@Validated
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    /**
     * Danh sách người dùng có tìm kiếm, lọc theo vai trò và trạng thái, phân trang.
     */
    @GetMapping
    public ResponseEntity<UserPageResponse> listUsers(
            @RequestParam(name = "query", required = false) String query,
            @RequestParam(name = "role", required = false) Role.Name role,
            @RequestParam(name = "status", required = false) Integer status,
            @RequestParam(name = "page", defaultValue = "1") @Min(value = 1, message = "Trang phải từ 1 trở lên") int page,
            @RequestParam(name = "page-size", defaultValue = "20") @Min(value = 1) @Max(value = 100) int pageSize
    ) {
        return ResponseEntity.ok(userService.listUsers(query, role, status, page, pageSize));
    }

    /**
     * Tạo tài khoản người dùng mới kèm mật khẩu tạm (FR-37).
     */
    @PostMapping
    public ResponseEntity<CreateUserResponse> createUser(
            @Valid @RequestBody CreateUserRequest request,
            Authentication authentication
    ) {
        String actorEmail = authentication != null ? authentication.getName() : "";
        CreateUserResponse response = userService.createUser(actorEmail, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * Chi tiết người dùng theo ID (FR-37).
     */
    @GetMapping("/{userId}")
    public ResponseEntity<UserDetailResponse> getUserDetail(
            @PathVariable("userId") Long userId
    ) {
        return ResponseEntity.ok(userService.getUserDetail(userId));
    }

    /**
     * Cập nhật trạng thái người dùng (Activate / Deactivate / Lock) (FR-37).
     */
    @PatchMapping("/{userId}/status")
    public ResponseEntity<UserDetailResponse> updateUserStatus(
            @PathVariable("userId") Long userId,
            @Valid @RequestBody UpdateUserStatusRequest request,
            Authentication authentication
    ) {
        String actorEmail = authentication != null ? authentication.getName() : "";
        return ResponseEntity.ok(userService.updateUserStatus(actorEmail, userId, request));
    }

    /**
     * Đổi vai trò người dùng (FR-37).
     */
    @PatchMapping("/{userId}/role")
    public ResponseEntity<UserDetailResponse> updateUserRole(
            @PathVariable("userId") Long userId,
            @Valid @RequestBody UpdateUserRoleRequest request,
            Authentication authentication
    ) {
        String actorEmail = authentication != null ? authentication.getName() : "";
        return ResponseEntity.ok(userService.updateUserRole(actorEmail, userId, request));
    }

    /**
     * Cấp lại mật khẩu tạm mới (FR-37).
     */
    @PostMapping("/{userId}/reset-password")
    public ResponseEntity<ResetPasswordResponse> resetPassword(
            @PathVariable("userId") Long userId,
            Authentication authentication
    ) {
        String actorEmail = authentication != null ? authentication.getName() : "";
        return ResponseEntity.ok(userService.resetPassword(actorEmail, userId));
    }
}
