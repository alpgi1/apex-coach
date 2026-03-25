import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import SpiderChart from '../../src/components/charts/SpiderChart';
import AnimatedBackground from '../../src/components/layout/AnimatedBackground';
import { computeMuscleGroupSplit } from '../../src/services/analytics/computeAnalytics';
import { getAllExercises } from '../../src/services/storage/exerciseStorage';
import { getWorkoutHistory } from '../../src/services/storage/workoutStorage';
import { ExerciseMetadata } from '../../src/types/exercise.types';
import { WorkoutSession } from '../../src/types/workout.types';

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

                <View className="px-4">
                    <Text className="text-[#8E8E93] text-sm mb-4">
                        Volume distribution across muscle groups (all time)
                    </Text>
                    {isLoading ? (
                        <ActivityIndicator color="#FF6000" />
                    ) : (
                        <View className="rounded-2xl border border-white/10 bg-white/[0.07] p-4 items-center">
                            <SpiderChart data={muscleGroupSplit} />
                        </View>
                    )}
                </View>
            </SafeAreaView>
        </View>
    );
}
