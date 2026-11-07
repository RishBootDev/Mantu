package com.rishbootdev.mantu.common_library.exceptions;

import lombok.Getter;

@Getter
public class DuplicateResourceException extends RuntimeException {

    private final String errorCode;
    public DuplicateResourceException(String message, String errorCode) {
        super(message);
        this.errorCode = errorCode;
    }
}
