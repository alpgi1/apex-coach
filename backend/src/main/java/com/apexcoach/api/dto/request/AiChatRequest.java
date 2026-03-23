package com.apexcoach.api.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.util.List;

public record AiChatRequest(

        @NotBlank(message = "Message is required")
        @Size(max = 2000, message = "Message must be at most 2000 characters")
        String message,

        @Size(max = 50, message = "Conversation history too long")
        List<ChatMessage> conversationHistory,

        @Size(max = 50, message = "Name too long")
        String userName,

        @Size(max = 300, message = "Weight context too long")
        String weightContext
) {
    public record ChatMessage(
            @NotBlank(message = "Role is required")
            String role,
            @NotBlank(message = "Text is required")
            String text
    ) {}
}
