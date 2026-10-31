package com.storagehub.exception;

/** Lỗi nghiệp vụ chung (400) — dùng cho Policy/Unit/Ticket API. */
public class BusinessRuleException extends RuntimeException {

    public BusinessRuleException(String message) {
        super(message);
    }
}
