import * as Notifications from 'expo-notifications';
import * as SplashScreen from 'expo-splash-screen';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { ensureWorkoutReminderArmed } from '../src/services/notifications/workoutReminder';
import { getWorkoutHistory } from '../src/services/storage/workoutStorage';
import AppSplashScreen from '../src/components/layout/AppSplashScreen';

SplashScreen.preventAutoHideAsync();

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});
import '../global.css';
import { initializeDatabase } from '../src/services/storage/database';
import { seedExercises } from '../src/services/storage/exerciseStorage';
import { runInstructionsMigration } from '../src/services/storage/instructionsMigration';
import { syncExercisesFromBackend } from '../src/services/api/exerciseApi';
import { fetchWorkouts } from '../src/services/api/workoutApi';
import { fetchTemplates } from '../src/services/api/templateApi';
import { deduplicateWorkouts, upsertWorkoutsFromBackend } from '../src/services/storage/workoutStorage';
import { fetchBodyWeights } from '../src/services/api/weightApi';
import { upsertWeightLogsFromBackend } from '../src/services/storage/weightStorage';
import { upsertTemplatesFromBackend } from '../src/services/storage/templateStorage';
import { fetchAllRecords } from '../src/services/api/recordsApi';
import { upsertPersonalRecord } from '../src/services/storage/exerciseStorage';
import OnboardingModal from '../src/components/layout/OnboardingModal';
import { useUserStore } from '../src/store/userStore';
import { useAuthStore } from '../src/store/authStore';
import {
  useFonts,
  Outfit_300Light,
  Outfit_400Regular,
  Outfit_500Medium,
  Outfit_600SemiBold,
  Outfit_700Bold,
} from '@expo-google-fonts/outfit';

// Apply Outfit as the default font for all Text components
(Text as any).defaultProps = (Text as any).defaultProps ?? {};
(Text as any).defaultProps.style = [{ fontFamily: 'Outfit_400Regular' }];

export default function RootLayout() {
  const router = useRouter();
  const { name, setName } = useUserStore();
  const { session, isInitialized, initialize } = useAuthStore();
  const [isDbInitialized, setIsDbInitialized] = useState<boolean>(false);
  const [showOnboarding, setShowOnboarding] = useState<boolean>(false);

  const [fontsLoaded] = useFonts({
    Outfit_300Light,
    Outfit_400Regular,
    Outfit_500Medium,
    Outfit_600SemiBold,
    Outfit_700Bold,
  });

  useEffect(() => {
    Notifications.requestPermissionsAsync();
  }, []);

  useEffect(() => {
    const setupDatabase = async () => {
      try {
        initializeDatabase();
        await seedExercises();
        // Fetch instructions from free-exercise-db in the background (one-time)
        runInstructionsMigration().catch(() => {});
        await initialize();
        if (!name || name.trim().length === 0) {
          setShowOnboarding(true);
        }
        // Re-arm workout reminder if no pending notification exists
        getWorkoutHistory().then((sessions) => {
          const last = sessions[0]?.startTime ?? null;
          ensureWorkoutReminderArmed(last).catch(() => {});
        }).catch(() => {});
      } catch (error) {
        console.error('Failed to initialize or seed the database:', error);
      } finally {
        setIsDbInitialized(true);
      }
    };

    setupDatabase();
  }, []);

  // Navigate based on auth state
  useEffect(() => {
    if (!isInitialized || !isDbInitialized) return;
    if (session) {
      router.replace('/(tabs)' as any);
    } else {
      router.replace('/(auth)/login' as any);
    }
  }, [session, isInitialized, isDbInitialized]);

  // Sync chain when user logs in: exercises → workouts + templates + records
  useEffect(() => {
    if (session?.access_token) {
      // Clean up any existing duplicates before syncing
      deduplicateWorkouts().catch(console.error);

      syncExercisesFromBackend(session.access_token)
        .then(() => Promise.all([
          fetchWorkouts(0, 500).then((res) => {
            if (res?.data?.content) return upsertWorkoutsFromBackend(res.data.content);
          }),
          fetchTemplates().then((res) => {
            if (res?.data) return upsertTemplatesFromBackend(res.data);
          }),
          fetchBodyWeights().then((res) => {
            if (res?.data) return upsertWeightLogsFromBackend(res.data);
          }),
          fetchAllRecords().then((res) => {
            if (!res?.data) return;
            return Promise.all(res.data.map((r) =>
              upsertPersonalRecord({
                exerciseId: r.exerciseId,
                estimatedOneRepMax: r.estimated1rm,
                maxWeightKg: r.maxWeightKg,
                repsAtMaxWeight: r.repsAtMaxWeight,
                maxReps: r.repsAtMaxWeight,
                weightAtMaxRepsKg: r.maxWeightKg,
                maxSessionVolumeKg: 0,
                dateAchieved: new Date().toISOString(),
              })
            ));
          }),
        ]))
        .catch(console.error);
    }
  }, [session?.user?.id]);

  const handleOnboardingComplete = (userName: string) => {
    setName(userName);
    setShowOnboarding(false);
  };

  const isReady = isDbInitialized && isInitialized && fontsLoaded;

  useEffect(() => {
    if (isReady) SplashScreen.hideAsync();
  }, [isReady]);

  if (!fontsLoaded) return null;

  return (
    <View style={{ flex: 1, backgroundColor: '#1A1A1A' }}>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: '#1A1A1A' },
        }}
      />
      <OnboardingModal
        isVisible={showOnboarding}
        onComplete={handleOnboardingComplete}
      />
      {!isReady && (
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
          <AppSplashScreen />
        </View>
      )}
    </View>
  );
}
