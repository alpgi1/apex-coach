import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Pressable } from 'react-native';
import { getAllExercises } from '../src/services/storage/exerciseStorage';
import { getWorkoutHistory } from '../src/services/storage/workoutStorage';
import { MuscleGroup } from '../src/types/exercise.types';
import { calculateEpley1RM } from '../src/utils/rpeCalculator';
import { formatDateMedium } from '../src/utils/formatters';

/* ─────────────────────────── types ─────────────────────────── */

interface PRRecord {
    exerciseId: string;
    name: string;
    muscleGroup: MuscleGroup;
    best1RM: number;
    bestWeight: number;
    bestReps: number;
    totalSets: number;
    bestDate: string;
}

/* ─────────────────────────── helpers ───────────────────────── */

const formatLabel = (raw: string): string =>
    raw.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());

/* ─────────────────────────── screen ────────────────────────── */

export default function RecordsScreen() {
    const [records, setRecords] = useState<PRRecord[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const router = useRouter();

    useFocusEffect(
        useCallback(() => {
            const load = async () => {
                try {
                    setIsLoading(true);
                    const [history, exercises] = await Promise.all([
                        getWorkoutHistory(),
                        getAllExercises(),
                    ]);

                    const exerciseMap = new Map(exercises.map((e) => [e.id, e]));
                    const accum = new Map<string, PRRecord>();

                    for (const session of history) {
                        for (const log of session.logs) {
                            for (const set of log.sets) {
                                if (!set.isCompleted || set.setType !== 'WORKING') continue;
                                if (set.weightKg <= 0 || set.reps <= 0) continue;

                                const meta = exerciseMap.get(log.exerciseId);
                                if (!meta) continue;

                                const est1RM = calculateEpley1RM(set.weightKg, set.reps);
                                const existing = accum.get(log.exerciseId);

                                if (!existing) {
                                    accum.set(log.exerciseId, {
                                        exerciseId: log.exerciseId,
                                        name: meta.name,
                                        muscleGroup: meta.primaryMuscleGroup,
                                        best1RM: est1RM,
                                        bestWeight: set.weightKg,
                                        bestReps: set.reps,
                                        totalSets: 1,
                                        bestDate: session.startTime,
                                    });
                                } else {
                                    existing.totalSets += 1;
                                    if (est1RM > existing.best1RM) {
                                        existing.best1RM = est1RM;
                                        existing.bestWeight = set.weightKg;
                                        existing.bestReps = set.reps;
                                        existing.bestDate = session.startTime;
                                    }
                                }
                            }
                        }
                    }

                    const sorted = Array.from(accum.values()).sort((a, b) => b.best1RM - a.best1RM);
                    setRecords(sorted);
                } catch (err) {
                    console.error('Failed to load PRs:', err);
                } finally {
                    setIsLoading(false);
                }
            };
            load();
        }, [])
    );

    /* ══════════════════════ loading state ══════════════════════ */
    if (isLoading) {
        return (
            <SafeAreaView className="flex-1 bg-[#1A1A1A] justify-center items-center">
                <ActivityIndicator size="large" color="#FF6000" />
            </SafeAreaView>
        );
    }

    /* ═══════════════════════════ ui ════════════════════════════ */
    return (
        <SafeAreaView className="flex-1 bg-[#1A1A1A]">

            {/* ── SECTION 1 — HEADER ────────────────────────── */}
            <View className="flex-row items-center px-4 pt-3 pb-2">
                <Pressable
                    onPress={() => router.back()}
                    className="w-10 h-10 items-center justify-center rounded-full bg-[#242424] active:opacity-70 mr-3"
                >
                    <Ionicons name="chevron-back" size={22} color="#FFFFFF" />
                </Pressable>
                <Text className="text-white text-3xl font-bold">
                    Personal Records
                </Text>
            </View>

            {/* ── SECTION 2 — PR CARDS / SECTION 3 — EMPTY ─── */}
            {records.length === 0 ? (
                <View className="flex-1 justify-center items-center px-6">
                    <Ionicons name="trophy-outline" size={64} color="#3A3A3C" />
                    <Text className="text-white text-xl font-bold mt-4">No records yet</Text>
                    <Text className="text-[#8E8E93] text-sm mt-2 text-center">
                        Complete a workout to see your PRs
                    </Text>
                </View>
            ) : (
                <ScrollView
                    className="flex-1"
                    contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40 }}
                    showsVerticalScrollIndicator={false}
                >
                    {records.map((record) => (
                        <View key={record.exerciseId} className="bg-[#242424] rounded-2xl p-4 mb-3">

                            {/* Exercise name + muscle group pill */}
                            <View className="flex-row items-center justify-between mb-3">
                                <Text
                                    className="text-white font-bold text-base flex-1 mr-2"
                                    numberOfLines={1}
                                >
                                    {record.name}
                                </Text>
                                <View className="bg-[#3A3A3C] rounded-full px-2.5 py-0.5">
                                    <Text className="text-[#8E8E93] text-xs font-semibold">
                                        {formatLabel(record.muscleGroup)}
                                    </Text>
                                </View>
                            </View>

                            <View className="h-[1px] bg-[#333333] mb-3" />

                            {/* 3-stat row */}
                            <View className="flex-row justify-between">

                                {/* Est. 1RM */}
                                <View className="items-center flex-1">
                                    <View className="flex-row items-center gap-1">
                                        <Ionicons name="trophy" size={14} color="#FFD60A" />
                                        <Text className="text-[#FFD60A] text-xl font-bold">
                                            {record.best1RM.toFixed(1)}kg
                                        </Text>
                                    </View>
                                    <Text className="text-[#8E8E93] text-[10px] font-semibold uppercase tracking-wider mt-1">
                                        Est. 1RM
                                    </Text>
                                </View>

                                {/* Best Set */}
                                <View className="items-center flex-1">
                                    <Text className="text-white text-xl font-bold">
                                        {record.bestWeight}kg × {record.bestReps}
                                    </Text>
                                    <Text className="text-[#8E8E93] text-[10px] font-semibold uppercase tracking-wider mt-1">
                                        Best Set
                                    </Text>
                                </View>

                                {/* Total Sets */}
                                <View className="items-center flex-1">
                                    <Text className="text-white text-xl font-bold">
                                        {record.totalSets}
                                    </Text>
                                    <Text className="text-[#8E8E93] text-[10px] font-semibold uppercase tracking-wider mt-1">
                                        Total Sets
                                    </Text>
                                </View>

                            </View>

                            {/* Date of best */}
                            <Text className="text-[#8E8E93] text-xs mt-3">
                                Best on {formatDateMedium(record.bestDate)}
                            </Text>

                        </View>
                    ))}
                </ScrollView>
            )}

        </SafeAreaView>
    );
}
