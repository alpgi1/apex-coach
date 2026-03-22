package com.apexcoach.api.service;

import com.apexcoach.api.config.GeminiConfig;
import com.apexcoach.api.dto.gemini.GeminiRequest;
import com.apexcoach.api.dto.gemini.GeminiResponse;
import com.apexcoach.api.exception.GeminiApiException;
import com.apexcoach.api.exception.GeminiRateLimitException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

import java.util.List;

@Service
@Slf4j
public class GeminiService {

    private final RestClient geminiRestClient;
    private final GeminiConfig geminiConfig;
    private final GeminiRateLimiter rateLimiter;

    public GeminiService(@Qualifier("geminiRestClient") RestClient geminiRestClient,
                         GeminiConfig geminiConfig,
                         GeminiRateLimiter rateLimiter) {
        this.geminiRestClient = geminiRestClient;
        this.geminiConfig = geminiConfig;
        this.rateLimiter = rateLimiter;
    }

    public GeminiResult generateContent(String systemPrompt,
                                        List<GeminiRequest.Content> conversationHistory,
                                        double temperature,
                                        int maxOutputTokens) {

        if (!rateLimiter.tryAcquire()) {
            throw new GeminiRateLimitException(
                    "AI service rate limit exceeded. Please try again in a moment.");
        }

        if (geminiConfig.getApiKey() == null || geminiConfig.getApiKey().isBlank()) {
            throw new GeminiApiException("Gemini API key is not configured");
        }

        GeminiRequest request = new GeminiRequest(
                conversationHistory,
                new GeminiRequest.SystemInstruction(
                        List.of(new GeminiRequest.Part(systemPrompt))
                ),
                new GeminiRequest.GenerationConfig(temperature, maxOutputTokens)
        );

        try {
            GeminiResponse response = geminiRestClient.post()
                    .uri("/models/{model}:generateContent?key={apiKey}",
                            geminiConfig.getModel(), geminiConfig.getApiKey())
                    .body(request)
                    .retrieve()
                    .body(GeminiResponse.class);

            if (response == null || response.candidates() == null || response.candidates().isEmpty()) {
                throw new GeminiApiException("Empty response from Gemini API");
            }

            GeminiResponse.Candidate candidate = response.candidates().getFirst();

            if (candidate.content() == null || candidate.content().parts() == null
                    || candidate.content().parts().isEmpty()) {
                throw new GeminiApiException(
                        "Gemini response blocked or empty. Finish reason: " + candidate.finishReason());
            }

            String text = candidate.content().parts().getFirst().text();
            int tokensUsed = response.usageMetadata() != null
                    ? response.usageMetadata().totalTokenCount()
                    : 0;

            log.debug("Gemini response: {} tokens used", tokensUsed);

            return new GeminiResult(text, tokensUsed);

        } catch (RestClientException ex) {
            throw new GeminiApiException("Failed to call Gemini API: " + ex.getMessage(), ex);
        }
    }

    public record GeminiResult(String text, int tokensUsed) {}
}
