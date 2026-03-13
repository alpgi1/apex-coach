import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import '../global.css';
import { initializeDatabase } from '../src/services/storage/database';
import { seedExercises } from '../src/services/storage/exerciseStorage';

export default function RootLayout() {
  const [isDbInitialized, setIsDbInitialized] = useState<boolean>(false);

  useEffect(() => {
    const setupDatabase = async () => {
      try {
        initializeDatabase();
        await seedExercises();
      } catch (error) {
        console.error('Failed to initialize or seed the database:', error);
      } finally {
        setIsDbInitialized(true);
      }
    };

    setupDatabase();
  }, []);

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
    </View>
  );
}
