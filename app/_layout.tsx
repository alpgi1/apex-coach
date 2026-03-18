import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import '../global.css';
import { initializeDatabase } from '../src/services/storage/database';
import { seedExercises } from '../src/services/storage/exerciseStorage';
import OnboardingModal from '../src/components/layout/OnboardingModal';
import { useUserStore } from '../src/store/userStore';
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
  const { name, setName } = useUserStore();
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

  if (!isDbInitialized || !fontsLoaded) {
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
