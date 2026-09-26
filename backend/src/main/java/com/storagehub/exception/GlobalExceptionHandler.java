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

    /** Ownership violation từ service (vd: trả reservation của người khác) → 403. */
    @ExceptionHandler(org.springframework.security.access.AccessDeniedException.class)
    public ResponseEntity<ApiError> handleAccessDenied(
            org.springframework.security.access.AccessDeniedException exception
    ) {
        return ResponseEntity
                .status(HttpStatus.FORBIDDEN)
                .body(ApiError.of(
                        "ROLE_FORBIDDEN",
                        "You do not have permission to perform this action."
                ));
    }
}