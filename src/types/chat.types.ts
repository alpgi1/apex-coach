export type ChatRole = 'user' | 'model';

export interface ChatMessage {
    id: string;
    conversationId: string;
    role: ChatRole;
    content: string;
    timestamp: string; // ISO 8601
}

export interface ChatConversation {
    id: string;
    title: string;
    createdAt: string;
    updatedAt: string;
}
