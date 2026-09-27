package com.storagehub.exception;

/**
 * Ném ra khi unit bị chiếm giữa chừng hoặc ngày không còn hợp lệ (FR-5, 409 Conflict).
 */
public class BookingUnitTakenException extends RuntimeException {
    public BookingUnitTakenException(String message) {
        super(message);
    }
}
