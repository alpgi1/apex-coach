package com.apexcoach.api.dto.response;

public record AiChatResponse(
        String message,
        int tokensUsed
) {}
