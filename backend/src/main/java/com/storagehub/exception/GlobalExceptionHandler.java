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
}