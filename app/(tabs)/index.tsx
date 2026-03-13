import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useWorkoutSession } from '../../src/hooks/useWorkoutSession';

import { getWorkoutHistory } from '../../src/services/storage/workoutStorage';
import { useUserStore } from '../../src/store/userStore';
import { WorkoutSession } from '../../src/types/workout.types';

export default function DashboardScreen() {
  const router = useRouter();
  const { name } = useUserStore();
  const { startWorkout } = useWorkoutSession();

  // Local state for history
  const [history, setHistory] = useState<WorkoutSession[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const loadHistory = async () => {
      try {
        const data = await getWorkoutHistory();
        setHistory(data);
      } catch (error) {
        console.error("Failed to load workout history:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadHistory();
  }, []);

  const lastWorkout = history.length > 0 ? history[0] : null;
  const recentSessions = history.slice(0, 3);

  const getRpeColor = (rpe: number | null) => {
    if (!rpe) return 'bg-gray-500';
    if (rpe <= 7) return 'bg-[#34C759]'; // Green
    if (rpe <= 8.5) return 'bg-[#FFD60A]'; // Yellow
    return 'bg-[#FF3131]'; // Red
  };

  const formatDate = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const calculateDuration = (start: string, end: string | null) => {
    if (!end) return 'Active';
    const diffMs = new Date(end).getTime() - new Date(start).getTime();
    return `${Math.round(diffMs / 60000)}m`;
  };

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-[#1A1A1A] justify-center items-center">
        <ActivityIndicator size="large" color="#FF6000" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-[#1A1A1A]">
      <ScrollView className="flex-1 px-4" contentContainerStyle={{ paddingBottom: 40 }}>

        {/* SECTION 1 - HEADER */}
        <View className="flex-row justify-between items-center mt-6 mb-8">
          <View>
            <Text className="text-[#8E8E93] text-sm font-medium mb-1">Welcome back</Text>
            <Text className="text-white text-3xl font-bold">Good morning, {name || 'Lifter'}</Text>
          </View>
          <TouchableOpacity className="h-10 w-10 bg-[#242424] rounded-full items-center justify-center">
            <Ionicons name="settings-outline" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* SECTION 2 - HERO CARD */}
        <View className="bg-[#242424] rounded-2xl p-4 w-full mb-6">
          <View className="self-start bg-[#FF6000]/20 rounded-full px-2 py-1 mb-3">
            <Text className="text-[#FF6000] text-[10px] font-bold tracking-widest uppercase">Last Workout</Text>
          </View>

          {lastWorkout ? (
            <>
              <Text className="text-white text-2xl font-bold mb-1">{lastWorkout.name}</Text>
              <Text className="text-[#8E8E93] text-sm mb-4">
                {formatDate(lastWorkout.startTime)} • Duration: {calculateDuration(lastWorkout.startTime, lastWorkout.endTime)}
              </Text>

              <View className="h-[1px] bg-[#333333] w-full mb-4" />

              <View className="flex-row justify-between pr-4">
                <View>
                  <Text className="text-white text-xl font-bold">{lastWorkout.volumeKg.toLocaleString()}</Text>
                  <Text className="text-[#8E8E93] text-[10px] font-semibold uppercase mt-1 tracking-wider">Total Volume</Text>
                </View>
                <View>
                  <Text className="text-white text-xl font-bold">{lastWorkout.averageRPE?.toFixed(1) || '-'}</Text>
                  <Text className="text-[#8E8E93] text-[10px] font-semibold uppercase mt-1 tracking-wider">Avg RPE</Text>
                </View>
                <View>
                  <Text className="text-white text-xl font-bold">
                    {lastWorkout.logs.reduce((total, log) => total + log.sets.length, 0)}
                  </Text>
                  <Text className="text-[#8E8E93] text-[10px] font-semibold uppercase mt-1 tracking-wider">Sets</Text>
                </View>
              </View>
            </>
          ) : (
            <Text className="text-[#8E8E93] py-4 text-center">No workouts yet. Stop reading, start lifting.</Text>
          )}
        </View>

        {/* SECTION 3 - START WORKOUT BUTTON */}
        <TouchableOpacity
          className="w-full bg-[#FF6000] h-14 rounded-full items-center justify-center flex-row mb-10"
          onPress={() => {
            startWorkout('My Workout');
            router.push('/(tabs)/workout');
          }}
        >
          <Ionicons name="play" size={18} color="white" style={{ marginRight: 8 }} />
          <Text className="text-white font-bold text-lg">Start Workout</Text>
        </TouchableOpacity>

        {/* SECTION 4 - RECENT SESSIONS */}
        <View className="flex-row justify-between items-center mb-4">
          <Text className="text-white text-xl font-bold">Recent Sessions</Text>
          <TouchableOpacity onPress={() => router.push('/history')}>
            <Text className="text-[#FF6000] font-semibold">View All</Text>
          </TouchableOpacity>
        </View>

        {recentSessions.length > 0 ? (
          recentSessions.map((session) => (
            <TouchableOpacity
              key={session.id}
              className="bg-[#242424] rounded-2xl p-4 mb-3 flex-row items-center justify-between"
            >
              <View className="flex-row items-center">
                <View className="h-12 w-12 rounded-full bg-[#FF6000]/10 flex items-center justify-center mr-4">
                  <Ionicons name="barbell" size={24} color="#FF6000" />
                </View>
                <View>
                  <Text className="text-white font-bold text-base mb-1">{session.name}</Text>
                  <Text className="text-[#8E8E93] text-xs">
                    {formatDate(session.startTime)} • {calculateDuration(session.startTime, session.endTime)}
                  </Text>
                </View>
              </View>

              <View className="flex-row items-center">
                {session.averageRPE && (
                  <View className={`px-2 py-1 rounded-full mr-3 ${getRpeColor(session.averageRPE)}`}>
                    <Text className="text-[#1A1A1A] text-[10px] font-bold">RPE {session.averageRPE.toFixed(1)}</Text>
                  </View>
                )}
                <Ionicons name="chevron-forward" size={20} color="#8E8E93" />
              </View>
            </TouchableOpacity>
          ))
        ) : (
          <Text className="text-[#8E8E93] text-center mt-4">Complete a workout to see history.</Text>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}
