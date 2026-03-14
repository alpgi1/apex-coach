import { Stack } from 'expo-router';

export default function TemplateLayout() {
    return (
        <Stack
            screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: '#1A1A1A' },
            }}
        />
    );
}
