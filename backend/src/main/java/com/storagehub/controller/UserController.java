package com.storagehub.controller;

import com.storagehub.dto.user.*;
import com.storagehub.entity.Role;
import com.storagehub.service.UserService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;

/**
 * Controller quản lý tài khoản người dùng — SYS-01 (FR-37),
 * Lịch sử đăng nhập — SYS-02 (FR-38) & Ma trận phân quyền — (FR-39).
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
     * Lịch sử đăng nhập hệ thống — SYS-02 (FR-38).
     */
    @GetMapping("/login-history")
    public ResponseEntity<LoginHistoryPageResponse> getLoginHistory(
            @RequestParam(name = "userId", required = false) Long userId,
            @RequestParam(name = "status", required = false) String status,
            @RequestParam(name = "query", required = false) String query,
            @RequestParam(name = "startDate", required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(name = "endDate", required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(name = "page", defaultValue = "1") @Min(value = 1, message = "Trang phải từ 1 trở lên") int page,
            @RequestParam(name = "pageSize", defaultValue = "25") @Min(value = 1) @Max(value = 100) int pageSize
    ) {
        return ResponseEntity.ok(userService.getLoginHistory(userId, status, query, startDate, endDate, page, pageSize));
    }

    /**
     * Ma trận phân quyền 5 vai trò cố định — (FR-39).
     */
    @GetMapping("/permissions")
    public ResponseEntity<PermissionMatrixResponse> getPermissionMatrix() {
        return ResponseEntity.ok(userService.getPermissionMatrix());
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
