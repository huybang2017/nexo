package com.nexo.server.exceptions;

import org.springframework.http.HttpStatus;

public class BusinessException extends BaseException {

    public BusinessException(String message) {
        super(message, HttpStatus.UNPROCESSABLE_ENTITY, "BUSINESS_ERROR");
    }

    public BusinessException(String message, String errorCode) {
        super(message, HttpStatus.UNPROCESSABLE_ENTITY, errorCode);
    }
}

