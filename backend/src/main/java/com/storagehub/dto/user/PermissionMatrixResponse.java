package com.storagehub.dto.user;

import java.util.List;
import java.util.Map;

public record PermissionMatrixResponse(
        List<String> roles,
        List<PermissionGroupDto> groups
) {
    public record PermissionGroupDto(
            String category,
            String description,
            List<PermissionItemDto> permissions
    ) {}

    public record PermissionItemDto(
            String id,
            String name,
            String description,
            Map<String, Boolean> roles
    ) {}
}
