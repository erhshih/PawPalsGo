package com.pawpals.backend.common;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;

/**
 * A classic-Jackson-2 {@link ObjectMapper} configured to match Spring Boot's REST serialization (ISO-8601
 * dates, not epoch numbers). Boot 4 autoconfigures a Jackson 3 {@code tools.jackson.databind.ObjectMapper}
 * bean instead, which this codebase's Jackson-2-only dependencies (e.g. jjwt-jackson) can't use, so classes
 * that need to hand-serialize JSON outside of Spring MVC's message conversion build one via {@link #instance()}.
 */
public final class JsonMapper {

  private JsonMapper() {}

  public static ObjectMapper instance() {
    return new ObjectMapper().findAndRegisterModules().disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);
  }
}
