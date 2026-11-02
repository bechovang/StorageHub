package com.storagehub.dto.task;

/** Kết quả xử lý sự cố tại Task Board (resolve hoặc escalate). */
public record SupportRitualRequest(
        Boolean escalated,
        String resolutionNote,
        String escalationReason
) {}
