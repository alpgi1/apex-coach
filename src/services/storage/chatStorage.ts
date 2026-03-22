import * as Crypto from 'expo-crypto';
import { ChatConversation, ChatMessage } from '../../types/chat.types';
import db from './database';

interface ConversationRow {
    id: string;
    title: string;
    createdAt: string;
    updatedAt: string;
}

interface MessageRow {
    id: string;
    conversationId: string;
    role: string;
    content: string;
    timestamp: string;
}

export const createConversation = async (title = 'New Chat'): Promise<ChatConversation> => {
    const now = new Date().toISOString();
    const conversation: ChatConversation = {
        id: Crypto.randomUUID(),
        title,
        createdAt: now,
        updatedAt: now,
    };

    await db.runAsync(
        `INSERT INTO chat_conversations (id, title, createdAt, updatedAt) VALUES (?, ?, ?, ?)`,
        [conversation.id, conversation.title, conversation.createdAt, conversation.updatedAt]
    );

    return conversation;
};

export const getAllConversations = async (): Promise<ChatConversation[]> => {
    const rows = await db.getAllAsync<ConversationRow>(
        `SELECT * FROM chat_conversations ORDER BY updatedAt DESC`
    );
    return rows;
};

export const updateConversationTitle = async (id: string, title: string): Promise<void> => {
    await db.runAsync(
        `UPDATE chat_conversations SET title = ?, updatedAt = ? WHERE id = ?`,
        [title, new Date().toISOString(), id]
    );
};

export const deleteConversation = async (id: string): Promise<void> => {
    await db.runAsync(`DELETE FROM chat_conversations WHERE id = ?`, [id]);
};

export const saveChatMessage = async (
    msg: Omit<ChatMessage, 'id'>
): Promise<ChatMessage> => {
    const id = Crypto.randomUUID();
    const message: ChatMessage = { id, ...msg };

    await db.runAsync(
        `INSERT INTO chat_messages (id, conversationId, role, content, timestamp) VALUES (?, ?, ?, ?, ?)`,
        [message.id, message.conversationId, message.role, message.content, message.timestamp]
    );

    // Update conversation's updatedAt
    await db.runAsync(
        `UPDATE chat_conversations SET updatedAt = ? WHERE id = ?`,
        [message.timestamp, message.conversationId]
    );

    return message;
};

export const getConversationMessages = async (
    conversationId: string
): Promise<ChatMessage[]> => {
    const rows = await db.getAllAsync<MessageRow>(
        `SELECT * FROM chat_messages WHERE conversationId = ? ORDER BY timestamp ASC`,
        [conversationId]
    );

    return rows.map((row) => ({
        ...row,
        role: row.role as ChatMessage['role'],
    }));
};
