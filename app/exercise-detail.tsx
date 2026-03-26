import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useMemo, useRef, useState } from 'react';
import {
    Image,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
    useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import AnimatedBackground from '../src/components/layout/AnimatedBackground';
import SkeletonBox from '../src/components/ui/SkeletonBox';
import { searchExercisesDb } from '../src/services/api/exerciseDbApi';
import { ExerciseMetadata } from '../src/types/exercise.types';

/* ────────────────────────── helpers ────────────────────────── */

const formatLabel = (raw: string): string =>
    raw
        .replace(/_/g, ' ')
        .toLowerCase()
        .replace(/\b\w/g, (c) => c.toUpperCase());

type TabKey = 'overview' | 'instructions';

/* ────────────────────────── component ─────────────────────── */

export default function ExerciseDetailScreen() {
    const router = useRouter();
    const { exercise: rawExercise } = useLocalSearchParams<{ exercise: string }>();
    const { width } = useWindowDimensions();
    const [activeTab, setActiveTab] = useState<TabKey>('overview');

    const exercise: ExerciseMetadata | null = useMemo(() => {
        try { return rawExercise ? JSON.parse(rawExercise) : null; }
        catch { return null; }
    }, [rawExercise]);

    // Lazy-loaded instructions from ExerciseDB API
    const [apiInstructions, setApiInstructions] = useState<string[] | null>(null);
    const [instructionsLoading, setInstructionsLoading] = useState(false);
    const fetchedRef = useRef(false);

    const fetchInstructions = useCallback(async (name: string) => {
        if (fetchedRef.current) return;
        fetchedRef.current = true;
        setInstructionsLoading(true);
        try {
            const res = await searchExercisesDb(name, 0, 5);
            const match = res.data.find(
                (e) => e.name.toLowerCase() === name.toLowerCase()
            ) ?? res.data[0];
            if (match?.instructions?.length) {
                setApiInstructions(match.instructions);
            } else {
                setApiInstructions([]);
            }
        } catch {
            setApiInstructions([]);
        } finally {
            setInstructionsLoading(false);
        }
    }, []);

    if (!exercise) {
        return (
            <View style={styles.root}>
                <AnimatedBackground />
                <SafeAreaView edges={['top']} style={styles.center}>
                    <Text style={styles.emptyText}>Exercise not found</Text>
                    <Pressable onPress={() => router.back()} style={styles.backBtn}>
                        <Text style={styles.backBtnText}>Go Back</Text>
                    </Pressable>
                </SafeAreaView>
            </View>
        );
    }

    const cardWidth = width - 32;

    return (
        <View style={styles.root}>
            <AnimatedBackground />

            <SafeAreaView style={{ flex: 1 }} edges={['top']}>
                {/* ── HEADER ──────────────────────────────────── */}
                <View style={styles.header}>
                    <Pressable onPress={() => router.back()} style={styles.headerBtn}>
                        <Ionicons name="arrow-back" size={22} color="white" />
                    </Pressable>
                    <Text style={styles.headerTitle} numberOfLines={1}>
                        {exercise.name}
                    </Text>
                    <View style={{ width: 40 }} />
                </View>

                {/* ── TABS ────────────────────────────────────── */}
                <View style={styles.tabBar}>
                    {(['overview', 'instructions'] as TabKey[]).map((tab) => (
                        <Pressable
                            key={tab}
                            onPress={() => {
                                setActiveTab(tab);
                                if (tab === 'instructions' && exercise) {
                                    fetchInstructions(exercise.name);
                                }
                            }}
                            style={[styles.tab, activeTab === tab && styles.tabActive]}
                        >
                            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
                                {tab === 'overview' ? 'Overview' : 'Instructions'}
                            </Text>
                        </Pressable>
                    ))}
                </View>

                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 60 }}>
                    {/* ── GIF ──────────────────────────────────── */}
                    {exercise.gifUrl ? (
                        <View style={[styles.gifContainer, { width: cardWidth, height: cardWidth * 0.75 }]}>
                            <Image
                                source={{ uri: exercise.gifUrl }}
                                style={{ width: '100%', height: '100%' }}
                                resizeMode="contain"
                            />
                        </View>
                    ) : (
                        <View style={[styles.gifPlaceholder, { width: cardWidth, height: cardWidth * 0.6 }]}>
                            <Ionicons name="barbell-outline" size={64} color="rgba(255,255,255,0.15)" />
                            <Text style={styles.gifPlaceholderText}>No GIF available</Text>
                        </View>
                    )}

                    {activeTab === 'overview' ? (
                        <View style={styles.content}>
                            {/* Name */}
                            <Text style={styles.exerciseName}>{exercise.name}</Text>

                            {/* Key info rows */}
                            <View style={styles.infoBlock}>
                                <InfoRow label="Category" value={formatLabel(exercise.category)} />
                                <InfoRow label="Equipment" value={formatLabel(exercise.equipment)} />
                                <InfoRow label="Rep Range" value={`${exercise.idealRepsMin} – ${exercise.idealRepsMax} reps`} />
                                <InfoRow label="Bilateral" value={exercise.isBilateral ? 'Yes' : 'No (unilateral)'} />
                            </View>

                            {/* Primary muscles */}
                            <View style={styles.badgeSection}>
                                <Text style={styles.sectionLabel}>Primary Muscles</Text>
                                <View style={styles.badgeRow}>
                                    {exercise.primaryMuscles.map((m) => (
                                        <View key={m} style={[styles.badge, styles.muscleBadge]}>
                                            <Text style={[styles.badgeText, styles.muscleBadgeText]}>{formatLabel(m)}</Text>
                                        </View>
                                    ))}
                                </View>
                            </View>

                            {/* Secondary muscles */}
                            {exercise.secondaryMuscles && exercise.secondaryMuscles.length > 0 && (
                                <View style={styles.badgeSection}>
                                    <Text style={styles.sectionLabel}>Secondary Muscles</Text>
                                    <View style={styles.badgeRow}>
                                        {exercise.secondaryMuscles.map((m) => (
                                            <View key={m} style={[styles.badge, styles.secondaryBadge]}>
                                                <Text style={[styles.badgeText, styles.secondaryBadgeText]}>{formatLabel(m)}</Text>
                                            </View>
                                        ))}
                                    </View>
                                </View>
                            )}
                        </View>
                    ) : (
                        /* ── INSTRUCTIONS TAB ─────────────────── */
                        <View style={styles.content}>
                            {instructionsLoading ? (
                                <View style={{ gap: 16 }}>
                                    {[0.9, 0.75, 0.85, 0.7, 0.8].map((w, i) => (
                                        <View key={i} style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 14 }}>
                                            <SkeletonBox width={28} height={28} borderRadius={14} />
                                            <View style={{ flex: 1, gap: 6 }}>
                                                <SkeletonBox width={`${Math.round(w * 100)}%`} height={14} borderRadius={6} />
                                                <SkeletonBox width={`${Math.round((w - 0.15) * 100)}%`} height={14} borderRadius={6} />
                                            </View>
                                        </View>
                                    ))}
                                </View>
                            ) : apiInstructions === null ? (
                                // Not yet triggered (shouldn't happen)
                                <View style={styles.emptyInstructions}>
                                    <Ionicons name="document-text-outline" size={40} color="#3A3A3C" />
                                    <Text style={styles.emptyText}>Tap to load instructions</Text>
                                </View>
                            ) : apiInstructions.length === 0 ? (
                                <View style={styles.emptyInstructions}>
                                    <Ionicons name="document-text-outline" size={40} color="#3A3A3C" />
                                    <Text style={styles.emptyText}>No instructions available</Text>
                                </View>
                            ) : (
                                apiInstructions.map((step, i) => (
                                    <View key={i} style={styles.stepRow}>
                                        <View style={styles.stepNum}>
                                            <Text style={styles.stepNumText}>{i + 1}</Text>
                                        </View>
                                        <Text style={styles.stepText}>{step}</Text>
                                    </View>
                                ))
                            )}
                        </View>
                    )}
                </ScrollView>
            </SafeAreaView>
        </View>
    );
}

/* ── small helper component ─────────────────────────────────── */

function InfoRow({ label, value }: { label: string; value: string }) {
    return (
        <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>{label}</Text>
            <Text style={styles.infoValue}>{value}</Text>
        </View>
    );
}

/* ────────────────────────── styles ─────────────────────────── */

const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: '#0A0A0A' },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    header: {
        flexDirection: 'row', alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16, paddingVertical: 10,
    },
    headerBtn: {
        width: 40, height: 40, borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.08)',
        alignItems: 'center', justifyContent: 'center',
    },
    headerTitle: {
        color: 'white', fontSize: 18, fontWeight: 'bold',
        fontFamily: 'Outfit_700Bold', flex: 1,
        textAlign: 'center', marginHorizontal: 8,
    },
    tabBar: {
        flexDirection: 'row', paddingHorizontal: 16, marginBottom: 4,
    },
    tab: {
        flex: 1, paddingVertical: 10, alignItems: 'center',
        borderBottomWidth: 2, borderBottomColor: 'transparent',
    },
    tabActive: { borderBottomColor: '#FF6000' },
    tabText: {
        color: 'rgba(255,255,255,0.4)', fontSize: 15,
        fontWeight: '600', fontFamily: 'Outfit_600SemiBold',
    },
    tabTextActive: { color: '#FF6000' },
    /* GIF */
    gifContainer: {
        backgroundColor: '#FFFFFF', borderRadius: 16,
        marginHorizontal: 16, overflow: 'hidden',
    },
    gifPlaceholder: {
        backgroundColor: 'rgba(255,255,255,0.04)',
        borderRadius: 16, marginHorizontal: 16,
        alignItems: 'center', justifyContent: 'center', gap: 10,
        borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
    },
    gifPlaceholderText: {
        color: 'rgba(255,255,255,0.2)', fontSize: 14,
        fontFamily: 'Outfit_500Medium',
    },
    /* content */
    content: { paddingHorizontal: 20, paddingTop: 20 },
    exerciseName: {
        color: 'white', fontSize: 24, fontWeight: 'bold',
        fontFamily: 'Outfit_700Bold', marginBottom: 16,
    },
    infoBlock: {
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 14, paddingVertical: 4,
        borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
        marginBottom: 4,
    },
    infoRow: {
        flexDirection: 'row', justifyContent: 'space-between',
        paddingHorizontal: 16, paddingVertical: 12,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: 'rgba(255,255,255,0.07)',
    },
    infoLabel: {
        color: 'rgba(255,255,255,0.4)', fontSize: 14,
        fontFamily: 'Outfit_500Medium',
    },
    infoValue: {
        color: 'rgba(255,255,255,0.85)', fontSize: 14,
        fontFamily: 'Outfit_500Medium', textAlign: 'right', flex: 1, marginLeft: 12,
    },
    /* badges */
    badgeSection: { marginTop: 20 },
    sectionLabel: {
        color: 'rgba(255,255,255,0.35)', fontSize: 11, fontWeight: '600',
        textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10,
        fontFamily: 'Outfit_600SemiBold',
    },
    badgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    badge: {
        borderRadius: 12, paddingHorizontal: 14, paddingVertical: 8,
        borderWidth: 1,
    },
    badgeText: { fontSize: 13, fontWeight: '600', fontFamily: 'Outfit_600SemiBold' },
    muscleBadge: {
        backgroundColor: 'rgba(255, 96, 0, 0.12)',
        borderColor: 'rgba(255, 96, 0, 0.25)',
    },
    muscleBadgeText: { color: '#FF6000' },
    secondaryBadge: {
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderColor: 'rgba(255,255,255,0.08)',
    },
    secondaryBadgeText: { color: 'rgba(255,255,255,0.45)' },
    /* instructions */
    emptyInstructions: { alignItems: 'center', paddingVertical: 40, gap: 12 },
    emptyText: {
        color: 'rgba(255,255,255,0.4)', fontSize: 15,
        fontFamily: 'Outfit_500Medium',
    },
    loadingText: {
        color: '#8E8E93', fontSize: 14, marginTop: 8,
        fontFamily: 'Outfit_500Medium',
    },
    stepRow: {
        flexDirection: 'row', marginBottom: 16, alignItems: 'flex-start',
    },
    stepNum: {
        width: 28, height: 28, borderRadius: 14,
        backgroundColor: 'rgba(255, 96, 0, 0.15)',
        alignItems: 'center', justifyContent: 'center',
        marginRight: 14, marginTop: 1,
    },
    stepNumText: {
        color: '#FF6000', fontSize: 13, fontWeight: '700',
        fontFamily: 'Outfit_700Bold',
    },
    stepText: {
        color: 'rgba(255,255,255,0.75)', fontSize: 15,
        lineHeight: 22, flex: 1,
        fontFamily: 'Outfit_400Regular',
    },
    /* back btn */
    backBtn: {
        marginTop: 16, backgroundColor: '#FF6000',
        paddingHorizontal: 24, paddingVertical: 10, borderRadius: 12,
    },
    backBtnText: {
        color: 'white', fontSize: 15, fontWeight: '600',
        fontFamily: 'Outfit_600SemiBold',
    },
});
