package br.com.erudio.exception;

import java.util.Date;
import java.util.List;

public record ExceptionResponse(Date timestamp, String message, String details, List<String> errors) {

    public ExceptionResponse(Date timestamp, String message, String details) {
        this(timestamp, message, details, List.of());
    }
}