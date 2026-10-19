package com.storagehub.exception;

/**
 * Ném ra khi không tìm thấy phụ lục hợp đồng (404 Not Found theo openapi.yaml).
 */
public class ContractAddendumNotFoundException extends RuntimeException {
    public ContractAddendumNotFoundException(String message) {
        super(message);
    }
}
