package com.storagehub.exception;

public class TaskNotFoundException extends RuntimeException {

    public TaskNotFoundException(String message) {
        super(message);
    }

    public TaskNotFoundException(Long taskId) {
        super("Không tìm thấy nhiệm vụ #" + taskId);
    }
}
