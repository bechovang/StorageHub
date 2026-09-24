package com.storagehub.exception;

public class AccountLockedException
        extends RuntimeException {

    public AccountLockedException() {
        super("Tài khoản hiện không đăng nhập được.");
    }
}