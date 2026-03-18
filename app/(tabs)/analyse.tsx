import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import SpiderChart from '../../src/components/charts/SpiderChart';
import VolumeBarChart from '../../src/components/charts/VolumeBarChart';
import AnimatedBackground from '../../src/components/layout/AnimatedBackground';
import {
    computeMuscleGroupSplit,
    computeWeeklyVolume,
} from '../../src/services/analytics/computeAnalytics';
import { getAllExercises } from '../../src/services/storage/exerciseStorage';
import { getWorkoutHistory } from '../../src/services/storage/workoutStorage';
import { ExerciseMetadata } from '../../src/types/exercise.types';
import { WorkoutSession } from '../../src/types/workout.types';

/* ──────────────────────────── helpers ──────────────────────────── */

const rpeColor = (rpe: number | undefined): string => {
    if (rpe === undefined) return 'text-white';
    if (rpe <= 7) return 'text-green-400';
    if (rpe <= 8.5) return 'text-yellow-400';
    return 'text-red-400';
};

const formatDate = (iso: string): string => {
    const d = new Date(iso);
    return d.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
    });
};

const formatDuration = (start: string, end: string | null): string => {
    if (!end) return '--';
    const diffMs = new Date(end).getTime() - new Date(start).getTime();
    const mins = Math.round(diffMs / 60000);
    if (mins < 60) return `${mins}m`;
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return `${h}h ${m}m`;
};

const formatVolume = (kg: number): string =>
    kg >= 1000 ? `${(kg / 1000).toFixed(1)}k` : `${kg.toLocaleString()}`;

/* ──────────────────────── main screen ─────────────────────────── */

export default function AnalyseScreen() {
    const router = useRouter();
    const [history, setHistory] = useState<WorkoutSession[]>([]);
    const [exerciseMap, setExerciseMap] = useState<Map<string, ExerciseMetadata>>(new Map());
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [expanded, setExpanded] = useState<Record<string, boolean>>({});

    /* ── load data on focus ─────────────────────────────────── */
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

    /* ── computed analytics ─────────────────────────────────── */
    const weeklyVolume = useMemo(
        () => computeWeeklyVolume(history, 8),
        [history],
    );
    const muscleGroupSplit = useMemo(
        () => computeMuscleGroupSplit(history, exerciseMap),
        [history, exerciseMap],
    );

    /* ── toggle expand ──────────────────────────────────────── */
    const toggleExpand = (sessionId: string) => {
        setExpanded((prev) => ({ ...prev, [sessionId]: !prev[sessionId] }));
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
                    {/* ── HEADER ───────────────────────────────────── */}
                    <View className="flex-row items-center justify-between px-5 pt-3 pb-4">
                        <Text className="text-white text-2xl font-outfit-bold">Analyse</Text>
                    </View>

                    {/* ── VOLUME TREND ─────────────────────────────── */}
                    <View className="px-4 mb-4">
                        <Text className="text-white text-base font-outfit-semibold mb-3 px-1">
                            Volume Trend
                        </Text>
                        <View className="rounded-2xl border border-white/10 bg-white/[0.07] p-4">
                            <VolumeBarChart data={weeklyVolume} />
                        </View>
                    </View>

                    {/* ── MUSCLE GROUP SPLIT ───────────────────────── */}
                    <View className="px-4 mb-6">
                        <Text className="text-white text-base font-outfit-semibold mb-3 px-1">
                            Muscle Group Split
                        </Text>
                        <View className="rounded-2xl border border-white/10 bg-white/[0.07] p-4 items-center">
                            <SpiderChart data={muscleGroupSplit} />
                        </View>
                    </View>

                    {/* ── DIVIDER ──────────────────────────────────── */}
                    <View className="h-px bg-white/10 mx-5 mb-4" />

                    {/* ── HISTORY HEADER ───────────────────────────── */}
                    <View className="px-5 mb-3">
                        <Text className="text-white text-base font-outfit-semibold">
                            Workout History
                        </Text>
                    </View>

                    {/* ── SESSION CARDS ────────────────────────────── */}
                    <View className="px-4">
                        {history.map((session) => {
                            const isExpanded = expanded[session.id] ?? false;
                            const highRpe = (session.averageRPE ?? 0) > 8;

                            return (
                                <Pressable
                                    key={session.id}
                                    onPress={() => toggleExpand(session.id)}
                                    className="mb-3 active:opacity-90"
                                >
                                    <View style={styles.card} className="flex-row overflow-hidden">
                                        {/* Left accent bar */}
                                        <View
                                            className={`w-1.5 ${highRpe ? 'bg-red-500' : 'bg-[#FF6000]'}`}
                                        />

                                        {/* Card content */}
                                        <View className="flex-1 p-4">
                                            {/* Top row: date + category */}
                                            <View className="flex-row items-center justify-between mb-1">
                                                <Text className="text-[#8E8E93] text-xs">
                                                    {formatDate(session.startTime)}
                                                </Text>
                                                <View className="bg-[#FF6000]/15 rounded-full px-2.5 py-0.5">
                                                    <Text className="text-[#FF6000] text-xs font-outfit-semibold">
                                                        {session.logs.length} exercise
                                                        {session.logs.length !== 1 ? 's' : ''}
                                                    </Text>
                                                </View>
                                            </View>

                                            {/* Workout name */}
                                            <Text className="text-white text-lg font-outfit-bold mb-2">
                                                {session.name}
                                            </Text>

                                            {/* Stats row */}
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

                                            {/* ── EXPANDED: exercise details ──── */}
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
                                                                        <Text className={`flex-1 text-center text-sm font-outfit-semibold ${rpeColor(s.rpe)}`}>
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
                                                <Pressable
                                                    onPress={() => router.push(`/workout/${session.id}` as never)}
                                                    className="mt-4 border border-[#FF6000] rounded-full py-2.5 items-center flex-row justify-center active:opacity-70"
                                                >
                                                    <Text className="text-[#FF6000] font-outfit-bold text-sm mr-2">
                                                        View Full Details
                                                    </Text>
                                                    <Ionicons name="arrow-forward" size={14} color="#FF6000" />
                                                </Pressable>
                                            )}
                                        </View>

                                        {/* Chevron */}
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
        backgroundColor: 'rgba(255,255,255,0.07)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
        borderRadius: 16,
    },
});
