package com.storagehub.service;

import com.storagehub.dto.user.*;
import com.storagehub.entity.Role;

/**
 * Service quản lý người dùng tập trung — SYS-01 (FR-37).
 * Toàn bộ thay đổi trạng thái, vai trò, mật khẩu đều được audit log qua LogService (AD-6).
 */
public interface UserService {

    UserPageResponse listUsers(String query, Role.Name role, Integer status, int page, int pageSize);

    CreateUserResponse createUser(String actorEmail, CreateUserRequest request);

    UserDetailResponse getUserDetail(Long userId);

    UserDetailResponse updateUserStatus(String actorEmail, Long userId, UpdateUserStatusRequest request);

    UserDetailResponse updateUserRole(String actorEmail, Long userId, UpdateUserRoleRequest request);

    ResetPasswordResponse resetPassword(String actorEmail, Long userId);
}
