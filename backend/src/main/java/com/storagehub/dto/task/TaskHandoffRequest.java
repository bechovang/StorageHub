package com.storagehub.dto.task;

import jakarta.validation.constraints.NotNull;

/** Chuyển task cho staff khác (owner hoặc manager). */
public record TaskHandoffRequest(
        @NotNull(message = "staffId không được để trống")
        Long staffId,
        String reason
) {}
