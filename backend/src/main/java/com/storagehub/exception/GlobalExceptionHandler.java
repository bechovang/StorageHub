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
}