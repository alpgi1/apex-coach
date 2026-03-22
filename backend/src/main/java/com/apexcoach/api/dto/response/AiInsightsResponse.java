package com.apexcoach.api.dto.response;

public record AiInsightsResponse(
        String insights,
        int workoutsAnalyzed,
        int tokensUsed
) {}
