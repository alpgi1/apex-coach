import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import {
    ActivityIndicator,
    Pressable,
    ScrollView,
    Text,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getExerciseById } from '../../src/services/storage/exerciseStorage';
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

export default function HistoryScreen() {
    const [history, setHistory] = useState<WorkoutSession[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [expanded, setExpanded] = useState<Record<string, boolean>>({});
    const [exerciseNames, setExerciseNames] = useState<Record<string, string>>({});
    const router = useRouter();

    /* ── load history on focus ───────────────────────────────── */
    useFocusEffect(
        useCallback(() => {
            let cancelled = false;

            const load = async () => {
                setIsLoading(true);
                try {
                    const data = await getWorkoutHistory();
                    if (!cancelled) setHistory(data);
                } catch (error) {
                    console.error('Failed to load workout history:', error);
                } finally {
                    if (!cancelled) setIsLoading(false);
                }
            };

            load();
            return () => {
                cancelled = true;
            };
        }, [])
    );

    /* ── resolve exercise names when expanding ───────────────── */
    const resolveExerciseNames = async (session: WorkoutSession) => {
        const missing = session.logs
            .map((l) => l.exerciseId)
            .filter((id) => !exerciseNames[id]);

        if (missing.length === 0) return;

        const results: Record<string, string> = {};
        for (const id of missing) {
            try {
                const ex: ExerciseMetadata | null = await getExerciseById(id);
                results[id] = ex?.name ?? id;
            } catch {
                results[id] = id;
            }
        }

        setExerciseNames((prev) => ({ ...prev, ...results }));
    };

    /* ── toggle expand ───────────────────────────────────────── */
    const toggleExpand = async (session: WorkoutSession) => {
        const isExpanding = !expanded[session.id];
        setExpanded((prev) => ({ ...prev, [session.id]: isExpanding }));
        if (isExpanding) {
            await resolveExerciseNames(session);
        }
    };

    /* ═══════════════════ LOADING STATE ═══════════════════════ */
    if (isLoading) {
        return (
            <SafeAreaView className="flex-1 bg-[#1A1A1A] justify-center items-center">
                <ActivityIndicator size="large" color="#FF6000" />
                <Text className="text-[#8E8E93] text-sm mt-3">
                    Loading history...
                </Text>
            </SafeAreaView>
        );
    }

    /* ═══════════════════ EMPTY STATE ═════════════════════════ */
    if (history.length === 0) {
        return (
            <SafeAreaView className="flex-1 bg-[#1A1A1A] justify-center items-center px-6">
                <Ionicons name="barbell-outline" size={64} color="#3A3A3C" />
                <Text className="text-white text-xl font-bold mt-4 text-center">
                    No workouts yet
                </Text>
                <Text className="text-[#8E8E93] text-sm mt-2 text-center">
                    Start your first workout
                </Text>
            </SafeAreaView>
        );
    }

    /* ═══════════════════ HISTORY LIST ════════════════════════ */
    return (
        <SafeAreaView className="flex-1 bg-[#1A1A1A]">
            {/* ── SECTION 1 — HEADER ────────────────────────── */}
            <View className="flex-row items-center justify-between px-5 pt-3 pb-4">
                <Text className="text-white text-2xl font-bold">
                    Training History
                </Text>
                <Pressable className="w-10 h-10 items-center justify-center rounded-full bg-[#242424] active:opacity-70">
                    <Ionicons name="options-outline" size={20} color="#FFFFFF" />
                </Pressable>
            </View>

            {/* ── SECTION 2 — SESSION LIST ───────────────────── */}
            <ScrollView
                className="flex-1"
                contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 32 }}
                showsVerticalScrollIndicator={false}
            >
                {history.map((session) => {
                    const isExpanded = expanded[session.id] ?? false;
                    const highRpe = (session.averageRPE ?? 0) > 8;

                    return (
                        <Pressable
                            key={session.id}
                            onPress={() => toggleExpand(session)}
                            className="mb-3 active:opacity-90"
                        >
                            <View className="bg-[#242424] rounded-2xl flex-row overflow-hidden">
                                {/* Left accent bar */}
                                <View
                                    className={`w-1.5 ${highRpe ? 'bg-red-500' : 'bg-[#FF6000]'
                                        }`}
                                />

                                {/* Card content */}
                                <View className="flex-1 p-4">
                                    {/* Top row: date + category */}
                                    <View className="flex-row items-center justify-between mb-1">
                                        <Text className="text-[#8E8E93] text-xs">
                                            {formatDate(session.startTime)}
                                        </Text>
                                        <View className="bg-[#FF6000]/15 rounded-full px-2.5 py-0.5">
                                            <Text className="text-[#FF6000] text-xs font-semibold">
                                                {session.logs.length} exercise
                                                {session.logs.length !== 1 ? 's' : ''}
                                            </Text>
                                        </View>
                                    </View>

                                    {/* Workout name */}
                                    <Text className="text-white text-lg font-bold mb-2">
                                        {session.name}
                                    </Text>

                                    {/* Stats row */}
                                    <View className="flex-row items-center gap-4">
                                        <View className="flex-row items-center gap-1">
                                            <Ionicons
                                                name="barbell-outline"
                                                size={14}
                                                color="#8E8E93"
                                            />
                                            <Text className="text-[#8E8E93] text-xs">
                                                {formatVolume(session.volumeKg)} kg
                                            </Text>
                                        </View>

                                        <View className="flex-row items-center gap-1">
                                            <Ionicons
                                                name="speedometer-outline"
                                                size={14}
                                                color="#8E8E93"
                                            />
                                            <Text className="text-[#8E8E93] text-xs">
                                                RPE {session.averageRPE ?? '-'}
                                            </Text>
                                        </View>

                                        <View className="flex-row items-center gap-1">
                                            <Ionicons
                                                name="time-outline"
                                                size={14}
                                                color="#8E8E93"
                                            />
                                            <Text className="text-[#8E8E93] text-xs">
                                                {formatDuration(
                                                    session.startTime,
                                                    session.endTime
                                                )}
                                            </Text>
                                        </View>
                                    </View>

                                    {/* ── EXPANDED: exercise details ──── */}
                                    {isExpanded && (
                                        <View className="mt-4 border-t border-[#3A3A3C] pt-3">
                                            {session.logs.map((log) => (
                                                <View key={log.id} className="mb-4">
                                                    {/* Exercise name */}
                                                    <Text className="text-[#FF6000] font-bold text-base mb-2">
                                                        {exerciseNames[log.exerciseId] ??
                                                            log.exerciseId}
                                                    </Text>

                                                    {/* Set table header */}
                                                    <View className="flex-row mb-1 px-1">
                                                        <Text className="text-[#8E8E93] text-xs font-semibold w-10">
                                                            SET
                                                        </Text>
                                                        <Text className="text-[#8E8E93] text-xs font-semibold flex-1 text-center">
                                                            WEIGHT
                                                        </Text>
                                                        <Text className="text-[#8E8E93] text-xs font-semibold flex-1 text-center">
                                                            REPS
                                                        </Text>
                                                        <Text className="text-[#8E8E93] text-xs font-semibold flex-1 text-center">
                                                            RPE
                                                        </Text>
                                                    </View>

                                                    {/* Set rows */}
                                                    {log.sets.map((s) => {
                                                        const isHot =
                                                            (s.rpe ?? 0) > 8.5;
                                                        return (
                                                            <View
                                                                key={s.id}
                                                                className={`flex-row items-center py-1.5 px-1 ${isHot
                                                                        ? 'bg-red-500/10 rounded-lg'
                                                                        : ''
                                                                    }`}
                                                            >
                                                                <Text className="text-[#8E8E93] w-10 text-sm">
                                                                    {s.setNumber}
                                                                </Text>
                                                                <Text className="text-white flex-1 text-center text-sm">
                                                                    {s.weightKg} kg
                                                                </Text>
                                                                <Text className="text-white flex-1 text-center text-sm">
                                                                    {s.reps}
                                                                </Text>
                                                                <Text
                                                                    className={`flex-1 text-center text-sm font-semibold ${rpeColor(
                                                                        s.rpe
                                                                    )}`}
                                                                >
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
                                            <Text className="text-[#FF6000] font-bold text-sm mr-2">
                                                View Full Details
                                            </Text>
                                            <Ionicons name="arrow-forward" size={14} color="#FF6000" />
                                        </Pressable>
                                    )}
                                </View>

                                {/* Chevron */}
                                <View className="justify-center pr-3">
                                    <Ionicons
                                        name={
                                            isExpanded
                                                ? 'chevron-down'
                                                : 'chevron-forward'
                                        }
                                        size={18}
                                        color="#8E8E93"
                                    />
                                </View>
                            </View>
                        </Pressable>
                    );
                })}
            </ScrollView>
        </SafeAreaView>
    );
}