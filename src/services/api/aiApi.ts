import { apiRequest } from './client';

interface AiChatApiResponse {
    success: boolean;
    data: {
        message: string;
        tokensUsed: number;
    };
}

interface AiInsightsApiResponse {
    success: boolean;
    data: {
        insights: string;
        workoutsAnalyzed: number;
        tokensUsed: number;
    };
}

export const sendChatMessage = (
    message: string,
    conversationHistory: { role: string; text: string }[],
    userName?: string,
    weightContext?: string
): Promise<AiChatApiResponse> =>
    apiRequest('POST', '/api/v1/ai/chat', { message, conversationHistory, userName, weightContext });

export const requestAiInsights = (
    dayRange: number
): Promise<AiInsightsApiResponse> =>
    apiRequest('POST', '/api/v1/ai/insights', { dayRange });
