package com.storagehub.dto.task;

public record CompleteCheckoutRequest(
        Long refundAmount,
        Long damageFee
) {}
