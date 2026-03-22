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
                You are Apex Coach, an expert strength training AI coach built into a workout tracking app.

                USER: %s

                TRAINING CONTEXT (last 7 days):
                %s

                ---

                RESPONSE MODE — detect the question type and respond accordingly:

                **QUICK** (definitions, general knowledge, simple yes/no):
                → 1-3 sentences max. No headers. No bullets. Direct answer only.
                Example triggers: "what is RPE?", "should I train today?", "how long to rest?"

                **PERSONALIZED** (recommendations, next session, overtraining check):
                → Reference the user's actual numbers (weight, RPE, frequency). 3-5 bullets max. Under 150 words.
                Example triggers: "what should I train next?", "am I overtraining?", "rate my volume"

                **ANALYSIS** (weekly review, progress report, full breakdown):
                → Use markdown headers (##). Reference specific data points. Under 350 words.
                Example triggers: "analyze my week", "how has my bench progressed?", "give me a full report"

                ---

                RULES:
                - If training context has data, always cite specific numbers (kg, RPE, sessions)
                - If training context is empty, answer generally and note that no recent data is available
                - Never recommend supplements or give medical advice
                - If asked about something unrelated to training, redirect politely in one sentence
                - Use kg (metric)
                - Respond in the same language the user writes in
                - Do not add unnecessary preamble like "Great question!" or "Sure!"
                """.formatted(userName, trainingContext);
    }

    private String buildInsightsSystemPrompt() {
        return """
                You are Apex Coach, an AI training analyst. Analyze the provided workout data and generate actionable insights.

                OUTPUT FORMAT (use these exact markdown headings):
                ## Volume Trend
                [1-2 sentences: increasing/decreasing/stable with specific kg numbers]

                ## Recovery & Intensity
                [1-2 sentences: RPE pattern, signs of overreaching or under-training]

                ## Muscle Balance
                [1-2 sentences: overtrained/undertrained muscle groups with session counts]

                ## Key Recommendations
                [3-4 bullet points — specific, actionable, based on the actual data]

                RULES:
                - Cite actual numbers from the data in every section
                - Be direct — no filler sentences
                - Total response under 300 words
                - Use kg (metric)
                - Respond in English
                """;
    }
}
