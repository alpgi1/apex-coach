import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import '../global.css';
import { initializeDatabase } from '../src/services/storage/database';
import { seedExercises } from '../src/services/storage/exerciseStorage';
import OnboardingModal from '../src/components/layout/OnboardingModal';
import { useUserStore } from '../src/store/userStore';

export default function RootLayout() {
  const { name, setName } = useUserStore();
  const [isDbInitialized, setIsDbInitialized] = useState<boolean>(false);
  const [showOnboarding, setShowOnboarding] = useState<boolean>(false);

  useEffect(() => {
    const setupDatabase = async () => {
      try {
        initializeDatabase();
        await seedExercises();
        if (!name || name.trim().length === 0) {
          setShowOnboarding(true);
        }
      } catch (error) {
        console.error('Failed to initialize or seed the database:', error);
      } finally {
        setIsDbInitialized(true);
      }
    };

    setupDatabase();
  }, []);

  const handleOnboardingComplete = (userName: string) => {
    setName(userName);
    setShowOnboarding(false);
  };

  if (!isDbInitialized) {
    return (
      <View style={{ flex: 1, backgroundColor: '#1A1A1A', justifyContent: 'center', alignItems: 'center' }}>
        <StatusBar style="light" />
        <ActivityIndicator size="large" color="#FF8C00" />
      </View>
    );
  }

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
    </View>
  );
}
