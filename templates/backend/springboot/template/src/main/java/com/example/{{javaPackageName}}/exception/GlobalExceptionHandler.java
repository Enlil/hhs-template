package com.example.{{javaPackageName}}.exception;

import com.example.{{javaPackageName}}.dto.ErrorResponse;
import jakarta.servlet.http.HttpServletRequest;
import java.util.Objects;
import java.util.stream.Collectors;
// #if lombok
import lombok.extern.slf4j.Slf4j;
// #else
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
// #endif
import org.springframework.context.MessageSourceResolvable;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.ProblemDetail;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.context.request.WebRequest;
import org.springframework.web.method.annotation.HandlerMethodValidationException;
import org.springframework.web.servlet.mvc.method.annotation.ResponseEntityExceptionHandler;

// Turns every error into the one JSON shape in shared/contracts/openapi.yaml
// ({statusCode, message, error}), so all three backends look the same to the
// frontend. Extending ResponseEntityExceptionHandler keeps Spring's own status
// choices (404 unknown URL, 405 wrong method, 400 bad request, ...) — a bare
// @ExceptionHandler(Exception.class) on its own would turn all of those into 500s.
@RestControllerAdvice
// #if lombok
@Slf4j
// #endif
public class GlobalExceptionHandler extends ResponseEntityExceptionHandler {
    // #if !lombok

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);
    // #endif

    // Every exception Spring MVC handles itself ends up here, status already chosen.
    @Override
    protected ResponseEntity<Object> handleExceptionInternal(
            Exception exception, Object body, HttpHeaders headers, HttpStatusCode statusCode, WebRequest request) {
        if (statusCode.is5xxServerError()) {
            log.error("Server error on {}", request.getDescription(false), exception);
        }

        HttpStatus status = HttpStatus.resolve(statusCode.value());
        String message = body instanceof ProblemDetail problem && problem.getDetail() != null
                ? problem.getDetail()
                : (status != null ? status.getReasonPhrase() : "Request failed");

        ErrorResponse error = new ErrorResponse(statusCode.value(), message, status != null ? status.getReasonPhrase() : null);
        return ResponseEntity.status(statusCode).headers(headers).body(error);
    }

    // Constraint annotations on controller parameters (e.g. @Size on ?name=) —
    // swap Spring's generic "Validation failure" for the actual messages.
    @Override
    protected ResponseEntity<Object> handleHandlerMethodValidationException(
            HandlerMethodValidationException exception, HttpHeaders headers, HttpStatusCode status, WebRequest request) {
        String message = exception.getAllErrors().stream()
                .map(MessageSourceResolvable::getDefaultMessage)
                .filter(Objects::nonNull)
                .collect(Collectors.joining(" "));
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(status, message.isBlank() ? "Validation failed." : message);
        return handleExceptionInternal(exception, problem, headers, status, request);
    }

    // Everything Spring doesn't know how to handle: a real bug. Logged here
    // because handling it means Spring won't log it for us.
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleUnexpected(Exception exception, HttpServletRequest request) {
        log.error("Unhandled exception on {} {}", request.getMethod(), request.getRequestURI(), exception);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(new ErrorResponse(HttpStatus.INTERNAL_SERVER_ERROR.value(), "Internal server error", null));
    }
}
