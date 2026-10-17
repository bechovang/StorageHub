package com.storagehub.dto.task;

import com.storagehub.entity.Task;
import jakarta.validation.constraints.NotNull;

public record UpdateTaskStatusRequest(
        @NotNull(message = "Trạng thái mới không được để trống")
        Task.Status status
) {}
