package com.storagehub.exception;

/**
 * Ném ra khi phụ lục hợp đồng không ở trạng thái hợp lệ để ký hoặc quá hạn 7 ngày (409 Conflict).
 */
public class ContractAddendumInvalidStateException extends RuntimeException {
    public ContractAddendumInvalidStateException(String message) {
        super(message);
    }
}
