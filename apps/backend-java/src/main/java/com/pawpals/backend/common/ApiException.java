package com.pawpals.backend.common;

import lombok.Getter;
import org.springframework.http.HttpStatus;

/** Mirrors Nest's built-in HTTP exceptions ({@code ConflictException}, {@code NotFoundException}, ...). */
@Getter
public class ApiException extends RuntimeException {

  private final HttpStatus status;

  public ApiException(HttpStatus status, String code) {
    super(code);
    this.status = status;
  }

  public static ApiException badRequest(String code) {
    return new ApiException(HttpStatus.BAD_REQUEST, code);
  }

  public static ApiException conflict(String code) {
    return new ApiException(HttpStatus.CONFLICT, code);
  }

  public static ApiException unauthorized(String code) {
    return new ApiException(HttpStatus.UNAUTHORIZED, code);
  }

  public static ApiException forbidden(String code) {
    return new ApiException(HttpStatus.FORBIDDEN, code);
  }

  public static ApiException notFound(String code) {
    return new ApiException(HttpStatus.NOT_FOUND, code);
  }

  public static ApiException unprocessable(String code) {
    return new ApiException(HttpStatus.UNPROCESSABLE_ENTITY, code);
  }
}
