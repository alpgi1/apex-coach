import { Stack } from 'expo-router';

export default function FeaturedPlanLayout() {
    return (
        <Stack
            screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: '#0A0A0A' },
            }}
        />
    );
}
