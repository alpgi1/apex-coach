import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Pressable,
    ScrollView,
    Text,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getExerciseById } from '../../src/services/storage/exerciseStorage';
import { getWorkoutSessionById } from '../../src/services/storage/workoutStorage';
import { WorkoutSession } from '../../src/types/workout.types';
import { formatDateLong, formatDuration, formatVolume, getRpeTextClass } from '../../src/utils/formatters';

const countTotalSets = (session: WorkoutSession): number =>
    session.logs.reduce((sum, log) => sum + log.sets.length, 0);

/* ────────────────────── stat box component ────────────────────── */

interface StatBoxProps {
    icon: keyof typeof Ionicons.glyphMap;
    label: string;
    value: string;
}

function StatBox({ icon, label, value }: StatBoxProps) {
    return (
        <View className="flex-1 items-center">
            <Ionicons name={icon} size={18} color="#FF6000" />
            <Text className="text-white text-lg font-bold mt-1">{value}</Text>
            <Text className="text-[#8E8E93] text-xs mt-0.5">{label}</Text>
        </View>
    );
}

/* ──────────────────────── main screen ─────────────────────────── */

export default function SessionDetailScreen() {
    const { sessionId } = useLocalSearchParams<{ sessionId: string }>();
    const router = useRouter();

    const [session, setSession] = useState<WorkoutSession | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [exerciseNames, setExerciseNames] = useState<Record<string, string>>(
        {}
    );

    /* ── load session + exercise names ───────────────────────── */
    useEffect(() => {
        if (!sessionId) return;
        let cancelled = false;

        const load = async () => {
            setIsLoading(true);
            try {
                const data = await getWorkoutSessionById(sessionId);
                if (cancelled) return;

                setSession(data);

                if (data) {
                    const uniqueIds = [
                        ...new Set(data.logs.map((l) => l.exerciseId)),
                    ];
                    const resolved = await Promise.all(
                        uniqueIds.map(async (id) => {
                            try {
                                const ex = await getExerciseById(id);
                                return [id, ex?.name ?? id] as const;
                            } catch {
                                return [id, id] as const;
                            }
                        })
                    );
                    if (!cancelled) {
                        setExerciseNames(Object.fromEntries(resolved));
                    }
                }
            } catch (error) {
                console.error('Failed to load session:', error);
            } finally {
                if (!cancelled) setIsLoading(false);
            }
        };

        load();
        return () => {
            cancelled = true;
        };
    }, [sessionId]);

    /* ═══════════════════ LOADING STATE ═══════════════════════ */
    if (isLoading) {
        return (
            <SafeAreaView className="flex-1 bg-[#1A1A1A] justify-center items-center">
                <ActivityIndicator size="large" color="#FF6000" />
                <Text className="text-[#8E8E93] text-sm mt-3">
                    Loading session...
                </Text>
            </SafeAreaView>
        );
    }

    /* ═══════════════════ NOT FOUND STATE ═════════════════════ */
    if (!session) {
        return (
            <SafeAreaView className="flex-1 bg-[#1A1A1A] justify-center items-center px-6">
                <Ionicons name="alert-circle-outline" size={64} color="#3A3A3C" />
                <Text className="text-white text-xl font-bold mt-4 text-center">
                    Session not found
                </Text>
                <Pressable
                    onPress={() => router.back()}
                    className="mt-6 bg-[#FF6000] rounded-full px-8 py-3 active:opacity-80"
                >
                    <Text className="text-white font-bold text-base">Go Back</Text>
                </Pressable>
            </SafeAreaView>
        );
    }

    /* ═══════════════════ SESSION DETAIL ══════════════════════ */
    return (
        <SafeAreaView className="flex-1 bg-[#1A1A1A]">
            {/* ── SECTION 1 — HEADER ────────────────────────── */}
            <View className="flex-row items-center justify-between px-4 py-3">
                <Pressable
                    onPress={() => router.back()}
                    className="w-10 h-10 items-center justify-center rounded-full bg-[#242424] active:opacity-70"
                >
                    <Ionicons name="chevron-back" size={22} color="#FFFFFF" />
                </Pressable>

                <Text
                    className="text-white text-lg font-bold flex-1 text-center mx-3"
                    numberOfLines={1}
                >
                    {session.name}
                </Text>

                {/* Empty view for balance */}
                <View className="w-10 h-10" />
            </View>

            <ScrollView
                className="flex-1"
                contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 32 }}
                showsVerticalScrollIndicator={false}
            >
                {/* ── SECTION 2 — SESSION STATS CARD ────────── */}
                <View className="bg-[#242424] rounded-2xl p-5 mb-4">
                    {/* Date + duration row */}
                    <View className="flex-row items-center justify-between mb-4">
                        <View className="flex-row items-center gap-1.5">
                            <Ionicons
                                name="calendar-outline"
                                size={14}
                                color="#8E8E93"
                            />
                            <Text className="text-[#8E8E93] text-sm">
                                {formatDateLong(session.startTime)}
                            </Text>
                        </View>
                        <View className="flex-row items-center gap-1.5">
                            <Ionicons
                                name="time-outline"
                                size={14}
                                color="#8E8E93"
                            />
                            <Text className="text-[#8E8E93] text-sm">
                                {formatDuration(session.startTime, session.endTime)}
                            </Text>
                        </View>
                    </View>

                    {/* Stats row */}
                    <View className="flex-row">
                        <StatBox
                            icon="barbell-outline"
                            label="Total Volume"
                            value={`${formatVolume(session.volumeKg)} kg`}
                        />
                        <View className="w-px bg-[#3A3A3C]" />
                        <StatBox
                            icon="speedometer-outline"
                            label="Avg RPE"
                            value={
                                session.averageRPE !== null
                                    ? String(session.averageRPE)
                                    : '-'
                            }
                        />
                        <View className="w-px bg-[#3A3A3C]" />
                        <StatBox
                            icon="layers-outline"
                            label="Total Sets"
                            value={String(countTotalSets(session))}
                        />
                    </View>
                </View>

                {/* ── SECTION 3 — EXERCISE LIST ─────────────── */}
                {session.logs.map((log) => (
                    <View
                        key={log.id}
                        className="bg-[#242424] rounded-2xl p-4 mb-3"
                    >
                        {/* Exercise name */}
                        <Text className="text-[#FF6000] font-bold text-base mb-3">
                            {exerciseNames[log.exerciseId] ?? log.exerciseId}
                        </Text>

                        {/* Set table header */}
                        <View className="flex-row mb-1.5 px-1">
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
                            const isHot = (s.rpe ?? 0) > 8.5;
                            return (
                                <View
                                    key={s.id}
                                    className={`flex-row items-center py-2 px-1 ${isHot
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
                                        className={`flex-1 text-center text-sm font-semibold ${getRpeTextClass(
                                            s.rpe
                                        )}`}
                                    >
                                        {s.rpe ?? '-'}
                                    </Text>
                                </View>
                            );
                        })}

                        {/* Notes if any */}
                        {log.notes && (
                            <View className="mt-3 pt-2 border-t border-[#3A3A3C] flex-row items-start gap-2">
                                <Ionicons
                                    name="document-text-outline"
                                    size={14}
                                    color="#8E8E93"
                                    style={{ marginTop: 2 }}
                                />
                                <Text className="text-[#8E8E93] text-sm flex-1">
                                    {log.notes}
                                </Text>
                            </View>
                        )}
                    </View>
                ))}
            </ScrollView>
        </SafeAreaView>
    );
}
