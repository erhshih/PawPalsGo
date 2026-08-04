package com.pawpals.backend.config;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
@RequiredArgsConstructor
public class WebConfig implements WebMvcConfigurer {

  private final AppProperties appProperties;

  @jakarta.annotation.PostConstruct
  public void ensureUploadDirs() throws IOException {
    Files.createDirectories(uploadsPath().resolve("avatars"));
    Files.createDirectories(uploadsPath().resolve("pets"));
  }

  private Path uploadsPath() {
    return Path.of(appProperties.uploads().dir()).toAbsolutePath();
  }

  @Override
  public void addResourceHandlers(ResourceHandlerRegistry registry) {
    registry.addResourceHandler("/uploads/**").addResourceLocations("file:" + uploadsPath() + "/");
  }
}
