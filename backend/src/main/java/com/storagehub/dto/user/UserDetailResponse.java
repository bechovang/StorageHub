package com.storagehub.dto.user;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.storagehub.entity.Role;
import com.storagehub.entity.User;

import java.time.LocalDateTime;

/**
 * Chi tiết người dùng theo schema UserDetail trong contracts/openapi.yaml (FR-37).
 */
public record UserDetailResponse(
        Long id,
        String fullName,
        String email,
        String phone,
        Role.Name role,
        Long facilityId,
        Integer status,
        @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd'T'HH:mm:ss'Z'")
        LocalDateTime createdAt
) {
    public static UserDetailResponse from(User user) {
        if (user == null) {
            return null;
        }
        return new UserDetailResponse(
                user.getUserId(),
                user.getFullName(),
                user.getEmail(),
                user.getPhone(),
                user.getRole() != null ? user.getRole().getName() : null,
                user.getFacility() != null ? user.getFacility().getFacilityId().longValue() : null,
                user.getStatus(),
                user.getCreatedAt()
        );
    }
}
