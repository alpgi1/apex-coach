import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import SpiderChart from '../../src/components/charts/SpiderChart';
import AnimatedBackground from '../../src/components/layout/AnimatedBackground';
import { computeMuscleGroupSplit } from '../../src/services/analytics/computeAnalytics';
import { getAllExercises } from '../../src/services/storage/exerciseStorage';
import { getWorkoutHistory } from '../../src/services/storage/workoutStorage';
import { ExerciseMetadata } from '../../src/types/exercise.types';
import { WorkoutSession } from '../../src/types/workout.types';
import { formatVolume } from '../../src/utils/formatters';

const GROUP_ICON: Record<string, string> = {
    Chest: 'radio-button-on',
    Back: 'layers',
    Shoulders: 'triangle',
    Arms: 'barbell',
    Legs: 'walk',
    Core: 'disc',
};

export default function MuscleSplitScreen() {
    const router = useRouter();
    const [history, setHistory] = useState<WorkoutSession[]>([]);
    const [exerciseMap, setExerciseMap] = useState<Map<string, ExerciseMetadata>>(new Map());
    const [isLoading, setIsLoading] = useState(true);

    useFocusEffect(
        useCallback(() => {
            let cancelled = false;
            Promise.all([getWorkoutHistory(), getAllExercises()]).then(([sessions, exercises]) => {
                if (!cancelled) {
                    setHistory(sessions);
                    setExerciseMap(new Map(exercises.map((e) => [e.id, e])));
                    setIsLoading(false);
                }
            });
            return () => { cancelled = true; };
        }, [])
    );

    const muscleGroupSplit = useMemo(
        () => computeMuscleGroupSplit(history, exerciseMap),
        [history, exerciseMap]
    );

    const ranked = useMemo(() => {
        const total = muscleGroupSplit.reduce((acc, g) => acc + g.value, 0);
        return [...muscleGroupSplit]
            .sort((a, b) => b.value - a.value)
            .map((g) => ({ ...g, pct: total > 0 ? Math.round((g.value / total) * 100) : 0 }));
    }, [muscleGroupSplit]);

    const totalVolume = ranked.reduce((acc, g) => acc + g.value, 0);

    return (
        <View style={{ flex: 1, backgroundColor: '#0A0A0A' }}>
            <AnimatedBackground />
            <SafeAreaView style={{ flex: 1 }}>
                <View className="flex-row items-center px-4 pt-3 pb-4">
                    <Pressable
                        onPress={() => router.back()}
                        className="w-10 h-10 items-center justify-center rounded-full bg-white/[0.08] active:opacity-70 mr-3"
                    >
                        <Ionicons name="chevron-back" size={20} color="#FFFFFF" />
                    </Pressable>
                    <Text className="text-white text-xl font-outfit-bold">Muscle Split</Text>
                </View>

                <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
                    <View className="px-4">
                        <Text className="text-[#8E8E93] text-sm mb-4">
                            Volume distribution across muscle groups (all time)
                        </Text>
                        {isLoading ? (
                            <ActivityIndicator color="#FF6000" />
                        ) : (
                            <>
                                <View className="rounded-2xl border border-white/10 bg-white/[0.07] p-4 items-center mb-4">
                                    <SpiderChart data={muscleGroupSplit} />
                                </View>

                                {/* Ranked breakdown */}
                                <Text className="text-[#8E8E93] text-xs font-outfit-semibold uppercase tracking-wider mb-3 px-1">
                                    Breakdown
                                </Text>
                                <View className="rounded-2xl border border-white/10 bg-white/[0.04] overflow-hidden">
                                    {ranked.map((g, idx) => (
                                        <View
                                            key={g.group}
                                            className={`px-4 py-3.5 ${idx < ranked.length - 1 ? 'border-b border-white/[0.06]' : ''}`}
                                        >
                                            <View className="flex-row items-center justify-between mb-2">
                                                <View className="flex-row items-center gap-2">
                                                    {idx === 0 && totalVolume > 0 && (
                                                        <View className="bg-[#FF6000]/15 rounded-full px-2 py-0.5 mr-1">
                                                            <Text className="text-[#FF6000] text-[10px] font-outfit-semibold">TOP</Text>
                                                        </View>
                                                    )}
                                                    <Text className="text-white font-outfit-semibold text-sm">{g.label}</Text>
                                                </View>
                                                <View className="flex-row items-center gap-2">
                                                    <Text className="text-[#8E8E93] text-xs">{formatVolume(g.value)} kg</Text>
                                                    <Text className="text-[#FF6000] text-xs font-outfit-semibold w-9 text-right">{g.pct}%</Text>
                                                </View>
                                            </View>
                                            {/* Progress bar */}
                                            <View className="h-1.5 rounded-full bg-white/[0.08]">
                                                <View
                                                    style={{ width: `${g.pct}%`, backgroundColor: idx === 0 ? '#FF6000' : '#FF6000' + (idx === 1 ? 'CC' : idx === 2 ? '99' : '55') }}
                                                    className="h-1.5 rounded-full"
                                                />
                                            </View>
                                        </View>
                                    ))}
                                </View>
                            </>
                        )}
                    </View>
                </ScrollView>
            </SafeAreaView>
        </View>
    );
}
