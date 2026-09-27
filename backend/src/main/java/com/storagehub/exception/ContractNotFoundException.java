package com.storagehub.exception;

/**
 * Ném ra khi không tìm thấy contract (404 Not Found theo openapi.yaml).
 */
public class ContractNotFoundException extends RuntimeException {
    public ContractNotFoundException(String message) {
        super(message);
    }
}
