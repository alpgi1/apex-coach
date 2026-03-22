package com.apexcoach.api.exception;

public class GeminiRateLimitException extends RuntimeException {

    public GeminiRateLimitException(String message) {
        super(message);
    }
}
