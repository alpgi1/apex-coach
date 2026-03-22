package com.apexcoach.api.service;

import com.apexcoach.api.dto.gemini.GeminiRequest;
import com.apexcoach.api.dto.request.AiChatRequest;
import com.apexcoach.api.dto.request.AiInsightsRequest;
import com.apexcoach.api.dto.response.AiChatResponse;
import com.apexcoach.api.dto.response.AiInsightsResponse;
import com.apexcoach.api.entity.User;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
@Slf4j
public class AiCoachService {

    private final GeminiService geminiService;
    private final TrainingContextService trainingContextService;
    private final AuthenticatedUserService authenticatedUserService;

    public AiChatResponse chat(AiChatRequest request) {
        User user = authenticatedUserService.getCurrentUser();
        TrainingContextService.TrainingContext ctx = trainingContextService.buildChatContext(user);

        String displayName = (request.userName() != null && !request.userName().isBlank())
                ? request.userName()
                : user.getName();
        String systemPrompt = buildChatSystemPrompt(displayName, ctx.text());

        // Build conversation history in Gemini format
        List<GeminiRequest.Content> contents = new ArrayList<>();

        if (request.conversationHistory() != null) {
            for (AiChatRequest.ChatMessage msg : request.conversationHistory()) {
                contents.add(new GeminiRequest.Content(
                        msg.role(),
                        List.of(new GeminiRequest.Part(msg.text()))
                ));
            }
        }

        // Add the new user message
        contents.add(new GeminiRequest.Content(
                "user",
                List.of(new GeminiRequest.Part(request.message()))
        ));

        GeminiService.GeminiResult result = geminiService.generateContent(
                systemPrompt, contents, 0.7, 1024);

        return new AiChatResponse(result.text(), result.tokensUsed());
    }

    public AiInsightsResponse generateInsights(AiInsightsRequest request) {
        User user = authenticatedUserService.getCurrentUser();
        TrainingContextService.TrainingContext ctx = trainingContextService.buildContextSummary(
                user, request.dayRange());

        String systemPrompt = buildInsightsSystemPrompt();

        List<GeminiRequest.Content> contents = List.of(
                new GeminiRequest.Content(
                        "user",
                        List.of(new GeminiRequest.Part(
                                "Analyze my training data and provide insights:\n\n" + ctx.text()))
                )
        );

        GeminiService.GeminiResult result = geminiService.generateContent(
                systemPrompt, contents, 0.3, 1024);

        return new AiInsightsResponse(result.text(), ctx.workoutsAnalyzed(), result.tokensUsed());
    }

    private String buildChatSystemPrompt(String userName, String trainingContext) {
        return """
                You are Apex Coach, an expert strength training coach AI assistant.

                PERSONA:
                - Knowledgeable, supportive, and direct
                - Give evidence-based advice rooted in exercise science
                - Be concise — mobile users prefer short, actionable answers
                - Use the user's training data to personalize every response

                USER: %s

                TRAINING CONTEXT:
                %s

                RULES:
                - Always reference the user's actual data when relevant
                - If asked about something outside strength training, politely redirect
                - Never recommend specific supplements or medical advice
                - Keep responses under 300 words unless the user asks for detail
                - Use metric units (kg)
                - Respond in the same language the user writes in
                """.formatted(userName, trainingContext);
    }

    private String buildInsightsSystemPrompt() {
        return """
                You are Apex Coach, an AI training analyst. Analyze the provided workout data and generate actionable insights.

                OUTPUT FORMAT (use these exact headings):
                ## Volume Trend
                [Volume trend analysis — increasing/decreasing/stable, week-over-week comparison]

                ## Recovery & Intensity
                [RPE analysis, signs of overreaching or under-training, fatigue accumulation]

                ## Muscle Balance
                [Which muscle groups are overtrained/undertrained relative to each other]

                ## Key Recommendations
                [3-5 bullet points of specific, actionable advice for the next training week]

                RULES:
                - Be specific — reference actual numbers from the data
                - Focus on patterns, not individual sessions
                - Keep total response under 400 words
                - Use metric units (kg)
                - Respond in English
                """;
    }
}
