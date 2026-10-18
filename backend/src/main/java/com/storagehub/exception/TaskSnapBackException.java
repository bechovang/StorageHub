package com.storagehub.exception;

import lombok.Getter;

/**
 * Vi phạm Snap-back chống Done ảo (FR-22 / AD-8 / NFR-2).
 * Kéo thẻ sang Done khi còn thiếu closing step -> bắn exception để card bật lại và toast nêu đúng bước thiếu.
 */
@Getter
public class TaskSnapBackException extends RuntimeException {

    private final String closingStep;

    public TaskSnapBackException(String message) {
        super(message);
        this.closingStep = "UNSPECIFIED";
    }

    public TaskSnapBackException(String message, String closingStep) {
        super(message);
        this.closingStep = closingStep;
    }
}
