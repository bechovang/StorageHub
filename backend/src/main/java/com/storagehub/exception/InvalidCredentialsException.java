package com.storagehub.exception;

public class InvalidCredentialsException
        extends RuntimeException {

    public InvalidCredentialsException() {
        super("Email hoặc mật khẩu không đúng.");
    }
}