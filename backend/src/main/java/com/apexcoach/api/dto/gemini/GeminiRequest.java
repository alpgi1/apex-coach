package com.apexcoach.api.dto.gemini;

import java.util.List;

public record GeminiRequest(
        List<Content> contents,
        SystemInstruction systemInstruction,
        GenerationConfig generationConfig
) {
    public record Content(String role, List<Part> parts) {}

    public record Part(String text) {}

    public record SystemInstruction(List<Part> parts) {}

    public record GenerationConfig(double temperature, int maxOutputTokens) {}
}
