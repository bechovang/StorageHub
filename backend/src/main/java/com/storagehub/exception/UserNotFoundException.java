package com.storagehub.exception;

/**
 * Ném ra khi không tìm thấy người dùng theo ID (404 Not Found theo openapi.yaml).
 */
public class UserNotFoundException extends RuntimeException {
    public UserNotFoundException(String message) {
        super(message);
    }
}
