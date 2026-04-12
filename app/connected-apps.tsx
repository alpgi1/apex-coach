import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Modal,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import AnimatedBackground from '../src/components/layout/AnimatedBackground';
import {
    ApiKeyResponse,
    generateApiKey,
    listApiKeys,
    revokeApiKey,
} from '../src/services/api/apiKeyApi';

export default function ConnectedAppsScreen() {
    const router = useRouter();
    const [keys, setKeys] = useState<ApiKeyResponse[]>([]);
    const [loading, setLoading] = useState(true);

    // Generate modal state
    const [showGenerateModal, setShowGenerateModal] = useState(false);
    const [keyName, setKeyName] = useState('');
    const [generating, setGenerating] = useState(false);

    // Reveal modal state
    const [revealedKey, setRevealedKey] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);

    useFocusEffect(
        useCallback(() => {
            loadKeys();
        }, [])
    );

    const loadKeys = async () => {
        try {
            setLoading(true);
            const res = await listApiKeys();
            setKeys(res.data ?? []);
        } catch {
            setKeys([]);
        } finally {
            setLoading(false);
        }
    };

    const handleGenerate = async () => {
        const name = keyName.trim();
        if (!name) return;

        setGenerating(true);
        try {
            const res = await generateApiKey(name);
            setShowGenerateModal(false);
            setKeyName('');
            setRevealedKey(res.data.key);
            setCopied(false);
            await loadKeys();
        } catch (e: unknown) {
            const msg = e instanceof Error ? e.message : String(e);
            Alert.alert('Error', `Failed to generate API key.\n\n${msg}`);
        } finally {
            setGenerating(false);
        }
    };

    const handleCopy = async () => {
        if (!revealedKey) return;
        await Clipboard.setStringAsync(revealedKey);
        setCopied(true);
    };

    const handleRevoke = (key: ApiKeyResponse) => {
        Alert.alert(
            'Revoke API Key',
            `Remove "${key.name}"? Any app using this key will lose access immediately.`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Revoke',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await revokeApiKey(key.id);
                            setKeys((prev) => prev.filter((k) => k.id !== key.id));
                        } catch {
                            Alert.alert('Error', 'Failed to revoke key. Please try again.');
                        }
                    },
                },
            ]
        );
    };

    const formatLastUsed = (lastUsedAt: string | null): string => {
        if (!lastUsedAt) return 'Never used';
        const date = new Date(lastUsedAt);
        return `Last used ${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
    };

    return (
        <View style={styles.root}>
            <AnimatedBackground />

            <SafeAreaView edges={['top']} style={{ flex: 1 }}>
                {/* ── HEADER ────────────────────────────────── */}
                <View style={styles.header}>
                    <Pressable onPress={() => router.back()} style={styles.backBtn} className="active:opacity-70">
                        <Ionicons name="chevron-back" size={24} color="white" />
                    </Pressable>
                    <Text style={styles.headerTitle}>Connected Apps</Text>
                    <View style={{ width: 40 }} />
                </View>

                <ScrollView
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.scrollContent}
                >
                    {/* ── DESCRIPTION ───────────────────────── */}
                    <View style={styles.descCard} className="mb-4">
                        <View className="flex-row items-start gap-3">
                            <Ionicons name="key-outline" size={20} color="#FF6000" style={{ marginTop: 2 }} />
                            <Text style={styles.descText}>
                                Generate an API key to let other apps (like productivity trackers) read your workout data — duration and volume. Each key gives read-only access to your workouts.
                            </Text>
                        </View>
                    </View>

                    {/* ── API KEYS LIST ─────────────────────── */}
                    <View style={styles.card} className="mb-4">
                        <View className="flex-row items-center justify-between mb-3">
                            <Text style={styles.sectionLabel}>API Keys</Text>
                            <Pressable
                                onPress={() => setShowGenerateModal(true)}
                                className="flex-row items-center gap-1 active:opacity-70"
                            >
                                <Ionicons name="add" size={16} color="#FF6000" />
                                <Text style={styles.addText}>Generate</Text>
                            </Pressable>
                        </View>

                        {loading ? (
                            <ActivityIndicator color="#FF6000" style={{ paddingVertical: 16 }} />
                        ) : keys.length === 0 ? (
                            <Text style={styles.emptyText} className="py-4 text-center">
                                No API keys yet.{'\n'}Generate one to connect an external app.
                            </Text>
                        ) : (
                            keys.map((key, index) => (
                                <View
                                    key={key.id}
                                    style={index < keys.length - 1 ? styles.divider : undefined}
                                    className="flex-row items-center justify-between py-3"
                                >
                                    <View style={{ flex: 1 }}>
                                        <Text style={styles.keyName}>{key.name}</Text>
                                        <Text style={styles.keyPrefix}>
                                            {key.keyPrefix}••••••••••••••••••••
                                        </Text>
                                        <Text style={styles.keyMeta}>{formatLastUsed(key.lastUsedAt)}</Text>
                                    </View>
                                    <Pressable
                                        onPress={() => handleRevoke(key)}
                                        className="w-8 h-8 items-center justify-center active:opacity-70"
                                    >
                                        <Ionicons name="trash-outline" size={18} color="#FF3B30" />
                                    </Pressable>
                                </View>
                            ))
                        )}
                    </View>

                    {/* ── HOW TO USE ────────────────────────── */}
                    <View style={styles.card}>
                        <Text style={styles.sectionLabel} className="mb-3">How to use</Text>
                        <Text style={styles.howToText}>
                            1. Generate an API key above{'\n'}
                            2. Copy it and paste it into the external app's settings{'\n'}
                            3. The app can then call:{'\n\n'}
                            <Text style={styles.codeText}>
                                GET /api/public/v1/workouts{'\n'}
                                X-API-Key: {'<your key>'}
                            </Text>
                            {'\n\n'}
                            Returns workout date, duration, and volume.
                        </Text>
                    </View>
                </ScrollView>
            </SafeAreaView>

            {/* ── GENERATE KEY MODAL ────────────────────────── */}
            <Modal
                visible={showGenerateModal}
                transparent
                animationType="fade"
                onRequestClose={() => setShowGenerateModal(false)}
            >
                <Pressable
                    style={styles.modalOverlay}
                    onPress={() => setShowGenerateModal(false)}
                >
                    <Pressable style={styles.modalCard} onPress={() => {}}>
                        <Text style={styles.modalTitle}>New API Key</Text>
                        <Text style={styles.modalSubtitle}>Give it a name so you remember which app it's for.</Text>

                        <TextInput
                            value={keyName}
                            onChangeText={setKeyName}
                            placeholder="e.g. Productivity Tracker"
                            placeholderTextColor="rgba(255,255,255,0.3)"
                            style={styles.modalInput}
                            autoFocus
                            maxLength={100}
                            returnKeyType="done"
                            onSubmitEditing={handleGenerate}
                        />

                        <View className="flex-row gap-3 mt-4">
                            <Pressable
                                onPress={() => { setShowGenerateModal(false); setKeyName(''); }}
                                style={[styles.modalBtn, styles.modalBtnCancel]}
                                className="active:opacity-70"
                            >
                                <Text style={styles.modalBtnCancelText}>Cancel</Text>
                            </Pressable>
                            <Pressable
                                onPress={handleGenerate}
                                style={[styles.modalBtn, styles.modalBtnGenerate, { opacity: keyName.trim() ? 1 : 0.5 }]}
                                disabled={!keyName.trim() || generating}
                                className="active:opacity-70"
                            >
                                {generating
                                    ? <ActivityIndicator size="small" color="white" />
                                    : <Text style={styles.modalBtnGenerateText}>Generate</Text>
                                }
                            </Pressable>
                        </View>
                    </Pressable>
                </Pressable>
            </Modal>

            {/* ── REVEAL KEY MODAL ──────────────────────────── */}
            <Modal
                visible={!!revealedKey}
                transparent
                animationType="fade"
                onRequestClose={() => setRevealedKey(null)}
            >
                <Pressable style={styles.modalOverlay} onPress={() => {}}>
                    <View style={styles.modalCard}>
                        <View className="items-center mb-4">
                            <View style={styles.keyIcon}>
                                <Ionicons name="key" size={28} color="#FF6000" />
                            </View>
                        </View>

                        <Text style={styles.modalTitle}>Save Your Key</Text>
                        <Text style={[styles.modalSubtitle, { color: '#FF9500', marginBottom: 16 }]}>
                            This key will not be shown again. Copy it now.
                        </Text>

                        <Pressable onPress={handleCopy} style={styles.keyBox} className="active:opacity-80">
                            <Text style={styles.keyBoxText} numberOfLines={2} selectable>
                                {revealedKey}
                            </Text>
                            <Ionicons
                                name={copied ? 'checkmark-circle' : 'copy-outline'}
                                size={20}
                                color={copied ? '#34C759' : 'rgba(255,255,255,0.5)'}
                            />
                        </Pressable>

                        {copied && (
                            <Text style={styles.copiedText}>Copied to clipboard</Text>
                        )}

                        <Pressable
                            onPress={() => setRevealedKey(null)}
                            style={[styles.modalBtn, styles.modalBtnGenerate, { marginTop: 16 }]}
                            className="active:opacity-70"
                        >
                            <Text style={styles.modalBtnGenerateText}>Done</Text>
                        </Pressable>
                    </View>
                </Pressable>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    root: {
        flex: 1,
        backgroundColor: '#0A0A0A',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    backBtn: {
        width: 40,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: {
        color: 'white',
        fontSize: 18,
        fontWeight: '700',
    },
    scrollContent: {
        paddingHorizontal: 16,
        paddingBottom: 40,
        paddingTop: 8,
    },
    descCard: {
        backgroundColor: 'rgba(255,96,0,0.08)',
        borderWidth: 1,
        borderColor: 'rgba(255,96,0,0.2)',
        borderRadius: 16,
        paddingHorizontal: 16,
        paddingVertical: 14,
    },
    descText: {
        color: 'rgba(255,255,255,0.7)',
        fontSize: 14,
        lineHeight: 20,
        flex: 1,
    },
    card: {
        backgroundColor: 'rgba(255,255,255,0.07)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        borderRadius: 16,
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    sectionLabel: {
        color: 'rgba(255,255,255,0.4)',
        fontSize: 11,
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    addText: {
        color: '#FF6000',
        fontSize: 14,
        fontWeight: '600',
    },
    divider: {
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: 'rgba(255,255,255,0.1)',
    },
    emptyText: {
        color: 'rgba(255,255,255,0.4)',
        fontSize: 14,
        lineHeight: 20,
        textAlign: 'center',
    },
    keyName: {
        color: 'white',
        fontSize: 15,
        fontWeight: '600',
        marginBottom: 2,
    },
    keyPrefix: {
        color: 'rgba(255,255,255,0.5)',
        fontSize: 13,
        fontFamily: 'monospace',
        marginBottom: 2,
    },
    keyMeta: {
        color: 'rgba(255,255,255,0.3)',
        fontSize: 12,
    },
    howToText: {
        color: 'rgba(255,255,255,0.6)',
        fontSize: 14,
        lineHeight: 22,
    },
    codeText: {
        color: '#FF6000',
        fontFamily: 'monospace',
        fontSize: 12,
    },
    /* modals */
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.75)',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 24,
    },
    modalCard: {
        backgroundColor: '#1A1A1A',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.12)',
        borderRadius: 20,
        padding: 24,
        width: '100%',
    },
    modalTitle: {
        color: 'white',
        fontSize: 18,
        fontWeight: '700',
        marginBottom: 6,
        textAlign: 'center',
    },
    modalSubtitle: {
        color: 'rgba(255,255,255,0.5)',
        fontSize: 14,
        textAlign: 'center',
        marginBottom: 20,
        lineHeight: 20,
    },
    modalInput: {
        backgroundColor: 'rgba(255,255,255,0.07)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.15)',
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 12,
        color: 'white',
        fontSize: 16,
    },
    modalBtn: {
        flex: 1,
        paddingVertical: 13,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    modalBtnCancel: {
        backgroundColor: 'rgba(255,255,255,0.08)',
    },
    modalBtnCancelText: {
        color: 'rgba(255,255,255,0.7)',
        fontSize: 15,
        fontWeight: '600',
    },
    modalBtnGenerate: {
        backgroundColor: '#FF6000',
    },
    modalBtnGenerateText: {
        color: 'white',
        fontSize: 15,
        fontWeight: '700',
    },
    keyIcon: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: 'rgba(255,96,0,0.15)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    keyBox: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: 'rgba(255,255,255,0.07)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.12)',
        borderRadius: 12,
        paddingHorizontal: 14,
        paddingVertical: 12,
        gap: 10,
    },
    keyBoxText: {
        color: '#FF6000',
        fontFamily: 'monospace',
        fontSize: 13,
        flex: 1,
    },
    copiedText: {
        color: '#34C759',
        fontSize: 13,
        textAlign: 'center',
        marginTop: 8,
    },
});
