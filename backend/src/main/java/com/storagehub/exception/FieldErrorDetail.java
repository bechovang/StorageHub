package com.storagehub.exception;

public record FieldErrorDetail(
        String field,
        String code,
        String message
) {
}