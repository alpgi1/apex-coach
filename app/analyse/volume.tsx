import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import VolumeBarChart from '../../src/components/charts/VolumeBarChart';
import AnimatedBackground from '../../src/components/layout/AnimatedBackground';
import { computeWeeklyVolume } from '../../src/services/analytics/computeAnalytics';
import { getWorkoutHistory } from '../../src/services/storage/workoutStorage';
import { WorkoutSession } from '../../src/types/workout.types';
import { formatVolume } from '../../src/utils/formatters';

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

    const stats = useMemo(() => {
        const nonZero = weeklyVolume.filter((w) => w.value > 0);
        const thisWeek = weeklyVolume[weeklyVolume.length - 1]?.value ?? 0;
        const prevWeek = weeklyVolume[weeklyVolume.length - 2]?.value ?? 0;
        const bestWeek = Math.max(...weeklyVolume.map((w) => w.value), 0);
        const total8w = weeklyVolume.reduce((acc, w) => acc + w.value, 0);
        const avg = nonZero.length > 0 ? Math.round(total8w / nonZero.length) : 0;
        const change = prevWeek > 0 ? Math.round(((thisWeek - prevWeek) / prevWeek) * 100) : null;
        return { thisWeek, bestWeek, total8w, avg, change };
    }, [weeklyVolume]);

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

                <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
                    <View className="px-4">
                        <Text className="text-[#8E8E93] text-sm mb-4">
                            Weekly total volume (kg) over the last 8 weeks
                        </Text>
                        {isLoading ? (
                            <ActivityIndicator color="#FF6000" />
                        ) : (
                            <>
                                <View className="rounded-2xl border border-white/10 bg-white/[0.07] p-4 mb-4">
                                    <VolumeBarChart data={weeklyVolume} />
                                </View>

                                {/* Stats grid */}
                                <View className="flex-row gap-3 mb-3">
                                    <View className="flex-1 rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                                        <Text className="text-[#8E8E93] text-xs font-outfit-semibold uppercase tracking-wider mb-1">This Week</Text>
                                        <Text className="text-white text-xl font-outfit-bold">
                                            {formatVolume(stats.thisWeek)}
                                            <Text className="text-[#8E8E93] text-sm font-outfit"> kg</Text>
                                        </Text>
                                        {stats.change !== null && (
                                            <View className="flex-row items-center mt-1 gap-1">
                                                <Ionicons
                                                    name={stats.change >= 0 ? 'trending-up' : 'trending-down'}
                                                    size={12}
                                                    color={stats.change >= 0 ? '#30D158' : '#FF453A'}
                                                />
                                                <Text className={`text-xs font-outfit-semibold ${stats.change >= 0 ? 'text-[#30D158]' : 'text-[#FF453A]'}`}>
                                                    {stats.change >= 0 ? '+' : ''}{stats.change}% vs last week
                                                </Text>
                                            </View>
                                        )}
                                    </View>
                                    <View className="flex-1 rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                                        <Text className="text-[#8E8E93] text-xs font-outfit-semibold uppercase tracking-wider mb-1">Best Week</Text>
                                        <Text className="text-white text-xl font-outfit-bold">
                                            {formatVolume(stats.bestWeek)}
                                            <Text className="text-[#8E8E93] text-sm font-outfit"> kg</Text>
                                        </Text>
                                        <Text className="text-[#3A3A3C] text-xs mt-1">Last 8 weeks</Text>
                                    </View>
                                </View>
                                <View className="flex-row gap-3">
                                    <View className="flex-1 rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                                        <Text className="text-[#8E8E93] text-xs font-outfit-semibold uppercase tracking-wider mb-1">8-Week Total</Text>
                                        <Text className="text-white text-xl font-outfit-bold">
                                            {formatVolume(stats.total8w)}
                                            <Text className="text-[#8E8E93] text-sm font-outfit"> kg</Text>
                                        </Text>
                                    </View>
                                    <View className="flex-1 rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                                        <Text className="text-[#8E8E93] text-xs font-outfit-semibold uppercase tracking-wider mb-1">Weekly Avg</Text>
                                        <Text className="text-white text-xl font-outfit-bold">
                                            {formatVolume(stats.avg)}
                                            <Text className="text-[#8E8E93] text-sm font-outfit"> kg</Text>
                                        </Text>
                                        <Text className="text-[#3A3A3C] text-xs mt-1">Active weeks only</Text>
                                    </View>
                                </View>
                            </>
                        )}
                    </View>
                </ScrollView>
            </SafeAreaView>
        </View>
    );
}
