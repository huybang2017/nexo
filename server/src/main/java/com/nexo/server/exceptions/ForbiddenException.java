package com.nexo.server.exceptions;

import org.springframework.http.HttpStatus;

public class ForbiddenException extends BaseException {

    public ForbiddenException(String message) {
        super(message, HttpStatus.FORBIDDEN, "FORBIDDEN");
    }

    public ForbiddenException() {
        super("You don't have permission to perform this action", HttpStatus.FORBIDDEN, "FORBIDDEN");
    }
}

