import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import VolumeBarChart from '../../src/components/charts/VolumeBarChart';
import AnimatedBackground from '../../src/components/layout/AnimatedBackground';
import { computeWeeklyVolume } from '../../src/services/analytics/computeAnalytics';
import { getWorkoutHistory } from '../../src/services/storage/workoutStorage';
import { WorkoutSession } from '../../src/types/workout.types';

export default function VolumeScreen() {
    const router = useRouter();
    const [history, setHistory] = useState<WorkoutSession[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useFocusEffect(
        useCallback(() => {
            let cancelled = false;
            getWorkoutHistory().then((data) => {
                if (!cancelled) { setHistory(data); setIsLoading(false); }
            });
            return () => { cancelled = true; };
        }, [])
    );

    const weeklyVolume = useMemo(() => computeWeeklyVolume(history, 8), [history]);

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
                    <Text className="text-white text-xl font-outfit-bold">Volume Trend</Text>
                </View>

                <View className="px-4">
                    <Text className="text-[#8E8E93] text-sm mb-4">
                        Weekly total volume (kg) over the last 8 weeks
                    </Text>
                    {isLoading ? (
                        <ActivityIndicator color="#FF6000" />
                    ) : (
                        <View className="rounded-2xl border border-white/10 bg-white/[0.07] p-4">
                            <VolumeBarChart data={weeklyVolume} />
                        </View>
                    )}
                </View>
            </SafeAreaView>
        </View>
    );
}
