package com.pawpals.backend.common;

import io.jsonwebtoken.JwtException;
import java.util.LinkedHashMap;
import java.util.Map;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.multipart.MaxUploadSizeExceededException;
import org.springframework.web.servlet.resource.NoResourceFoundException;

@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler {

  @ExceptionHandler(ApiException.class)
  public ResponseEntity<Object> handleApiException(ApiException ex) {
    return body(ex.getStatus(), ex.getMessage());
  }

  @ExceptionHandler(NoResourceFoundException.class)
  public ResponseEntity<Object> handleNoResource(NoResourceFoundException ex) {
    return body(HttpStatus.NOT_FOUND, "NOT_FOUND");
  }

  @ExceptionHandler(AccessDeniedException.class)
  public ResponseEntity<Object> handleAccessDenied(AccessDeniedException ex) {
    return body(HttpStatus.FORBIDDEN, "FORBIDDEN");
  }

  @ExceptionHandler(JwtException.class)
  public ResponseEntity<Object> handleJwtException(JwtException ex) {
    return body(HttpStatus.UNAUTHORIZED, "INVALID_TOKEN");
  }

  @ExceptionHandler(MethodArgumentNotValidException.class)
  public ResponseEntity<Object> handleValidation(MethodArgumentNotValidException ex) {
    String message =
        ex.getBindingResult().getFieldErrors().stream()
            .findFirst()
            .map(f -> f.getField() + ": " + f.getDefaultMessage())
            .orElse("VALIDATION_FAILED");
    return body(HttpStatus.BAD_REQUEST, message);
  }

  @ExceptionHandler(HttpMessageNotReadableException.class)
  public ResponseEntity<Object> handleUnreadable(HttpMessageNotReadableException ex) {
    return body(HttpStatus.BAD_REQUEST, "MALFORMED_REQUEST_BODY");
  }

  @ExceptionHandler(MaxUploadSizeExceededException.class)
  public ResponseEntity<Object> handleTooLarge(MaxUploadSizeExceededException ex) {
    return body(HttpStatus.PAYLOAD_TOO_LARGE, "FILE_TOO_LARGE");
  }

  @ExceptionHandler(Exception.class)
  public ResponseEntity<Object> handleUnexpected(Exception ex) {
    log.error("Unhandled exception", ex);
    return body(HttpStatus.INTERNAL_SERVER_ERROR, "INTERNAL_ERROR");
  }

  private ResponseEntity<Object> body(HttpStatus status, String message) {
    Map<String, Object> payload = new LinkedHashMap<>();
    payload.put("statusCode", status.value());
    payload.put("message", message);
    payload.put("error", status.getReasonPhrase());
    return ResponseEntity.status(status).body(payload);
  }
}
