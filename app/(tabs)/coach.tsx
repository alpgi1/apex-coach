import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
    Animated,
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
    { label: '📊 Analyze my week', prompt: 'Analyze my training this week. What went well and what could improve?' },
    { label: '💪 Suggest next workout', prompt: 'Based on my recent training, suggest what I should train next and why.' },
    { label: '⚠️ Am I overtraining?', prompt: 'Look at my recent data and tell me if there are signs of overtraining.' },
    { label: '📈 Rate my volume', prompt: 'Evaluate my weekly training volume per muscle group.' },
    { label: '🔄 Recovery tips', prompt: 'Based on my recent intensity, what recovery strategies do you recommend?' },
];

/* ── Thinking dots component ───────────────────────── */

function ThinkingDots() {
    const dots = [useRef(new Animated.Value(0)).current, useRef(new Animated.Value(0)).current, useRef(new Animated.Value(0)).current];

    useEffect(() => {
        const animations = dots.map((dot, i) =>
            Animated.loop(
                Animated.sequence([
                    Animated.delay(i * 200),
                    Animated.timing(dot, { toValue: 1, duration: 400, useNativeDriver: true }),
                    Animated.timing(dot, { toValue: 0, duration: 400, useNativeDriver: true }),
                    Animated.delay((dots.length - i - 1) * 200),
                ])
            )
        );
        animations.forEach(a => a.start());
        return () => animations.forEach(a => a.stop());
    }, []);

    return (
        <View style={dotStyles.container}>
            <Text style={dotStyles.label}>Thinking</Text>
            {dots.map((dot, i) => (
                <Animated.Text
                    key={i}
                    style={[dotStyles.dot, { opacity: dot, transform: [{ translateY: dot.interpolate({ inputRange: [0, 1], outputRange: [0, -4] }) }] }]}
                >
                    ·
                </Animated.Text>
            ))}
        </View>
    );
}

const dotStyles = StyleSheet.create({
    container: { flexDirection: 'row', alignItems: 'flex-end', gap: 2, paddingVertical: 4 },
    label: { color: 'rgba(255,255,255,0.4)', fontSize: 14, fontFamily: 'Outfit_400Regular', marginRight: 2 },
    dot: { color: AI_COLOR, fontSize: 22, lineHeight: 22 },
});

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

    useEffect(() => {
        const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
        const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
        const showSub = Keyboard.addListener(showEvent, (e) => setKeyboardHeight(e.endCoordinates.height));
        const hideSub = Keyboard.addListener(hideEvent, () => setKeyboardHeight(0));
        return () => { showSub.remove(); hideSub.remove(); };
    }, []);

    useEffect(() => { loadLastConversation(); }, []);

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
            let currentConvId = conversationId;
            if (!currentConvId) {
                const conv = await createConversation(messageText.slice(0, 30));
                currentConvId = conv.id;
                setConversationId(conv.id);
            }

            const userMsg = await saveChatMessage({
                conversationId: currentConvId,
                role: 'user',
                content: messageText,
                timestamp: new Date().toISOString(),
            });

            const updatedMessages = [...messages, userMsg];
            setMessages(updatedMessages);

            const history = updatedMessages.map((m) => ({
                role: m.role === 'user' ? 'user' : 'model',
                text: m.content,
            }));

            setIsLoading(true);
            const weightCtx = await buildWeightContextString().catch(() => '');
            const response = await sendChatMessage(messageText, history.slice(0, -1), userName || undefined, weightCtx || undefined);

            const aiMsg = await saveChatMessage({
                conversationId: currentConvId,
                role: 'model',
                content: response.data.message,
                timestamp: new Date().toISOString(),
            });

            setMessages((prev) => [...prev, aiMsg]);

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
        if (lastUserMsg) { setError(null); handleSend(lastUserMsg.content); }
    }, [messages, handleSend]);

    const scrollToEnd = useCallback(() => {
        setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    }, []);

    useEffect(() => { if (messages.length > 0) scrollToEnd(); }, [messages.length, scrollToEnd]);

    /* ── render helpers ─────────────────────────────── */

    const renderMessage = useCallback(({ item }: { item: ChatMessage }) => {
        const isUser = item.role === 'user';

        if (isUser) {
            return (
                <View style={styles.userMsgWrapper}>
                    <View style={styles.userBubble}>
                        <Text style={styles.userText}>{item.content}</Text>
                    </View>
                </View>
            );
        }

        return (
            <View style={styles.aiMsgWrapper}>
                <View style={styles.aiAvatarRow}>
                    <View style={styles.aiAvatar}>
                        <Ionicons name="sparkles" size={13} color={AI_COLOR} />
                    </View>
                    <Text style={styles.aiLabel}>Apex AI</Text>
                </View>
                <View style={styles.aiContent}>
                    <Markdown style={markdownStyles}>{item.content}</Markdown>
                </View>
            </View>
        );
    }, []);

    const renderEmptyState = () => (
        <View style={styles.emptyState}>
            <LinearGradient
                colors={['rgba(0,201,167,0.15)', 'rgba(0,201,167,0.0)']}
                style={styles.emptyGlow}
            />
            <View style={styles.emptyIconWrapper}>
                <Ionicons name="sparkles" size={32} color={AI_COLOR} />
            </View>
            <Text style={styles.emptyTitle}>Apex AI</Text>
            <Text style={styles.emptySubtitle}>Your personal training intelligence</Text>
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

    const inputBottomPadding = keyboardHeight > 0
        ? keyboardHeight + 8
        : TAB_HEIGHT + bottomOffset + TAB_MARGIN;

    /* ── main render ────────────────────────────────── */

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            {/* ── HEADER ─────────────────────────────── */}
            <View style={styles.header}>
                <View style={styles.headerLeft}>
                    <View style={styles.headerIconBadge}>
                        <Ionicons name="sparkles" size={16} color={AI_COLOR} />
                    </View>
                    <View>
                        <Text style={styles.headerTitle}>Apex AI</Text>
                        <Text style={styles.headerSub}>Powered by Gemini</Text>
                    </View>
                </View>
                <Pressable
                    onPress={handleNewChat}
                    hitSlop={8}
                    style={styles.headerActionBtn}
                >
                    <Ionicons name="create-outline" size={20} color="rgba(255,255,255,0.6)" />
                </Pressable>
            </View>

            <View style={styles.flex1}>
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
                                    <View style={styles.aiMsgWrapper}>
                                        <View style={styles.aiAvatarRow}>
                                            <View style={styles.aiAvatar}>
                                                <Ionicons name="sparkles" size={13} color={AI_COLOR} />
                                            </View>
                                            <Text style={styles.aiLabel}>Apex AI</Text>
                                        </View>
                                        <View style={styles.aiContent}>
                                            <ThinkingDots />
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

                {/* ── INPUT AREA ──────────────────────── */}
                <View style={[styles.inputArea, { paddingBottom: inputBottomPadding }]}>
                    {renderInputQuickActions()}
                    <View style={styles.inputRow}>
                        <TextInput
                            style={styles.textInput}
                            placeholder="Message Apex AI..."
                            placeholderTextColor="rgba(255,255,255,0.25)"
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
                                size={18}
                                color={!inputText.trim() || isLoading ? 'rgba(255,255,255,0.2)' : '#000000'}
                            />
                        </Pressable>
                    </View>
                    <Text style={styles.disclaimer}>Apex AI can make mistakes. Verify important info.</Text>
                </View>
            </View>
        </SafeAreaView>
    );
}

/* ── styles ────────────────────────────────────────── */

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0A0A0A' },
    flex1: { flex: 1 },

    /* header */
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: 'rgba(255,255,255,0.07)',
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    headerIconBadge: {
        width: 34,
        height: 34,
        borderRadius: 10,
        backgroundColor: 'rgba(0,201,167,0.12)',
        borderWidth: 1,
        borderColor: 'rgba(0,201,167,0.2)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: {
        fontSize: 16,
        fontFamily: 'Outfit_700Bold',
        color: '#FFFFFF',
        lineHeight: 20,
    },
    headerSub: {
        fontSize: 11,
        fontFamily: 'Outfit_400Regular',
        color: 'rgba(255,255,255,0.35)',
        lineHeight: 14,
    },
    headerActionBtn: {
        width: 36,
        height: 36,
        borderRadius: 10,
        backgroundColor: 'rgba(255,255,255,0.06)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
        alignItems: 'center',
        justifyContent: 'center',
    },

    /* empty state */
    emptyState: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 32,
    },
    emptyGlow: {
        position: 'absolute',
        top: '20%',
        width: 280,
        height: 280,
        borderRadius: 140,
    },
    emptyIconWrapper: {
        width: 64,
        height: 64,
        borderRadius: 18,
        backgroundColor: 'rgba(0, 201, 167, 0.1)',
        borderWidth: 1,
        borderColor: 'rgba(0, 201, 167, 0.2)',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
    },
    emptyTitle: {
        fontSize: 22,
        fontFamily: 'Outfit_700Bold',
        color: '#FFFFFF',
        marginBottom: 6,
    },
    emptySubtitle: {
        fontSize: 14,
        fontFamily: 'Outfit_400Regular',
        color: 'rgba(255,255,255,0.4)',
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
        paddingHorizontal: 14,
        paddingVertical: 9,
        borderRadius: 12,
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    quickChipText: {
        fontSize: 13,
        fontFamily: 'Outfit_500Medium',
        color: 'rgba(255,255,255,0.7)',
    },

    /* messages */
    messagesList: {
        paddingTop: 12,
        paddingBottom: 8,
    },
    /* User message */
    userMsgWrapper: {
        alignItems: 'flex-end',
        paddingHorizontal: 16,
        marginBottom: 20,
    },
    userBubble: {
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 18,
        borderBottomRightRadius: 4,
        paddingHorizontal: 16,
        paddingVertical: 10,
        maxWidth: '80%',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
    },
    userText: {
        color: '#FFFFFF',
        fontSize: 15,
        fontFamily: 'Outfit_400Regular',
        lineHeight: 22,
    },
    /* AI message */
    aiMsgWrapper: {
        paddingHorizontal: 16,
        marginBottom: 24,
    },
    aiAvatarRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 10,
    },
    aiAvatar: {
        width: 26,
        height: 26,
        borderRadius: 8,
        backgroundColor: 'rgba(0, 201, 167, 0.12)',
        borderWidth: 1,
        borderColor: 'rgba(0,201,167,0.2)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    aiLabel: {
        color: 'rgba(255,255,255,0.45)',
        fontSize: 12,
        fontFamily: 'Outfit_600SemiBold',
        letterSpacing: 0.3,
    },
    aiContent: {
        paddingLeft: 34,
    },

    /* error */
    errorContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 16,
        paddingVertical: 8,
        paddingLeft: 50,
    },
    errorText: {
        fontSize: 13,
        fontFamily: 'Outfit_400Regular',
        color: '#FF453A',
    },

    /* input */
    inputArea: {
        paddingHorizontal: 16,
        paddingTop: 10,
        borderTopWidth: StyleSheet.hairlineWidth,
        borderTopColor: 'rgba(255,255,255,0.07)',
    },
    inputChipsContainer: {
        paddingBottom: 8,
        gap: 6,
    },
    inputChip: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 10,
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
    },
    inputChipText: {
        fontSize: 12,
        fontFamily: 'Outfit_500Medium',
        color: 'rgba(255,255,255,0.45)',
    },
    inputRow: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        gap: 10,
    },
    textInput: {
        flex: 1,
        minHeight: 44,
        maxHeight: 120,
        backgroundColor: 'rgba(255,255,255,0.06)',
        borderRadius: 14,
        paddingHorizontal: 16,
        paddingTop: 12,
        paddingBottom: 12,
        fontSize: 15,
        fontFamily: 'Outfit_400Regular',
        color: '#FFFFFF',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    sendButton: {
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: '#FFFFFF',
        alignItems: 'center',
        justifyContent: 'center',
    },
    sendButtonDisabled: {
        backgroundColor: 'rgba(255,255,255,0.08)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
    },
    disclaimer: {
        color: 'rgba(255,255,255,0.2)',
        fontSize: 11,
        fontFamily: 'Outfit_400Regular',
        textAlign: 'center',
        marginTop: 8,
    },
});

const markdownStyles = {
    body: { color: 'rgba(255,255,255,0.88)', fontFamily: 'Outfit_400Regular', fontSize: 15, lineHeight: 24 },
    heading1: { color: '#FFFFFF', fontFamily: 'Outfit_700Bold', fontSize: 18, marginTop: 10, marginBottom: 4 },
    heading2: { color: '#FFFFFF', fontFamily: 'Outfit_700Bold', fontSize: 16, marginTop: 8, marginBottom: 4 },
    heading3: { color: AI_COLOR, fontFamily: 'Outfit_600SemiBold', fontSize: 15, marginTop: 6, marginBottom: 2 },
    strong: { fontFamily: 'Outfit_700Bold', color: '#FFFFFF' },
    em: { fontFamily: 'Outfit_400Regular', fontStyle: 'italic' as const },
    bullet_list: { marginVertical: 4 },
    ordered_list: { marginVertical: 4 },
    list_item: { marginVertical: 2 },
    bullet_list_icon: { color: AI_COLOR, marginTop: 6 },
    code_inline: { backgroundColor: 'rgba(0,201,167,0.08)', color: AI_COLOR, borderRadius: 4, paddingHorizontal: 4 },
    fence: { backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 10, padding: 12, marginVertical: 6 },
    blockquote: { borderLeftWidth: 3, borderLeftColor: AI_COLOR, paddingLeft: 12, marginLeft: 0, opacity: 0.8 },
    paragraph: { marginVertical: 3 },
    hr: { backgroundColor: 'rgba(255,255,255,0.08)', height: 1, marginVertical: 12 },
};
