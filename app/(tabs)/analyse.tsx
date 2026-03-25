import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import {
    Alert,
    ActivityIndicator,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Body from 'react-native-body-highlighter';

import AnimatedBackground from '../../src/components/layout/AnimatedBackground';
import { computeWeeklyMuscleHeatmap } from '../../src/services/analytics/computeAnalytics';
import { deleteWorkoutFromBackend } from '../../src/services/api/workoutApi';
import { getAllExercises } from '../../src/services/storage/exerciseStorage';
import { deleteWorkoutSession, getWorkoutHistory } from '../../src/services/storage/workoutStorage';
import { ExerciseMetadata } from '../../src/types/exercise.types';
import { WorkoutSession } from '../../src/types/workout.types';
import { formatDate, formatDuration, formatVolume, getRpeTextClass } from '../../src/utils/formatters';

/* ──────────────────────── stat cards ─────────────────────────── */

const STAT_CARDS = [
    {
        icon: 'bar-chart-outline' as const,
        title: 'Volume Trend',
        desc: 'Weekly volume over the last 8 weeks',
        route: '/analyse/volume',
    },
    {
        icon: 'radio-button-on-outline' as const,
        title: 'Muscle Split',
        desc: 'Volume distribution by muscle group',
        route: '/analyse/muscle-split',
    },
];

/* ──────────────────────── main screen ────────────────────────── */

export default function AnalyseScreen() {
    const router = useRouter();
    const [history, setHistory] = useState<WorkoutSession[]>([]);
    const [exerciseMap, setExerciseMap] = useState<Map<string, ExerciseMetadata>>(new Map());
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [expanded, setExpanded] = useState<Record<string, boolean>>({});
    const INITIAL_HISTORY_COUNT = 5;
    const PAGE_SIZE = 10;
    const [visibleCount, setVisibleCount] = useState(INITIAL_HISTORY_COUNT);

    useFocusEffect(
        useCallback(() => {
            let cancelled = false;
            const load = async () => {
                setIsLoading(true);
                try {
                    const [sessions, exercises] = await Promise.all([
                        getWorkoutHistory(),
                        getAllExercises(),
                    ]);
                    if (cancelled) return;
                    setHistory(sessions);
                    setExerciseMap(new Map(exercises.map((e) => [e.id, e])));
                } catch (error) {
                    console.error('Failed to load analyse data:', error);
                } finally {
                    if (!cancelled) setIsLoading(false);
                }
            };
            load();
            return () => { cancelled = true; };
        }, [])
    );

    const heatmap = useMemo(
        () => computeWeeklyMuscleHeatmap(history, exerciseMap),
        [history, exerciseMap]
    );

    const toggleExpand = (sessionId: string) => {
        setExpanded((prev) => ({ ...prev, [sessionId]: !prev[sessionId] }));
    };

    const handleDelete = (session: WorkoutSession) => {
        Alert.alert(
            'Delete Workout',
            `Delete "${session.name}"? This cannot be undone.`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        await deleteWorkoutSession(session.id);
                        setHistory((prev) => prev.filter((s) => s.id !== session.id));
                        deleteWorkoutFromBackend(session.id).catch(() => {});
                    },
                },
            ]
        );
    };

    /* ═══════════════════ LOADING STATE ═══════════════════════ */
    if (isLoading) {
        return (
            <View style={styles.root}>
                <AnimatedBackground />
                <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <ActivityIndicator size="large" color="#FF6000" />
                    <Text className="text-[#8E8E93] text-sm mt-3">Loading analytics...</Text>
                </SafeAreaView>
            </View>
        );
    }

    /* ═══════════════════ EMPTY STATE ═════════════════════════ */
    if (history.length === 0) {
        return (
            <View style={styles.root}>
                <AnimatedBackground />
                <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24 }}>
                    <Ionicons name="analytics-outline" size={64} color="#3A3A3C" />
                    <Text className="text-white text-xl font-outfit-bold mt-4 text-center">No data yet</Text>
                    <Text className="text-[#8E8E93] text-sm mt-2 text-center">
                        Complete your first workout to see analytics here.
                    </Text>
                </SafeAreaView>
            </View>
        );
    }

    /* ═══════════════════ MAIN CONTENT ════════════════════════ */
    return (
        <View style={styles.root}>
            <AnimatedBackground />
            <SafeAreaView style={{ flex: 1 }}>
                <ScrollView
                    className="flex-1"
                    contentContainerStyle={{ paddingBottom: 100 }}
                    showsVerticalScrollIndicator={false}
                >
                    {/* ── HEADER ──────────────────────────────── */}
                    <View className="px-5 pt-3 pb-4">
                        <Text className="text-white text-2xl font-outfit-bold">Analyse</Text>
                    </View>

                    {/* ── BODY HEAT MAP ───────────────────────── */}
                    <View className="px-4 mb-2">
                        <View className="flex-row items-center justify-between mb-2 px-1">
                            <Text className="text-[#8E8E93] text-xs font-outfit-semibold uppercase tracking-wider">
                                Last 7 Days
                            </Text>
                            {heatmap.length === 0 && (
                                <Text className="text-[#3A3A3C] text-xs italic">No workouts this week</Text>
                            )}
                        </View>
                        <View className="flex-row justify-center">
                            <Body
                                data={heatmap.map((m) => ({ slug: m.slug, intensity: m.intensity }))}
                                side="front"
                                scale={0.9}
                                colors={['#FF6000', '#FF3B00', '#CC2200']}
                                defaultFill="#2C2C2E"
                                border="none"
                            />
                            <Body
                                data={heatmap.map((m) => ({ slug: m.slug, intensity: m.intensity }))}
                                side="back"
                                scale={0.9}
                                colors={['#FF6000', '#FF3B00', '#CC2200']}
                                defaultFill="#2C2C2E"
                                border="none"
                            />
                        </View>
                    </View>

                    {/* ── STATISTICS CARDS ────────────────────── */}
                    <View className="px-4 mb-4">
                        <Text className="text-[#8E8E93] text-xs font-outfit-semibold uppercase tracking-wider mb-2 px-1">
                            Statistics
                        </Text>
                        {STAT_CARDS.map((card) => (
                            <Pressable
                                key={card.route}
                                onPress={() => router.push(card.route as never)}
                                className="active:opacity-70"
                            >
                                <View style={styles.statCard} className="flex-row items-center px-4 py-3.5 mb-2">
                                    <View style={styles.statIcon} className="mr-3">
                                        <Ionicons name={card.icon} size={20} color="#FF6000" />
                                    </View>
                                    <View className="flex-1">
                                        <Text className="text-white font-outfit-semibold text-sm">{card.title}</Text>
                                        <Text className="text-[#8E8E93] text-xs mt-0.5">{card.desc}</Text>
                                    </View>
                                    <Ionicons name="chevron-forward" size={16} color="#3A3A3C" />
                                </View>
                            </Pressable>
                        ))}
                    </View>

                    {/* ── DIVIDER ─────────────────────────────── */}
                    <View className="h-px bg-white/10 mx-5 mb-4" />

                    {/* ── HISTORY HEADER ──────────────────────── */}
                    <View className="px-5 mb-3">
                        <Text className="text-white text-base font-outfit-semibold">
                            Workout History
                        </Text>
                    </View>

                    {/* ── SESSION CARDS ───────────────────────── */}
                    <View className="px-4">
                        {history.slice(0, visibleCount).map((session) => {
                            const isExpanded = expanded[session.id] ?? false;
                            const highRpe = (session.averageRPE ?? 0) > 8;

                            return (
                                <Pressable
                                    key={session.id}
                                    onPress={() => toggleExpand(session.id)}
                                    className="mb-3 active:opacity-90"
                                >
                                    <View style={styles.card} className="flex-row overflow-hidden">
                                        <View className={`w-1.5 ${highRpe ? 'bg-red-500' : 'bg-[#FF6000]'}`} />
                                        <View className="flex-1 p-4">
                                            <View className="flex-row items-center justify-between mb-1">
                                                <Text className="text-[#8E8E93] text-xs">
                                                    {formatDate(session.startTime)}
                                                </Text>
                                                <View className="bg-[#FF6000]/15 rounded-full px-2.5 py-0.5">
                                                    <Text className="text-[#FF6000] text-xs font-outfit-semibold">
                                                        {session.logs.length} exercise{session.logs.length !== 1 ? 's' : ''}
                                                    </Text>
                                                </View>
                                            </View>
                                            <Text className="text-white text-lg font-outfit-bold mb-2">
                                                {session.name}
                                            </Text>
                                            <View className="flex-row items-center gap-4">
                                                <View className="flex-row items-center gap-1">
                                                    <Ionicons name="barbell-outline" size={14} color="#8E8E93" />
                                                    <Text className="text-[#8E8E93] text-xs">
                                                        {formatVolume(session.volumeKg)} kg
                                                    </Text>
                                                </View>
                                                <View className="flex-row items-center gap-1">
                                                    <Ionicons name="speedometer-outline" size={14} color="#8E8E93" />
                                                    <Text className="text-[#8E8E93] text-xs">
                                                        RPE {session.averageRPE ?? '-'}
                                                    </Text>
                                                </View>
                                                <View className="flex-row items-center gap-1">
                                                    <Ionicons name="time-outline" size={14} color="#8E8E93" />
                                                    <Text className="text-[#8E8E93] text-xs">
                                                        {formatDuration(session.startTime, session.endTime)}
                                                    </Text>
                                                </View>
                                            </View>

                                            {isExpanded && (
                                                <View className="mt-4 border-t border-[#3A3A3C] pt-3">
                                                    {session.logs.map((log) => (
                                                        <View key={log.id} className="mb-4">
                                                            <Text className="text-[#FF6000] font-outfit-bold text-base mb-2">
                                                                {exerciseMap.get(log.exerciseId)?.name ?? log.exerciseId}
                                                            </Text>
                                                            <View className="flex-row mb-1 px-1">
                                                                <Text className="text-[#8E8E93] text-xs font-outfit-semibold w-10">SET</Text>
                                                                <Text className="text-[#8E8E93] text-xs font-outfit-semibold flex-1 text-center">WEIGHT</Text>
                                                                <Text className="text-[#8E8E93] text-xs font-outfit-semibold flex-1 text-center">REPS</Text>
                                                                <Text className="text-[#8E8E93] text-xs font-outfit-semibold flex-1 text-center">RPE</Text>
                                                            </View>
                                                            {log.sets.map((s) => {
                                                                const isHot = (s.rpe ?? 0) > 8.5;
                                                                return (
                                                                    <View
                                                                        key={s.id}
                                                                        className={`flex-row items-center py-1.5 px-1 ${isHot ? 'bg-red-500/10 rounded-lg' : ''}`}
                                                                    >
                                                                        <Text className="text-[#8E8E93] w-10 text-sm">{s.setNumber}</Text>
                                                                        <Text className="text-white flex-1 text-center text-sm">{s.weightKg} kg</Text>
                                                                        <Text className="text-white flex-1 text-center text-sm">{s.reps}</Text>
                                                                        <Text className={`flex-1 text-center text-sm font-outfit-semibold ${getRpeTextClass(s.rpe)}`}>
                                                                            {s.rpe ?? '-'}
                                                                        </Text>
                                                                    </View>
                                                                );
                                                            })}
                                                        </View>
                                                    ))}
                                                </View>
                                            )}
                                            {isExpanded && (
                                                <View className="mt-4 flex-row gap-3">
                                                    <Pressable
                                                        onPress={() => router.push(`/workout/${session.id}` as never)}
                                                        className="flex-1 border border-[#FF6000] rounded-full py-2.5 items-center flex-row justify-center active:opacity-70"
                                                    >
                                                        <Text className="text-[#FF6000] font-outfit-bold text-sm mr-2">
                                                            View Details
                                                        </Text>
                                                        <Ionicons name="arrow-forward" size={14} color="#FF6000" />
                                                    </Pressable>
                                                    <Pressable
                                                        onPress={() => handleDelete(session)}
                                                        className="border border-red-500/40 rounded-full px-4 py-2.5 items-center justify-center active:opacity-70"
                                                    >
                                                        <Ionicons name="trash-outline" size={16} color="#FF453A" />
                                                    </Pressable>
                                                </View>
                                            )}
                                        </View>
                                        <View className="justify-center pr-3">
                                            <Ionicons
                                                name={isExpanded ? 'chevron-down' : 'chevron-forward'}
                                                size={18}
                                                color="#8E8E93"
                                            />
                                        </View>
                                    </View>
                                </Pressable>
                            );
                        })}

                        {visibleCount < history.length && (
                            <Pressable
                                onPress={() => setVisibleCount((c) => Math.min(c + PAGE_SIZE, history.length))}
                                className="mb-3 py-3 items-center flex-row justify-center gap-2 active:opacity-70"
                            >
                                <Text className="text-[#FF6000] font-outfit-semibold text-sm">
                                    Show {Math.min(PAGE_SIZE, history.length - visibleCount)} more
                                </Text>
                                <Ionicons name="chevron-down" size={14} color="#FF6000" />
                            </Pressable>
                        )}
                        {visibleCount > INITIAL_HISTORY_COUNT && (
                            <Pressable
                                onPress={() => setVisibleCount(INITIAL_HISTORY_COUNT)}
                                className="mb-3 py-3 items-center flex-row justify-center gap-2 active:opacity-70"
                            >
                                <Text className="text-[#8E8E93] font-outfit-semibold text-sm">Show less</Text>
                                <Ionicons name="chevron-up" size={14} color="#8E8E93" />
                            </Pressable>
                        )}
                    </View>
                </ScrollView>
            </SafeAreaView>
        </View>
    );
}

const styles = StyleSheet.create({
    root: {
        flex: 1,
        backgroundColor: '#0A0A0A',
    },
    card: {
        backgroundColor: 'rgba(255,255,255,0.04)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
        borderRadius: 16,
    },
    statCard: {
        backgroundColor: 'rgba(255,255,255,0.04)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
        borderRadius: 16,
    },
    statIcon: {
        width: 38,
        height: 38,
        borderRadius: 19,
        backgroundColor: 'rgba(255,96,0,0.12)',
        alignItems: 'center',
        justifyContent: 'center',
    },
});
