package com.storagehub.exception;

import com.storagehub.exception.AccountLockedException;
import com.storagehub.exception.InvalidCredentialsException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.List;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiError> handleValidation(
            MethodArgumentNotValidException exception
    ) {
        List<FieldErrorDetail> fieldErrors =
                exception.getBindingResult()
                        .getFieldErrors()
                        .stream()
                        .map(error -> new FieldErrorDetail(
                                error.getField(),
                                error.getCode(),
                                error.getDefaultMessage()
                        ))
                        .toList();

        return ResponseEntity
                .badRequest()
                .body(new ApiError(
                        "VALIDATION_FAILED",
                        "Invalid request data.",
                        fieldErrors
                ));
    }

    @ExceptionHandler(InvalidCredentialsException.class)
    public ResponseEntity<ApiError> handleInvalidCredentials(
            InvalidCredentialsException exception
    ) {
        return ResponseEntity
                .status(HttpStatus.UNAUTHORIZED)
                .body(ApiError.of(
                        "AUTH_INVALID_CREDENTIALS",
                        "Invalid email or password."
                ));
    }

    @ExceptionHandler(AccountLockedException.class)
    public ResponseEntity<ApiError> handleLockedAccount(
            AccountLockedException exception
    ) {
        return ResponseEntity
                .status(HttpStatus.LOCKED)
                .body(ApiError.of(
                        "AUTH_ACCOUNT_LOCKED",
                        "Account is locked. Please contact your system administrator."
                ));
    }

    @ExceptionHandler(EmailAlreadyExistsException.class)
    public ResponseEntity<ApiError> handleEmailAlreadyExists(
            EmailAlreadyExistsException exception
    ) {
        return ResponseEntity
                .status(HttpStatus.CONFLICT)
                .body(new ApiError(
                        "AUTH_EMAIL_EXISTS",
                        "An account with this email already exists. Sign in or reset your password.",
                        List.of(new FieldErrorDetail("email", "TAKEN", "Email is already in use"))
                ));
    }

    // ------------------------------------------------------------------
    // Unit / Reservation / Contract (US-7, US-9, US-11 — Phúc)
    // ------------------------------------------------------------------

    @ExceptionHandler(UserNotFoundException.class)
    public ResponseEntity<ApiError> handleUserNotFound(
            UserNotFoundException exception
    ) {
        return ResponseEntity
                .status(HttpStatus.NOT_FOUND)
                .body(ApiError.of(
                        "USER_NOT_FOUND",
                        exception.getMessage() != null ? exception.getMessage() : "Không tìm thấy người dùng này."
                ));
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ApiError> handleIllegalArgument(
            IllegalArgumentException exception
    ) {
        return ResponseEntity
                .badRequest()
                .body(ApiError.of(
                        "VALIDATION_FAILED",
                        exception.getMessage()
                ));
    }

    @ExceptionHandler(UnitNotFoundException.class)
    public ResponseEntity<ApiError> handleUnitNotFound(
            UnitNotFoundException exception
    ) {
        return ResponseEntity
                .status(HttpStatus.NOT_FOUND)
                .body(ApiError.of(
                        "UNIT_NOT_FOUND",
                        exception.getMessage() != null ? exception.getMessage() : "Unit này không tồn tại."
                ));
    }

    @ExceptionHandler(ReservationNotFoundException.class)
    public ResponseEntity<ApiError> handleReservationNotFound(
            ReservationNotFoundException exception
    ) {
        return ResponseEntity
                .status(HttpStatus.NOT_FOUND)
                .body(ApiError.of(
                        "RESERVATION_NOT_FOUND",
                        exception.getMessage()
                ));
    }

    @ExceptionHandler(ContractNotFoundException.class)
    public ResponseEntity<ApiError> handleContractNotFound(
            ContractNotFoundException exception
    ) {
        return ResponseEntity
                .status(HttpStatus.NOT_FOUND)
                .body(ApiError.of(
                        "CONTRACT_NOT_FOUND",
                        exception.getMessage() != null ? exception.getMessage() : "Không tìm thấy hợp đồng này."
                ));
    }

    @ExceptionHandler(ContractAddendumNotFoundException.class)
    public ResponseEntity<ApiError> handleContractAddendumNotFound(
            ContractAddendumNotFoundException exception
    ) {
        return ResponseEntity
                .status(HttpStatus.NOT_FOUND)
                .body(ApiError.of(
                        "CONTRACT_ADDENDUM_NOT_FOUND",
                        exception.getMessage() != null ? exception.getMessage() : "Không tìm thấy phụ lục này."
                ));
    }

    @ExceptionHandler(ContractAddendumInvalidStateException.class)
    public ResponseEntity<ApiError> handleContractAddendumInvalidState(
            ContractAddendumInvalidStateException exception
    ) {
        return ResponseEntity
                .status(HttpStatus.CONFLICT)
                .body(ApiError.of(
                        "CONTRACT_ADDENDUM_INVALID_STATE",
                        exception.getMessage()
                ));
    }

    @ExceptionHandler(ReservationInvalidStateException.class)
    public ResponseEntity<ApiError> handleReservationInvalidState(
            ReservationInvalidStateException exception
    ) {
        return ResponseEntity
                .status(HttpStatus.CONFLICT)
                .body(ApiError.of(
                        "RESERVATION_INVALID_STATE",
                        exception.getMessage()
                ));
    }

    @ExceptionHandler(BookingUnitTakenException.class)
    public ResponseEntity<ApiError> handleBookingUnitTaken(
            BookingUnitTakenException exception
    ) {
        return ResponseEntity
                .status(HttpStatus.CONFLICT)
                .body(ApiError.of(
                        "BOOKING_UNIT_TAKEN",
                        exception.getMessage() != null ? exception.getMessage() : "Unit vừa bị chiếm / ngày không còn hợp lệ"
                ));
    }

    // ------------------------------------------------------------------
    // Task Board (US-14, FR-21 / FR-22 snap-back — Phúc)
    // ------------------------------------------------------------------

    @ExceptionHandler(TaskNotFoundException.class)
    public ResponseEntity<ApiError> handleTaskNotFound(
            TaskNotFoundException exception
    ) {
        return ResponseEntity
                .status(HttpStatus.NOT_FOUND)
                .body(ApiError.of(
                        "TASK_NOT_FOUND",
                        exception.getMessage() != null ? exception.getMessage() : "Không tìm thấy nhiệm vụ này."
                ));
    }

    @ExceptionHandler(TaskSnapBackException.class)
    public ResponseEntity<ApiError> handleTaskSnapBack(
            TaskSnapBackException exception
    ) {
        return ResponseEntity
                .status(HttpStatus.CONFLICT)
                .body(ApiError.of(
                        "TASK_SNAP_BACK",
                        exception.getMessage() != null ? exception.getMessage() : "Chặn Done ảo: thiếu bước chốt nghiệp vụ."
                ));
    }

    @ExceptionHandler(PaymentNotFoundException.class)
    public ResponseEntity<ApiError> handlePaymentNotFound(
            PaymentNotFoundException exception
    ) {
        return ResponseEntity
                .status(HttpStatus.NOT_FOUND)
                .body(ApiError.of(
                        "PAYMENT_NOT_FOUND",
                        exception.getMessage()
                ));
    }

    @ExceptionHandler(PaymentDuplicateException.class)
    public ResponseEntity<ApiError> handlePaymentDuplicate(
            PaymentDuplicateException exception
    ) {
        return ResponseEntity
                .status(HttpStatus.CONFLICT)
                .body(ApiError.of(
                        "PAYMENT_DUPLICATE",
                        exception.getMessage()
                ));
    }

    @ExceptionHandler(PaymentInvalidStateException.class)
    public ResponseEntity<ApiError> handlePaymentInvalidState(
            PaymentInvalidStateException exception
    ) {
        return ResponseEntity
                .status(HttpStatus.CONFLICT)
                .body(ApiError.of(
                        "PAYMENT_INVALID_STATE",
                        exception.getMessage()
                ));
    }

    @ExceptionHandler(PaymentExpiredException.class)
    public ResponseEntity<ApiError> handlePaymentExpired(
            PaymentExpiredException exception
    ) {
        return ResponseEntity
                .status(HttpStatus.CONFLICT)
                .body(ApiError.of(
                        "PAYMENT_EXPIRED",
                        exception.getMessage()
                ));
    }

    @ExceptionHandler(PaymentBadRequestException.class)
    public ResponseEntity<ApiError> handlePaymentBadRequest(
            PaymentBadRequestException exception
    ) {
        return ResponseEntity
                .badRequest()
                .body(ApiError.of(
                        "VALIDATION_FAILED",
                        exception.getMessage()
                ));
    }

    /** Webhook PayOS sai chữ ký / sai shape / lệch tiền → 400 cho PayOS retry. */
    @ExceptionHandler(PaymentWebhookException.class)
    public ResponseEntity<ApiError> handlePaymentWebhook(
            PaymentWebhookException exception
    ) {
        return ResponseEntity
                .badRequest()
                .body(ApiError.of(
                        "PAYMENT_WEBHOOK_INVALID",
                        exception.getMessage()
                ));
    }

    /** Cổng ngoài (PayOS) lỗi mạng/HTTP → 502, không phải lỗi nghiệp vụ. */
    @ExceptionHandler(PaymentGatewayException.class)
    public ResponseEntity<ApiError> handlePaymentGateway(
            PaymentGatewayException exception
    ) {
        return ResponseEntity
                .status(HttpStatus.BAD_GATEWAY)
                .body(ApiError.of(
                        "PAYMENT_GATEWAY_ERROR",
                        "Cổng thanh toán tạm thời không phản hồi. Vui lòng thử lại."
                ));
    }

    // ------------------------------------------------------------------
    // Cross-cutting
    // ------------------------------------------------------------------

    /** Ownership violation từ service (vd: trả reservation của người khác) → 403. */
    @ExceptionHandler(org.springframework.security.access.AccessDeniedException.class)
    public ResponseEntity<ApiError> handleAccessDenied(
            org.springframework.security.access.AccessDeniedException exception
    ) {
        return ResponseEntity
                .status(HttpStatus.FORBIDDEN)
                .body(ApiError.of(
                        "ROLE_FORBIDDEN",
                        "You do not have permission to access this resource."
                ));
    }

    @ExceptionHandler(jakarta.validation.ConstraintViolationException.class)
    public ResponseEntity<ApiError> handleConstraintViolation(
            jakarta.validation.ConstraintViolationException exception
    ) {
        List<FieldErrorDetail> fieldErrors = exception.getConstraintViolations().stream()
                .map(v -> new FieldErrorDetail(
                        v.getPropertyPath().toString(),
                        "INVALID",
                        v.getMessage()
                ))
                .toList();

        return ResponseEntity
                .badRequest()
                .body(new ApiError(
                        "VALIDATION_FAILED",
                        "Invalid request data.",
                        fieldErrors
                ));
    }

    @ExceptionHandler(org.springframework.web.method.annotation.HandlerMethodValidationException.class)
    public ResponseEntity<ApiError> handleHandlerMethodValidation(
            org.springframework.web.method.annotation.HandlerMethodValidationException exception
    ) {
        List<FieldErrorDetail> fieldErrors = exception.getParameterValidationResults().stream()
                .flatMap(r -> r.getResolvableErrors().stream().map(e -> new FieldErrorDetail(
                        r.getMethodParameter().getParameterName() != null ? r.getMethodParameter().getParameterName() : "param",
                        "INVALID",
                        e.getDefaultMessage()
                )))
                .toList();

        return ResponseEntity
                .badRequest()
                .body(new ApiError(
                        "VALIDATION_FAILED",
                        "Invalid request data.",
                        fieldErrors
                ));
    }

    @ExceptionHandler(ShiftConflictException.class)
    public ResponseEntity<ApiError> handleShiftConflict(
            ShiftConflictException exception
    ) {
        return ResponseEntity
                .status(HttpStatus.CONFLICT)
                .body(new ApiError(
                        "SHIFT_ASSIGNMENT_CONFLICT",
                        exception.getMessage(),
                        List.of(new FieldErrorDetail("shift", "CONFLICT", "Trùng ca trực"))
                ));
    }

    @ExceptionHandler(ShiftNotFoundException.class)
    public ResponseEntity<ApiError> handleShiftNotFound(
            ShiftNotFoundException exception
    ) {
        return ResponseEntity
                .status(HttpStatus.NOT_FOUND)
                .body(ApiError.of(
                        "SHIFT_NOT_FOUND",
                        exception.getMessage() != null ? exception.getMessage() : "Không tìm thấy phân công ca trực này."
                ));
    }
}
