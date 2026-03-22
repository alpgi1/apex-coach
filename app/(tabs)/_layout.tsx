import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Tabs } from 'expo-router';
import { useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/* ── constants ─────────────────────────────────────── */

const TAB_MARGIN = 10;
const TAB_HEIGHT = 70;
const TAB_RADIUS = 30;

/* ── types ─────────────────────────────────────────── */

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

interface TabIconProps {
    name: IoniconsName;
    label: string;
    color: string;
    size: number;
    focused: boolean;
}

/* ── animated tab button ───────────────────────────── */

function AnimatedTabButton({ children, onPress, onLongPress, style, ...rest }: any) {
    const scale = useRef(new Animated.Value(1)).current;

    const handlePress = (e: any) => {
        scale.setValue(0.82);
        Animated.spring(scale, {
            toValue: 1,
            friction: 4,
            tension: 300,
            useNativeDriver: true,
        }).start();
        onPress?.(e);
    };

    return (
        <Pressable onPress={handlePress} onLongPress={onLongPress} style={style} {...rest}>
            <Animated.View style={{ transform: [{ scale }], flex: 1 }}>
                {children}
            </Animated.View>
        </Pressable>
    );
}

/* ── center tab button (floating gradient circle) ──── */

function CenterTabButton({ onPress, onLongPress, style, ...rest }: any) {
    const scale = useRef(new Animated.Value(1)).current;

    const handlePress = (e: any) => {
        scale.setValue(0.82);
        Animated.spring(scale, {
            toValue: 1,
            friction: 4,
            tension: 300,
            useNativeDriver: true,
        }).start();
        onPress?.(e);
    };

    return (
        <Pressable
            onPress={handlePress}
            onLongPress={onLongPress}
            style={[style, styles.centerButtonContainer]}
            {...rest}
        >
            <Animated.View style={[styles.centerButtonAnimated, { transform: [{ scale }] }]}>
                {/* Outer halo glow */}
                <View style={styles.centerHalo} />
                {/* Gradient circle */}
                <LinearGradient
                    colors={['#00C9A7', '#00B4D8']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.centerGradient}
                >
                    <Ionicons name="sparkles" size={26} color="#FFFFFF" />
                </LinearGradient>
            </Animated.View>
        </Pressable>
    );
}

/* ── tab icon with glow ────────────────────────────── */

function TabIcon({ name, label, color, size, focused }: TabIconProps) {
    return (
        <View style={styles.tabItem}>
            <View style={focused ? styles.activeIconWrapper : styles.iconWrapper}>
                <Ionicons name={name} size={size} color={color} />
            </View>
            <Text style={[styles.tabLabel, { color }]} numberOfLines={1}>{label}</Text>
        </View>
    );
}

/* ── layout ────────────────────────────────────────── */

export default function TabLayout() {
    const insets = useSafeAreaInsets();
    const bottomOffset = insets.bottom > 0 ? insets.bottom : 20;

    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                tabBarButton: (props) => <AnimatedTabButton {...props} />,
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
                    justifyContent: 'flex-start',
                    alignItems: 'center',
                    paddingTop: 15,
                },
                tabBarIconStyle: {
                    width: '100%',
                    overflow: 'visible',
                },
                tabBarActiveTintColor: '#FF6000',
                tabBarInactiveTintColor: '#A0A0A0',
                tabBarLabelStyle: {
                    fontSize: 11,
                    fontFamily: 'Outfit_500Medium',
                    includeFontPadding: false,
                    marginTop: 1,
                },
                tabBarShowLabel: false,
                tabBarActiveBackgroundColor: 'transparent',
                sceneStyle: { backgroundColor: '#0A0A0A' },
            }}
        >
            <Tabs.Screen
                name="index"
                options={{
                    title: 'Home',
                    tabBarIcon: ({ color, focused }) => (
                        <TabIcon name="home-outline" label="Home" color={color} size={22} focused={focused} />
                    ),
                }}
            />
            <Tabs.Screen
                name="workout"
                options={{
                    title: 'Workout',
                    tabBarIcon: ({ color, focused }) => (
                        <TabIcon name="barbell-outline" label="Workout" color={color} size={22} focused={focused} />
                    ),
                }}
            />
            <Tabs.Screen
                name="coach"
                options={{
                    title: '',
                    tabBarButton: (props) => <CenterTabButton {...props} />,
                }}
            />
            <Tabs.Screen
                name="analyse"
                options={{
                    title: 'Analyse',
                    tabBarIcon: ({ color, focused }) => (
                        <TabIcon name="analytics-outline" label="Analyse" color={color} size={22} focused={focused} />
                    ),
                }}
            />
            <Tabs.Screen
                name="profile"
                options={{
                    title: 'Profile',
                    tabBarIcon: ({ color, focused }) => (
                        <TabIcon name="person-outline" label="Profile" color={color} size={22} focused={focused} />
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
    tabItem: {
        alignItems: 'center',
        justifyContent: 'center',
        gap: 3,
    },
    tabLabel: {
        fontSize: 11,
        fontFamily: 'Outfit_500Medium',
        includeFontPadding: false,
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
    /* ── center tab ── */
    centerButtonContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    centerButtonAnimated: {
        alignItems: 'center',
        justifyContent: 'center',
        top: -15,
    },
    centerHalo: {
        position: 'absolute',
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: 'rgba(0, 201, 167, 0.15)',
    },
    centerGradient: {
        width: 56,
        height: 56,
        borderRadius: 28,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#00C9A7',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.6,
        shadowRadius: 16,
        elevation: 12,
    },
});
