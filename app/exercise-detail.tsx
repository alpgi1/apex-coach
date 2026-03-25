import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
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
import { ExerciseDbItem } from '../src/services/api/exerciseDbApi';

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

    const exercise: ExerciseDbItem | null = useMemo(() => {
        try {
            return rawExercise ? JSON.parse(rawExercise) : null;
        } catch {
            return null;
        }
    }, [rawExercise]);

    if (!exercise) {
        return (
            <View style={styles.root}>
                <AnimatedBackground />
                <SafeAreaView style={styles.center}>
                    <Text style={styles.emptyText}>Exercise not found</Text>
                    <Pressable onPress={() => router.back()} style={styles.backBtn}>
                        <Text style={styles.backBtnText}>Go Back</Text>
                    </Pressable>
                </SafeAreaView>
            </View>
        );
    }

    const gifSize = width;

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
                            onPress={() => setActiveTab(tab)}
                            style={[
                                styles.tab,
                                activeTab === tab && styles.tabActive,
                            ]}
                        >
                            <Text
                                style={[
                                    styles.tabText,
                                    activeTab === tab && styles.tabTextActive,
                                ]}
                            >
                                {tab === 'overview' ? 'Overview' : 'Instructions'}
                            </Text>
                        </Pressable>
                    ))}
                </View>

                <ScrollView
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{ paddingBottom: 60 }}
                >
                    {/* ── GIF ──────────────────────────────────── */}
                    <View style={[styles.gifContainer, { width: gifSize - 32, height: (gifSize - 32) * 0.75 }]}>
                        <Image
                            source={{ uri: exercise.gifUrl }}
                            style={{ width: '100%', height: '100%' }}
                            resizeMode="contain"
                        />
                    </View>

                    {activeTab === 'overview' ? (
                        <View style={styles.content}>
                            {/* Exercise name */}
                            <Text style={styles.exerciseName}>{exercise.name}</Text>

                            {/* Primary muscles */}
                            <View style={styles.infoRow}>
                                <Text style={styles.infoLabel}>Primary:</Text>
                                <Text style={styles.infoValue}>
                                    {exercise.targetMuscles.map(formatLabel).join(', ')}
                                </Text>
                            </View>

                            {/* Secondary muscles */}
                            {exercise.secondaryMuscles.length > 0 && (
                                <View style={styles.infoRow}>
                                    <Text style={styles.infoLabel}>Secondary:</Text>
                                    <Text style={styles.infoValue}>
                                        {exercise.secondaryMuscles.map(formatLabel).join(', ')}
                                    </Text>
                                </View>
                            )}

                            {/* Body parts */}
                            {exercise.bodyParts.length > 0 && (
                                <View style={styles.infoRow}>
                                    <Text style={styles.infoLabel}>Body Parts:</Text>
                                    <Text style={styles.infoValue}>
                                        {exercise.bodyParts.map(formatLabel).join(', ')}
                                    </Text>
                                </View>
                            )}

                            {/* Equipment badges */}
                            <View style={styles.badgeSection}>
                                <Text style={styles.sectionLabel}>Equipment</Text>
                                <View style={styles.badgeRow}>
                                    {exercise.equipments.map((e) => (
                                        <View key={e} style={styles.badge}>
                                            <Ionicons name="barbell-outline" size={14} color="#FF6000" style={{ marginRight: 6 }} />
                                            <Text style={styles.badgeText}>{formatLabel(e)}</Text>
                                        </View>
                                    ))}
                                </View>
                            </View>

                            {/* Target muscles badges */}
                            <View style={styles.badgeSection}>
                                <Text style={styles.sectionLabel}>Target Muscles</Text>
                                <View style={styles.badgeRow}>
                                    {exercise.targetMuscles.map((m) => (
                                        <View key={m} style={[styles.badge, styles.muscleBadge]}>
                                            <Text style={[styles.badgeText, styles.muscleBadgeText]}>{formatLabel(m)}</Text>
                                        </View>
                                    ))}
                                    {exercise.secondaryMuscles.map((m) => (
                                        <View key={m} style={[styles.badge, styles.secondaryBadge]}>
                                            <Text style={[styles.badgeText, styles.secondaryBadgeText]}>{formatLabel(m)}</Text>
                                        </View>
                                    ))}
                                </View>
                            </View>
                        </View>
                    ) : (
                        /* ── INSTRUCTIONS TAB ─────────────────── */
                        <View style={styles.content}>
                            {exercise.instructions.length === 0 ? (
                                <View style={styles.emptyInstructions}>
                                    <Ionicons name="document-text-outline" size={40} color="#3A3A3C" />
                                    <Text style={styles.emptyText}>No instructions available</Text>
                                </View>
                            ) : (
                                exercise.instructions.map((step, i) => (
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

/* ────────────────────────── styles ─────────────────────────── */

const styles = StyleSheet.create({
    root: {
        flex: 1,
        backgroundColor: '#0A0A0A',
    },
    center: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    /* header */
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 10,
    },
    headerBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.08)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
        fontFamily: 'Outfit_700Bold',
        flex: 1,
        textAlign: 'center',
        marginHorizontal: 8,
    },
    /* tabs */
    tabBar: {
        flexDirection: 'row',
        paddingHorizontal: 16,
        marginBottom: 4,
        gap: 4,
    },
    tab: {
        flex: 1,
        paddingVertical: 10,
        alignItems: 'center',
        borderBottomWidth: 2,
        borderBottomColor: 'transparent',
    },
    tabActive: {
        borderBottomColor: '#FF6000',
    },
    tabText: {
        color: 'rgba(255,255,255,0.4)',
        fontSize: 15,
        fontWeight: '600',
        fontFamily: 'Outfit_600SemiBold',
    },
    tabTextActive: {
        color: '#FF6000',
    },
    /* gif */
    gifContainer: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        marginHorizontal: 16,
        overflow: 'hidden' as const,
    },
    /* content */
    content: {
        paddingHorizontal: 20,
        paddingTop: 20,
    },
    exerciseName: {
        color: 'white',
        fontSize: 24,
        fontWeight: 'bold',
        fontFamily: 'Outfit_700Bold',
        marginBottom: 16,
    },
    infoRow: {
        flexDirection: 'row',
        marginBottom: 8,
    },
    infoLabel: {
        color: 'rgba(255,255,255,0.4)',
        fontSize: 14,
        fontFamily: 'Outfit_500Medium',
        width: 90,
    },
    infoValue: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: 14,
        fontFamily: 'Outfit_400Regular',
        flex: 1,
    },
    /* badge sections */
    badgeSection: {
        marginTop: 20,
    },
    sectionLabel: {
        color: 'rgba(255,255,255,0.35)',
        fontSize: 11,
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: 10,
        fontFamily: 'Outfit_600SemiBold',
    },
    badgeRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    badge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.07)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        borderRadius: 12,
        paddingHorizontal: 14,
        paddingVertical: 8,
    },
    badgeText: {
        color: 'rgba(255,255,255,0.6)',
        fontSize: 13,
        fontWeight: '600',
        fontFamily: 'Outfit_600SemiBold',
    },
    muscleBadge: {
        backgroundColor: 'rgba(255, 96, 0, 0.12)',
        borderColor: 'rgba(255, 96, 0, 0.25)',
    },
    muscleBadgeText: {
        color: '#FF6000',
    },
    secondaryBadge: {
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderColor: 'rgba(255,255,255,0.08)',
    },
    secondaryBadgeText: {
        color: 'rgba(255,255,255,0.45)',
    },
    /* instructions */
    emptyInstructions: {
        alignItems: 'center',
        paddingVertical: 40,
        gap: 12,
    },
    emptyText: {
        color: 'rgba(255,255,255,0.4)',
        fontSize: 15,
        fontFamily: 'Outfit_500Medium',
    },
    stepRow: {
        flexDirection: 'row',
        marginBottom: 16,
        alignItems: 'flex-start',
    },
    stepNum: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: 'rgba(255, 96, 0, 0.15)',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 14,
        marginTop: 1,
    },
    stepNumText: {
        color: '#FF6000',
        fontSize: 13,
        fontWeight: '700',
        fontFamily: 'Outfit_700Bold',
    },
    stepText: {
        color: 'rgba(255,255,255,0.75)',
        fontSize: 15,
        lineHeight: 22,
        flex: 1,
        fontFamily: 'Outfit_400Regular',
    },
    /* back btn for error state */
    backBtn: {
        marginTop: 16,
        backgroundColor: '#FF6000',
        paddingHorizontal: 24,
        paddingVertical: 10,
        borderRadius: 12,
    },
    backBtnText: {
        color: 'white',
        fontSize: 15,
        fontWeight: '600',
        fontFamily: 'Outfit_600SemiBold',
    },
});
