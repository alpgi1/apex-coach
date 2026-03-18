import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { Tabs } from 'expo-router';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/* ── constants ─────────────────────────────────────── */

const TAB_MARGIN = 10;
const TAB_HEIGHT = 70;
const TAB_RADIUS = 30;

/* ── types ─────────────────────────────────────────── */

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

interface TabIconProps {
    name: IoniconsName;
    color: string;
    size: number;
    focused: boolean;
}

/* ── tab icon with glow ────────────────────────────── */

function TabIcon({ name, color, size, focused }: TabIconProps) {
    return (
        <View style={focused ? styles.activeIconWrapper : styles.iconWrapper}>
            <Ionicons name={name} size={size} color={color} />
        </View>
    );
}

/* ── layout ────────────────────────────────────────── */

export default function TabLayout() {
    const insets = useSafeAreaInsets();
    const { width: screenWidth } = useWindowDimensions();
    const bottomOffset = insets.bottom > 0 ? insets.bottom : 20;
    const barWidth = screenWidth - TAB_MARGIN * 2;

    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                tabBarBackground: () => (
                    <View style={[StyleSheet.absoluteFill, styles.bgWrapper]}>
                        <BlurView
                            intensity={60}
                            tint="dark"
                            style={StyleSheet.absoluteFill}
                        />
                        <View style={[StyleSheet.absoluteFill, styles.bgOverlay]} />
                    </View>
                ),
                tabBarStyle: {
                    position: 'absolute',
                    bottom: bottomOffset,
                    left: TAB_MARGIN,
                    right: TAB_MARGIN,
                    //width: barWidth,
                    width: '100%',
                    height: TAB_HEIGHT,
                    borderRadius: TAB_RADIUS,
                    backgroundColor: 'transparent',
                    borderTopWidth: 0,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 8 },
                    shadowOpacity: 0.4,
                    shadowRadius: 24,
                    elevation: 20,
                },
                tabBarItemStyle: {
                    paddingTop: 8,
                    justifyContent: 'center',
                    alignItems: 'center',
                },
                tabBarActiveTintColor: '#FF6000',
                tabBarInactiveTintColor: '#A0A0A0',
                tabBarLabelStyle: {
                    fontSize: 11,
                    fontFamily: 'Outfit_500Medium',
                    includeFontPadding: false,
                    marginTop: 1,
                },
                tabBarActiveBackgroundColor: 'transparent',
                sceneStyle: { backgroundColor: '#0A0A0A' },
            }}
        >
            <Tabs.Screen
                name="index"
                options={{
                    title: 'Home',
                    tabBarIcon: ({ color, focused }) => (
                        <TabIcon name="home-outline" color={color} size={22} focused={focused} />
                    ),
                }}
            />
            <Tabs.Screen
                name="workout"
                options={{
                    title: 'Workout',
                    tabBarIcon: ({ color, focused }) => (
                        <TabIcon name="barbell-outline" color={color} size={22} focused={focused} />
                    ),
                }}
            />
            <Tabs.Screen
                name="analyse"
                options={{
                    title: 'Analyse',
                    tabBarIcon: ({ color, focused }) => (
                        <TabIcon name="analytics-outline" color={color} size={22} focused={focused} />
                    ),
                }}
            />
            <Tabs.Screen
                name="profile"
                options={{
                    title: 'Profile',
                    tabBarIcon: ({ color, focused }) => (
                        <TabIcon name="person-outline" color={color} size={22} focused={focused} />
                    ),
                }}
            />
        </Tabs>
    );
}

/* ── styles ────────────────────────────────────────── */

const styles = StyleSheet.create({
    bgWrapper: {
        borderRadius: TAB_RADIUS,
        overflow: 'hidden',
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: 'rgba(255,255,255,0.10)',
    },
    bgOverlay: {
        backgroundColor: 'rgba(12, 12, 12, 0.70)',
    },
    iconWrapper: {
        alignItems: 'center',
    },
    activeIconWrapper: {
        alignItems: 'center',
        shadowColor: '#FF6000',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.8,
        shadowRadius: 8,
        elevation: 8,
    },
});
