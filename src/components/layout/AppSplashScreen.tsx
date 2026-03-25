import { useEffect, useRef } from 'react';
import { Animated, Image, Pressable, StyleSheet, Text } from 'react-native';
import AnimatedBackground from './AnimatedBackground';

interface Props {
    onPress?: () => void;
}

export default function AppSplashScreen({ onPress }: Props) {
    const fadeIn = useRef(new Animated.Value(0)).current;
    const logoScale = useRef(new Animated.Value(0.85)).current;
    const dotOpacity1 = useRef(new Animated.Value(0.3)).current;
    const dotOpacity2 = useRef(new Animated.Value(0.3)).current;
    const dotOpacity3 = useRef(new Animated.Value(0.3)).current;

    useEffect(() => {
        // Logo fade + scale in
        Animated.parallel([
            Animated.timing(fadeIn, {
                toValue: 1,
                duration: 600,
                useNativeDriver: true,
            }),
            Animated.spring(logoScale, {
                toValue: 1,
                tension: 60,
                friction: 8,
                useNativeDriver: true,
            }),
        ]).start();

        // Bouncing dots animation
        const pulse = (dot: Animated.Value, delay: number) =>
            Animated.loop(
                Animated.sequence([
                    Animated.delay(delay),
                    Animated.timing(dot, { toValue: 1, duration: 400, useNativeDriver: true }),
                    Animated.timing(dot, { toValue: 0.3, duration: 400, useNativeDriver: true }),
                ])
            );

        const d1 = pulse(dotOpacity1, 0);
        const d2 = pulse(dotOpacity2, 160);
        const d3 = pulse(dotOpacity3, 320);
        d1.start(); d2.start(); d3.start();

        return () => { d1.stop(); d2.stop(); d3.stop(); };
    }, []);

    return (
        <Pressable style={styles.root} onPress={onPress}>
            <AnimatedBackground intensity={55} />

            <Animated.View
                style={[
                    styles.content,
                    { opacity: fadeIn, transform: [{ scale: logoScale }] },
                ]}
            >
                <Image
                    source={require('../../../assets/images/icon.png')}
                    style={styles.logo}
                    resizeMode="contain"
                />
                <Text style={styles.title}>Apex Coach</Text>
                <Text style={styles.tagline}>Train Smarter</Text>
            </Animated.View>

            <Animated.View style={[styles.dots, { opacity: fadeIn }]}>
                <Animated.View style={[styles.dot, { opacity: dotOpacity1 }]} />
                <Animated.View style={[styles.dot, { opacity: dotOpacity2 }]} />
                <Animated.View style={[styles.dot, { opacity: dotOpacity3 }]} />
            </Animated.View>
        </Pressable>
    );
}

const styles = StyleSheet.create({
    root: {
        flex: 1,
        backgroundColor: '#0A0A0A',
        justifyContent: 'center',
        alignItems: 'center',
    },
    content: {
        alignItems: 'center',
    },
    logo: {
        width: 140,
        height: 140,
        marginBottom: 20,
    },
    title: {
        color: '#FFFFFF',
        fontSize: 28,
        fontWeight: '700',
        letterSpacing: 1,
        marginBottom: 6,
    },
    tagline: {
        color: '#FF6000',
        fontSize: 13,
        fontWeight: '500',
        letterSpacing: 3,
        textTransform: 'uppercase',
    },
    dots: {
        position: 'absolute',
        bottom: 60,
        flexDirection: 'row',
        gap: 8,
    },
    dot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#FF6000',
    },
});
