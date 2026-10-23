package com.storagehub.service;

import com.storagehub.dto.user.*;
import com.storagehub.entity.Role;

import java.time.LocalDate;

/**
 * Service quản lý người dùng tập trung — SYS-01 (FR-37) & SYS-02 (FR-38) & Permission Matrix (FR-39).
 * Toàn bộ thay đổi trạng thái, vai trò, mật khẩu đều được audit log qua LogService (AD-6).
 */
public interface UserService {

    UserPageResponse listUsers(String query, Role.Name role, Integer status, int page, int pageSize);

    CreateUserResponse createUser(String actorEmail, CreateUserRequest request);

    UserDetailResponse getUserDetail(Long userId);

    UserDetailResponse updateUserStatus(String actorEmail, Long userId, UpdateUserStatusRequest request);

    UserDetailResponse updateUserRole(String actorEmail, Long userId, UpdateUserRoleRequest request);

    ResetPasswordResponse resetPassword(String actorEmail, Long userId);

    LoginHistoryPageResponse getLoginHistory(
            Long userId,
            String status,
            String query,
            LocalDate startDate,
            LocalDate endDate,
            int page,
            int pageSize
    );

    PermissionMatrixResponse getPermissionMatrix();
}
