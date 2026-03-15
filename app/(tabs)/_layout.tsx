import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { Tabs } from 'expo-router';
import { StyleSheet, View } from 'react-native';

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

interface TabIconProps {
    name: IoniconsName;
    color: string;
    size: number;
    focused: boolean;
}

function TabIcon({ name, color, size, focused }: TabIconProps) {
    return (
        <View style={focused ? styles.activeIconWrapper : undefined}>
            <Ionicons name={name} size={size} color={color} />
        </View>
    );
}

export default function TabLayout() {
    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                tabBarBackground: () => (
                    <BlurView
                        intensity={80}
                        tint="dark"
                        style={StyleSheet.absoluteFill}
                    />
                ),
                tabBarStyle: {
                    backgroundColor: 'transparent',
                    borderTopColor: 'rgba(255,255,255,0.08)',
                    borderTopWidth: 1,
                    height: 60,
                    position: 'absolute',
                },
                tabBarActiveTintColor: '#FF6000',
                tabBarInactiveTintColor: 'rgba(255,255,255,0.35)',
                tabBarLabelStyle: {
                    fontSize: 11,
                    marginBottom: 5,
                    fontWeight: '600',
                },
                tabBarActiveBackgroundColor: 'transparent',
                sceneStyle: { backgroundColor: '#0A0A0A' },
            }}
        >
            <Tabs.Screen
                name="index"
                options={{
                    title: 'HOME',
                    tabBarIcon: ({ color, size, focused }) => (
                        <TabIcon name="home-outline" color={color} size={size} focused={focused} />
                    ),
                }}
            />
            <Tabs.Screen
                name="workout"
                options={{
                    title: 'WORKOUT',
                    tabBarIcon: ({ color, size, focused }) => (
                        <TabIcon name="barbell-outline" color={color} size={size} focused={focused} />
                    ),
                }}
            />
            <Tabs.Screen
                name="history"
                options={{
                    title: 'HISTORY',
                    tabBarIcon: ({ color, size, focused }) => (
                        <TabIcon name="time-outline" color={color} size={size} focused={focused} />
                    ),
                }}
            />
            <Tabs.Screen
                name="profile"
                options={{
                    title: 'PROFILE',
                    tabBarIcon: ({ color, size, focused }) => (
                        <TabIcon name="person-outline" color={color} size={size} focused={focused} />
                    ),
                }}
            />
        </Tabs>
    );
}

const styles = StyleSheet.create({
    activeIconWrapper: {
        shadowColor: '#FF6000',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.8,
        shadowRadius: 8,
        elevation: 8,
    },
});
