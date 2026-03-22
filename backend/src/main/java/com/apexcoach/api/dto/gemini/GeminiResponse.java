package com.apexcoach.api.dto.gemini;

import java.util.List;

public record GeminiResponse(
        List<Candidate> candidates,
        UsageMetadata usageMetadata
) {
    public record Candidate(Content content, String finishReason) {}

    public record Content(String role, List<Part> parts) {}

    public record Part(String text) {}

    public record UsageMetadata(int promptTokenCount, int candidatesTokenCount, int totalTokenCount) {}
}
