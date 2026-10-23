package com.storagehub.exception;

/**
 * Ném ra khi không tìm thấy phân công ca trực (404 Not Found).
 */
public class ShiftNotFoundException extends RuntimeException {
    public ShiftNotFoundException(String message) {
        super(message);
    }
}
