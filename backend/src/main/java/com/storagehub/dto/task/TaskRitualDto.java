package com.storagehub.dto.task;

import com.fasterxml.jackson.annotation.JsonInclude;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record TaskRitualDto(
        Boolean depositVerified,
        Boolean rentCollected,
        Boolean contractSigned,
        String contractPhotoUrl,
        Boolean accessCodeHanded,
        Boolean settlementConfirmed,
        Boolean receiptPrinted,
        Boolean readyForTenant,
        String resolvedNote,
        Boolean escalated,
        String escalationReason
) {
    public static TaskRitualDto empty() {
        return new TaskRitualDto(
                null, null, null, null, null, null, null, null, null, null, null
        );
    }
}
