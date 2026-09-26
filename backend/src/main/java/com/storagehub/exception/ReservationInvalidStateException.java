package com.storagehub.exception;

public class ReservationInvalidStateException extends RuntimeException {

    public ReservationInvalidStateException() {
        super("Check-in pass is only available for confirmed reservations.");
    }

    public ReservationInvalidStateException(String message) {
        super(message);
    }
}
