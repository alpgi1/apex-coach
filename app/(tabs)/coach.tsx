import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    Keyboard,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';
import Markdown from 'react-native-markdown-display';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { sendChatMessage } from '../../src/services/api/aiApi';
import { buildWeightContextString } from '../../src/services/storage/weightStorage';
import { useUserStore } from '../../src/store/userStore';
import {
    createConversation,
    getConversationMessages,
    getAllConversations,
    saveChatMessage,
    updateConversationTitle,
} from '../../src/services/storage/chatStorage';
import { ChatMessage } from '../../src/types/chat.types';

/* ── constants ─────────────────────────────────────── */

const AI_COLOR = '#00C9A7';
const TAB_HEIGHT = 70;
const TAB_MARGIN = 10;

interface QuickAction {
    label: string;
    prompt: string;
}

const QUICK_ACTIONS: QuickAction[] = [
    { label: 'Analyze my week', prompt: 'Analyze my training this week. What went well and what could improve?' },
    { label: 'Suggest next workout', prompt: 'Based on my recent training, suggest what I should train next and why.' },
    { label: 'Am I overtraining?', prompt: 'Look at my recent data and tell me if there are signs of overtraining.' },
    { label: 'Rate my volume', prompt: 'Evaluate my weekly training volume per muscle group.' },
    { label: 'Recovery tips', prompt: 'Based on my recent intensity, what recovery strategies do you recommend?' },
];

/* ── component ─────────────────────────────────────── */

export default function CoachScreen() {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [conversationId, setConversationId] = useState<string | null>(null);
    const [inputText, setInputText] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [keyboardHeight, setKeyboardHeight] = useState(0);
    const flatListRef = useRef<FlatList>(null);
    const insets = useSafeAreaInsets();
    const userName = useUserStore((s) => s.name);
    const bottomOffset = insets.bottom > 0 ? insets.bottom : 20;

    // Track keyboard height
    useEffect(() => {
        const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
        const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

        const showSub = Keyboard.addListener(showEvent, (e) => {
            setKeyboardHeight(e.endCoordinates.height);
        });
        const hideSub = Keyboard.addListener(hideEvent, () => {
            setKeyboardHeight(0);
        });

        return () => { showSub.remove(); hideSub.remove(); };
    }, []);

    // Load last conversation on mount
    useEffect(() => {
        loadLastConversation();
    }, []);

    const loadLastConversation = async () => {
        try {
            const conversations = await getAllConversations();
            if (conversations.length > 0) {
                const latest = conversations[0];
                const msgs = await getConversationMessages(latest.id);
                setConversationId(latest.id);
                setMessages(msgs);
            }
        } catch (err) {
            console.warn('Failed to load conversations:', err);
        }
    };

    const handleNewChat = useCallback(async () => {
        const conv = await createConversation('New Chat');
        setConversationId(conv.id);
        setMessages([]);
        setInputText('');
        setError(null);
    }, []);

    const handleSend = useCallback(async (text?: string) => {
        const messageText = (text ?? inputText).trim();
        if (!messageText || isLoading) return;

        setInputText('');
        setError(null);

        try {
            // Create conversation if needed
            let currentConvId = conversationId;
            if (!currentConvId) {
                const conv = await createConversation(messageText.slice(0, 30));
                currentConvId = conv.id;
                setConversationId(conv.id);
            }

            // Save user message
            const userMsg = await saveChatMessage({
                conversationId: currentConvId,
                role: 'user',
                content: messageText,
                timestamp: new Date().toISOString(),
            });

            const updatedMessages = [...messages, userMsg];
            setMessages(updatedMessages);

            // Build conversation history for API
            const history = updatedMessages.map((m) => ({
                role: m.role === 'user' ? 'user' : 'model',
                text: m.content,
            }));

            // Call API
            setIsLoading(true);
            const weightCtx = await buildWeightContextString().catch(() => '');
            const response = await sendChatMessage(messageText, history.slice(0, -1), userName || undefined, weightCtx || undefined);

            // Save AI response
            const aiMsg = await saveChatMessage({
                conversationId: currentConvId,
                role: 'model',
                content: response.data.message,
                timestamp: new Date().toISOString(),
            });

            setMessages((prev) => [...prev, aiMsg]);

            // Auto-title on first exchange
            if (updatedMessages.length === 1) {
                await updateConversationTitle(currentConvId, messageText.slice(0, 30));
            }
        } catch (err: any) {
            console.error('Chat error:', err);
            setError('Failed to get response. Tap to retry.');
        } finally {
            setIsLoading(false);
        }
    }, [inputText, isLoading, conversationId, messages]);

    const handleRetry = useCallback(() => {
        if (messages.length === 0) return;
        const lastUserMsg = [...messages].reverse().find((m) => m.role === 'user');
        if (lastUserMsg) {
            // Remove the failed state and resend
            setError(null);
            handleSend(lastUserMsg.content);
        }
    }, [messages, handleSend]);

    const scrollToEnd = useCallback(() => {
        setTimeout(() => {
            flatListRef.current?.scrollToEnd({ animated: true });
        }, 100);
    }, []);

    // Auto-scroll when messages change
    useEffect(() => {
        if (messages.length > 0) scrollToEnd();
    }, [messages.length, scrollToEnd]);

    /* ── render helpers ─────────────────────────────── */

    const renderMessage = useCallback(({ item }: { item: ChatMessage }) => {
        const isUser = item.role === 'user';
        return (
            <View style={[styles.messageBubbleWrapper, isUser ? styles.userAlign : styles.aiAlign]}>
                {!isUser && (
                    <View style={styles.aiAvatar}>
                        <Ionicons name="sparkles" size={14} color={AI_COLOR} />
                    </View>
                )}
                <View style={[styles.messageBubble, isUser ? styles.userBubble : styles.aiBubble]}>
                    {isUser ? (
                        <Text style={[styles.messageText, styles.userText]}>{item.content}</Text>
                    ) : (
                        <Markdown style={markdownStyles}>{item.content}</Markdown>
                    )}
                </View>
            </View>
        );
    }, []);

    const renderEmptyState = () => (
        <View style={styles.emptyState}>
            <View style={styles.emptyIconWrapper}>
                <Ionicons name="sparkles" size={48} color={AI_COLOR} />
            </View>
            <Text style={styles.emptyTitle}>Apex AI</Text>
            <Text style={styles.emptySubtitle}>Ask me anything about your training</Text>
            <View style={styles.quickActionsContainer}>
                {QUICK_ACTIONS.map((action) => (
                    <Pressable
                        key={action.label}
                        style={styles.quickChip}
                        onPress={() => handleSend(action.prompt)}
                    >
                        <Text style={styles.quickChipText}>{action.label}</Text>
                    </Pressable>
                ))}
            </View>
        </View>
    );

    const renderInputQuickActions = () => {
        if (messages.length === 0 || inputText.length > 0 || isLoading) return null;
        return (
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.inputChipsContainer}
            >
                {QUICK_ACTIONS.map((action) => (
                    <Pressable
                        key={action.label}
                        style={styles.inputChip}
                        onPress={() => handleSend(action.prompt)}
                    >
                        <Text style={styles.inputChipText}>{action.label}</Text>
                    </Pressable>
                ))}
            </ScrollView>
        );
    };

    /* ── dynamic bottom padding ────────────────────── */

    const inputBottomPadding = keyboardHeight > 0
        ? keyboardHeight + 8 // keyboard open: sit right above keyboard
        : TAB_HEIGHT + bottomOffset + TAB_MARGIN; // keyboard closed: sit above tab bar

    /* ── main render ────────────────────────────────── */

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            {/* Header */}
            <View style={styles.header}>
                <View style={styles.headerLeft}>
                    <Ionicons name="sparkles" size={20} color={AI_COLOR} />
                    <Text style={styles.headerTitle}>Apex AI</Text>
                </View>
                <Pressable onPress={handleNewChat} hitSlop={8}>
                    <Ionicons name="create-outline" size={22} color="rgba(255,255,255,0.5)" />
                </Pressable>
            </View>

            <View style={styles.flex1}>
                    {/* Messages */}
                    {messages.length === 0 && !isLoading ? (
                        renderEmptyState()
                    ) : (
                        <FlatList
                            ref={flatListRef}
                            data={messages}
                            renderItem={renderMessage}
                            keyExtractor={(item) => item.id}
                            contentContainerStyle={styles.messagesList}
                            onContentSizeChange={scrollToEnd}
                            showsVerticalScrollIndicator={false}
                            keyboardDismissMode="on-drag"
                            ListFooterComponent={
                                <>
                                    {isLoading && (
                                        <View style={[styles.messageBubbleWrapper, styles.aiAlign]}>
                                            <View style={styles.aiAvatar}>
                                                <Ionicons name="sparkles" size={14} color={AI_COLOR} />
                                            </View>
                                            <View style={[styles.messageBubble, styles.aiBubble]}>
                                                <ActivityIndicator size="small" color={AI_COLOR} />
                                            </View>
                                        </View>
                                    )}
                                    {error && (
                                        <Pressable onPress={handleRetry} style={styles.errorContainer}>
                                            <Ionicons name="alert-circle" size={16} color="#FF453A" />
                                            <Text style={styles.errorText}>{error}</Text>
                                        </Pressable>
                                    )}
                                </>
                            }
                        />
                    )}

                    {/* Input Area */}
                    <View style={[styles.inputArea, { paddingBottom: inputBottomPadding }]}>
                        {renderInputQuickActions()}
                        <View style={styles.inputRow}>
                            <TextInput
                                style={styles.textInput}
                                placeholder="Ask about your training..."
                                placeholderTextColor="rgba(255,255,255,0.3)"
                                value={inputText}
                                onChangeText={setInputText}
                                multiline
                                maxLength={2000}
                                editable={!isLoading}
                            />
                            <Pressable
                                onPress={() => handleSend()}
                                disabled={!inputText.trim() || isLoading}
                                style={[
                                    styles.sendButton,
                                    (!inputText.trim() || isLoading) && styles.sendButtonDisabled,
                                ]}
                            >
                                <Ionicons
                                    name="arrow-up"
                                    size={20}
                                    color={!inputText.trim() || isLoading ? 'rgba(255,255,255,0.2)' : '#FFFFFF'}
                                />
                            </Pressable>
                        </View>
                    </View>
                </View>
        </SafeAreaView>
    );
}

/* ── styles ────────────────────────────────────────── */

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0A0A0A',
    },
    flex1: {
        flex: 1,
    },
    /* ── header ── */
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 14,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: 'rgba(255,255,255,0.08)',
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    headerTitle: {
        fontSize: 20,
        fontFamily: 'Outfit_700Bold',
        color: AI_COLOR,
    },
    /* ── empty state ── */
    emptyState: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 40,
    },
    emptyIconWrapper: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: 'rgba(0, 201, 167, 0.1)',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
    },
    emptyTitle: {
        fontSize: 24,
        fontFamily: 'Outfit_700Bold',
        color: '#FFFFFF',
        marginBottom: 8,
    },
    emptySubtitle: {
        fontSize: 15,
        fontFamily: 'Outfit_400Regular',
        color: 'rgba(255,255,255,0.5)',
        textAlign: 'center',
        marginBottom: 32,
    },
    quickActionsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: 8,
    },
    quickChip: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 20,
        backgroundColor: 'rgba(0, 201, 167, 0.1)',
        borderWidth: 1,
        borderColor: 'rgba(0, 201, 167, 0.25)',
    },
    quickChipText: {
        fontSize: 13,
        fontFamily: 'Outfit_500Medium',
        color: AI_COLOR,
    },
    /* ── messages ── */
    messagesList: {
        paddingHorizontal: 16,
        paddingTop: 16,
        paddingBottom: 8,
    },
    messageBubbleWrapper: {
        flexDirection: 'row',
        marginBottom: 12,
        maxWidth: '85%',
    },
    userAlign: {
        alignSelf: 'flex-end',
    },
    aiAlign: {
        alignSelf: 'flex-start',
    },
    aiAvatar: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: 'rgba(0, 201, 167, 0.15)',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 8,
        marginTop: 2,
    },
    messageBubble: {
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 18,
        flexShrink: 1,
    },
    userBubble: {
        backgroundColor: 'rgba(255, 96, 0, 0.15)',
        borderWidth: 1,
        borderColor: 'rgba(255, 96, 0, 0.25)',
        borderBottomRightRadius: 4,
    },
    aiBubble: {
        backgroundColor: 'rgba(0, 201, 167, 0.08)',
        borderLeftWidth: 2,
        borderLeftColor: AI_COLOR,
        borderBottomLeftRadius: 4,
    },
    messageText: {
        fontSize: 15,
        fontFamily: 'Outfit_400Regular',
        lineHeight: 22,
    },
    userText: {
        color: '#FFFFFF',
    },
    aiText: {
        color: 'rgba(255,255,255,0.9)',
    },
    /* ── error ── */
    errorContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 12,
        paddingVertical: 8,
        marginLeft: 36,
    },
    errorText: {
        fontSize: 13,
        fontFamily: 'Outfit_400Regular',
        color: '#FF453A',
    },
    /* ── input ── */
    inputArea: {
        paddingHorizontal: 16,
        paddingTop: 8,
        borderTopWidth: StyleSheet.hairlineWidth,
        borderTopColor: 'rgba(255,255,255,0.08)',
    },
    inputChipsContainer: {
        paddingBottom: 8,
        gap: 6,
    },
    inputChip: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
        backgroundColor: 'rgba(255,255,255,0.06)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    inputChipText: {
        fontSize: 12,
        fontFamily: 'Outfit_500Medium',
        color: 'rgba(255,255,255,0.5)',
    },
    inputRow: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        gap: 8,
    },
    textInput: {
        flex: 1,
        minHeight: 40,
        maxHeight: 100,
        backgroundColor: 'rgba(255,255,255,0.08)',
        borderRadius: 20,
        paddingHorizontal: 16,
        paddingTop: 10,
        paddingBottom: 10,
        fontSize: 15,
        fontFamily: 'Outfit_400Regular',
        color: '#FFFFFF',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    sendButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: AI_COLOR,
        alignItems: 'center',
        justifyContent: 'center',
    },
    sendButtonDisabled: {
        backgroundColor: 'rgba(255,255,255,0.08)',
    },
});

const markdownStyles = {
    body: { color: 'rgba(255,255,255,0.9)', fontFamily: 'Outfit_400Regular', fontSize: 15, lineHeight: 22 },
    heading1: { color: '#FFFFFF', fontFamily: 'Outfit_700Bold', fontSize: 17, marginTop: 8, marginBottom: 4 },
    heading2: { color: '#FFFFFF', fontFamily: 'Outfit_700Bold', fontSize: 16, marginTop: 8, marginBottom: 4 },
    heading3: { color: '#00C9A7', fontFamily: 'Outfit_600SemiBold', fontSize: 15, marginTop: 6, marginBottom: 2 },
    strong: { fontFamily: 'Outfit_700Bold', color: '#FFFFFF' },
    em: { fontFamily: 'Outfit_400Regular', fontStyle: 'italic' as const },
    bullet_list: { marginVertical: 4 },
    ordered_list: { marginVertical: 4 },
    list_item: { marginVertical: 2 },
    bullet_list_icon: { color: '#00C9A7', marginTop: 6 },
    code_inline: { backgroundColor: 'rgba(0,201,167,0.1)', color: '#00C9A7', borderRadius: 4, paddingHorizontal: 4 },
    fence: { backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 8, padding: 8, marginVertical: 4 },
    paragraph: { marginVertical: 2 },
};
