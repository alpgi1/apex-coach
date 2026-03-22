import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import AnimatedBackground from '../../src/components/layout/AnimatedBackground';

import StartWorkoutModal from '../../src/components/workout/StartWorkoutModal';
import { useWorkoutSession } from '../../src/hooks/useWorkoutSession';
import { computeInsights, Insight } from '../../src/services/analytics/computeInsights';
import { getAllExercises } from '../../src/services/storage/exerciseStorage';
import { getWorkoutHistory } from '../../src/services/storage/workoutStorage';
import { useUserStore } from '../../src/store/userStore';
import { ExerciseMetadata } from '../../src/types/exercise.types';
import { WorkoutSession, WorkoutTemplate } from '../../src/types/workout.types';

/* ────────────────────── week calendar helpers ────────────────────── */

const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const getWeekDays = (): Date[] => {
  const now = new Date();
  const dayOfWeek = now.getDay(); // 0=Sun, 1=Mon...
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate() + mondayOffset);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
};

const isSameDay = (a: Date, b: Date): boolean =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

const isToday = (d: Date): boolean => isSameDay(d, new Date());

const hasWorkoutOnDate = (date: Date, sessions: WorkoutSession[]): boolean =>
  sessions.some((s) => isSameDay(new Date(s.startTime), date));

/* ──────────────────────── main screen ────────────────────────────── */

export default function DashboardScreen() {
  const router = useRouter();
  const { name } = useUserStore();
  const { startWorkout, addExercise, addEmptySets } = useWorkoutSession();

  const { targetRIR } = useUserStore();
  const [isStartModalVisible, setIsStartModalVisible] = useState<boolean>(false);
  const [history, setHistory] = useState<WorkoutSession[]>([]);
  const [insights, setInsights] = useState<Insight[]>([]);
  const [dismissedInsights, setDismissedInsights] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState<boolean>(true);

  /* ── start button pulse ────────────────────────────── */
  const pulseScale = useSharedValue(1);
  useEffect(() => {
    pulseScale.value = withRepeat(
      withSequence(
        withTiming(1.025, { duration: 1200 }),
        withTiming(1, { duration: 1200 }),
      ),
      -1, // infinite
      true, // reverse — creates seamless back-and-forth
    );
  }, []);
  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }));

  useFocusEffect(
    useCallback(() => {
      const loadHistory = async () => {
        try {
          setIsLoading(true);
          const [data, exercises] = await Promise.all([
            getWorkoutHistory(),
            getAllExercises(),
          ]);
          setHistory(data);

          // Compute training insights
          const exerciseMap = new Map<string, ExerciseMetadata>();
          for (const ex of exercises) exerciseMap.set(ex.id, ex);
          const targetRpe = 10 - targetRIR;
          setInsights(computeInsights(data, exerciseMap, targetRpe));
        } catch (error) {
          console.error('Failed to load workout history:', error);
        } finally {
          setIsLoading(false);
        }
      };
      loadHistory();
    }, [])
  );

  const handleWorkoutStart = async (workoutName: string, template?: WorkoutTemplate) => {
    startWorkout(workoutName);
    if (template) {
      for (const te of template.exercises) {
        const logId = addExercise(te.exerciseId);
        addEmptySets(logId, te.targetSets);
      }
    }
    router.push('/(tabs)/workout');
  };

  const lastWorkout = history.length > 0 ? history[0] : null;
  const recentSessions = history.slice(0, 3);
  const weekDays = useMemo(() => getWeekDays(), []);
  const now = useMemo(() => new Date(), []);

  const getRpeColor = (rpe: number | null): string => {
    if (!rpe) return 'bg-gray-500';
    if (rpe <= 7) return 'bg-[#34C759]';
    if (rpe <= 8.5) return 'bg-[#FFD60A]';
    return 'bg-[#FF3131]';
  };

  const formatDate = (isoString: string): string => {
    const date = new Date(isoString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const calculateDuration = (start: string, end: string | null): string => {
    if (!end) return 'Active';
    const diffMs = new Date(end).getTime() - new Date(start).getTime();
    return `${Math.round(diffMs / 60000)}m`;
  };

  if (isLoading) {
    return (
      <View style={styles.root}>
        <AnimatedBackground />
        <SafeAreaView className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#FF6000" />
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      {/* ── BACKGROUND MESH ─────────────────────────────── */}
      <AnimatedBackground />

      {/* ── CONTENT ─────────────────────────────────────── */}
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView
          className="flex-1 px-4"
          contentContainerStyle={{ paddingBottom: 110 }}
          showsVerticalScrollIndicator={false}
        >
          {/* SECTION 1 — HEADER */}
          <View className="flex-row justify-between items-center mt-6 mb-8">
            <View>
              <Text style={styles.welcomeLabel}>Welcome back</Text>
              <Text className="text-white text-3xl font-outfit-bold">
                {name || 'Lifter'}
              </Text>
            </View>
            <View style={{ width: 40 }} />
          </View>

          {/* SECTION 1.5 — WEEKLY CALENDAR */}
          <View style={styles.weekCard} className="flex-row justify-between px-3 py-3 mb-4">
            {weekDays.map((day, idx) => {
              const today = isToday(day);
              const worked = hasWorkoutOnDate(day, history);
              const isPast = day < now && !today;
              return (
                <View key={idx} className="items-center flex-1">
                  <Text className={`text-[10px] font-outfit-semibold mb-1 ${today ? 'text-[#FF6000]' : isPast ? 'text-white/35' : 'text-white/50'}`}>
                    {DAY_NAMES[idx]}
                  </Text>
                  {today ? (
                    <View style={styles.todayCircle}>
                      <Text className="text-white text-sm font-outfit-bold">{day.getDate()}</Text>
                    </View>
                  ) : (
                    <Text className={`text-sm font-outfit-semibold ${isPast ? 'text-white/35' : 'text-white/50'}`}>
                      {day.getDate()}
                    </Text>
                  )}
                  {worked ? (
                    <View style={styles.workoutDot} />
                  ) : (
                    <View style={{ width: 6, height: 6, marginTop: 4 }} />
                  )}
                </View>
              );
            })}
          </View>

          {/* SECTION 2 — HERO CARD */}
          <View style={styles.card} className="p-4 w-full mb-6">
            <View className="self-start flex-row items-center bg-[#FF6000]/20 border border-[#FF6000]/40 rounded-full px-2 py-1 mb-3">
              <View style={{
                width: 6, height: 6, borderRadius: 3,
                backgroundColor: '#FF6000', marginRight: 6
              }} />
              <Text className="text-[#FF6000] text-[10px] font-outfit-bold tracking-widest uppercase">
                Last Workout
              </Text>
            </View>

            {lastWorkout ? (
              <>
                <Text className="text-white text-2xl font-outfit-bold mb-1">
                  {lastWorkout.name}
                </Text>
                <Text style={styles.mutedText} className="text-sm mb-4">
                  {formatDate(lastWorkout.startTime)} • Duration:{' '}
                  {calculateDuration(lastWorkout.startTime, lastWorkout.endTime)}
                </Text>

                <View style={styles.divider} className="w-full mb-4" />

                <View className="flex-row justify-between pr-4">
                  <View>
                    <Text style={{color:'#FF6000'}} className=" text-xl font-outfit-bold">
                      {lastWorkout.volumeKg.toLocaleString()}
                    </Text>
                    <Text style={styles.statLabel}>Total Volume</Text>
                  </View>
                  <View>
                    <Text style={{color:'#FF6000'}} className="text-xl font-outfit-bold">
                      {lastWorkout.averageRPE?.toFixed(1) || '-'}
                    </Text>
                    <Text style={styles.statLabel}>Avg RPE</Text>
                  </View>
                  <View>
                    <Text style={{color:'#FF6000'}} className="text-xl font-outfit-bold">
                      {lastWorkout.logs.reduce((total, log) => total + log.sets.length, 0)}
                    </Text>
                    <Text style={styles.statLabel}>Sets</Text>
                  </View>
                </View>
              </>
            ) : (
              <Text style={styles.mutedText} className="py-4 text-center">
                No workouts yet. Stop reading, start lifting.
              </Text>
            )}
          </View>

          {/* SECTION 3 — START WORKOUT BUTTON */}
          <Animated.View style={[styles.startButton, pulseStyle]}>
            <Pressable
              onPress={() => setIsStartModalVisible(true)}
              style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%' }}
            >
              <Ionicons name="play" size={18} color="white" style={{ marginRight: 8 }} />
              <Text className="text-white font-outfit-bold text-lg">Start Workout</Text>
            </Pressable>
          </Animated.View>

          {/* SECTION 3.5 — TRAINING INSIGHTS */}
          {insights.filter((i) => !dismissedInsights.has(i.id)).length > 0 && (
            <View className="mb-6">
              <Text className="text-white text-base font-outfit-bold mb-2 ml-1">
                Training Intelligence
              </Text>
              {insights
                .filter((i) => !dismissedInsights.has(i.id))
                .map((insight) => {
                  const color =
                    insight.severity === 'warning' ? '#FF453A'
                      : insight.severity === 'success' ? '#FFB800'
                      : '#4A9EFF';
                  return (
                    <View key={insight.id} style={[
                      styles.insightCard,
                      insight.severity === 'warning' ? styles.insight_warning
                        : insight.severity === 'success' ? styles.insight_success
                        : styles.insight_info,
                    ]}>
                      <View style={[styles.insightIconWrap, { backgroundColor: `${color}15` }]}>
                        <Ionicons name={insight.icon as any} size={18} color={color} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.insightTitle, { color }]}>
                          {insight.title}
                        </Text>
                        <Text style={styles.insightMessage}>
                          {insight.message}
                        </Text>
                      </View>
                      <Pressable
                        onPress={() => setDismissedInsights((prev) => new Set(prev).add(insight.id))}
                        hitSlop={8}
                        style={styles.insightDismiss}
                      >
                        <Ionicons name="close" size={14} color="rgba(255,255,255,0.35)" />
                      </Pressable>
                    </View>
                  );
                })}
            </View>
          )}

          {/* SECTION 4 — RECENT SESSIONS */}
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-white text-xl font-outfit-bold">Recent Sessions</Text>
            <TouchableOpacity onPress={() => router.push('/analyse')}>
              <Text className="text-[#FF6000] font-outfit-semibold">View All</Text>
            </TouchableOpacity>
          </View>

          {recentSessions.length > 0 ? (
            recentSessions.map((session) => (
              <TouchableOpacity
                key={session.id}
                onPress={() => router.push(`/workout/${session.id}`)}
                style={styles.sessionCard}
                className="p-4 mb-3 flex-row items-center justify-between"
              >
                <View className="flex-row items-center">
                  <View style={styles.sessionIcon} className="mr-4">
                    <Ionicons name="barbell" size={22} color="#FF6000" />
                  </View>
                  <View>
                    <Text className="text-white font-outfit-semibold text-base mb-1">
                      {session.name}
                    </Text>
                    <Text style={styles.mutedText} className="text-xs">
                      {formatDate(session.startTime)} •{' '}
                      {calculateDuration(session.startTime, session.endTime)}
                    </Text>
                  </View>
                </View>

                <View className="flex-row items-center">
                  {session.averageRPE && (
                    <View className={`px-2 py-1 rounded-full mr-3 ${getRpeColor(session.averageRPE)}`}>
                      <Text className="text-[#1A1A1A] text-[10px] font-outfit-bold">
                        RPE {session.averageRPE.toFixed(1)}
                      </Text>
                    </View>
                  )}
                  <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.4)" />
                </View>
              </TouchableOpacity>
            ))
          ) : (
            <Text style={styles.mutedText} className="text-center mt-4">
              Complete a workout to see history.
            </Text>
          )}
        </ScrollView>
      </SafeAreaView>

      <StartWorkoutModal
        isVisible={isStartModalVisible}
        onClose={() => setIsStartModalVisible(false)}
        onStart={handleWorkoutStart}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#0A0A0A',
  },
  welcomeLabel: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    backgroundColor: 'rgba(255,255,255,0.09)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    borderRadius: 20,
    borderTopColor: 'rgba(255,96,0,0.5)',
    borderTopWidth: 1,
    borderLeftColor: 'rgba(255,255,255,0.12)',
    borderRightColor: 'rgba(255,255,255,0.12)',
    borderBottomColor: 'rgba(255,255,255,0.12)',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  mutedText: {
    color: 'rgba(255,255,255,0.5)',
  },
  statLabel: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
    marginTop: 4,
    letterSpacing: 0.5,
  },
  startButton: {
    width: '100%',
    backgroundColor: '#FF6000',
    height: 56,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    marginBottom: 40,
    shadowColor: '#FF6000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 20,
    elevation: 12,
  },
  sessionCard: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 20,
  },
  sessionIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,96,0,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  weekCard: {
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 16,
  },
  todayCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FF6000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  workoutDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FF6000',
    marginTop: 4,
  },
  insightCard: {
    flexDirection: 'row' as const,
    alignItems: 'flex-start' as const,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 8,
  },
  insight_warning: {
    backgroundColor: 'rgba(255,69,58,0.08)',
    borderColor: 'rgba(255,69,58,0.2)',
  },
  insight_success: {
    backgroundColor: 'rgba(255,184,0,0.08)',
    borderColor: 'rgba(255,184,0,0.2)',
  },
  insight_info: {
    backgroundColor: 'rgba(74,158,255,0.08)',
    borderColor: 'rgba(74,158,255,0.2)',
  },
  insightDismiss: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginLeft: 8,
  },
  insightIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginRight: 12,
    marginTop: 2,
  },
  insightTitle: {
    fontSize: 13,
    fontWeight: '700' as const,
    marginBottom: 3,
  },
  insightMessage: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.6)',
    lineHeight: 17,
  },
});
