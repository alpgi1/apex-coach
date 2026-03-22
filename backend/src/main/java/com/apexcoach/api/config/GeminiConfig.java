package com.apexcoach.api.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.client.RestClient;

@Configuration
@ConfigurationProperties(prefix = "gemini")
@Getter
@Setter
public class GeminiConfig {

    private String apiKey;
    private String model;
    private String baseUrl;
    private int maxRequestsPerMinute;

    @Bean("geminiRestClient")
    public RestClient geminiRestClient() {
        return RestClient.builder()
                .baseUrl(baseUrl)
                .defaultHeader("Content-Type", "application/json")
                .build();
    }
}
