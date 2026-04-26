package com.app.exception;

public class JwtConfigurationException extends RuntimeException {
    public JwtConfigurationException(String message) {
        super(message);
    }

    public JwtConfigurationException(String message, Throwable cause) {
        super(message, cause);
    }
}
