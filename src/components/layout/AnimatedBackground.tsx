import { BlurView } from 'expo-blur';
import { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';

interface Props {
    intensity?: number;
}

export default function AnimatedBackground({ intensity = 60 }: Props) {
    const anim1y = useRef(new Animated.Value(0)).current;
    const anim1x = useRef(new Animated.Value(0)).current;
    const anim2y = useRef(new Animated.Value(0)).current;
    const anim2x = useRef(new Animated.Value(0)).current;
    const anim3y = useRef(new Animated.Value(0)).current;
    const anim3x = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        const makeLoop = (
            value: Animated.Value,
            toValue: number,
            duration: number
        ): Animated.CompositeAnimation =>
            Animated.loop(
                Animated.sequence([
                    Animated.timing(value, {
                        toValue,
                        duration,
                        easing: Easing.inOut(Easing.ease),
                        useNativeDriver: true,
                    }),
                    Animated.timing(value, {
                        toValue: 0,
                        duration,
                        easing: Easing.inOut(Easing.ease),
                        useNativeDriver: true,
                    }),
                ])
            );

        const loops = [
            makeLoop(anim1y, 30, 10000),
            makeLoop(anim1x, -20, 10000),
            makeLoop(anim2y, -25, 13000),
            makeLoop(anim2x, 20, 13000),
            makeLoop(anim3y, 20, 8000),
            makeLoop(anim3x, -15, 8000),
        ];

        loops.forEach((l) => l.start());

        return () => loops.forEach((l) => l.stop());
    }, []);

    const animStyle1 = {
        transform: [{ translateY: anim1y }, { translateX: anim1x }],
    };
    const animStyle2 = {
        transform: [{ translateY: anim2y }, { translateX: anim2x }],
    };
    const animStyle3 = {
        transform: [{ translateY: anim3y }, { translateX: anim3x }],
    };

    return (
        <View style={styles.root}>
            <Animated.View style={[styles.circle, styles.c1, animStyle1]} />
            <Animated.View style={[styles.circle, styles.c2, animStyle2]} />
            <Animated.View style={[styles.circle, styles.c3, animStyle3]} />
            <BlurView style={StyleSheet.absoluteFill} intensity={intensity} tint="dark" />
        </View>
    );
}

const styles = StyleSheet.create({
    root: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
    },
    circle: {
        position: 'absolute',
        borderRadius: 999,
    },
    c1: {
        top: -100,
        right: -80,
        width: 280,
        height: 280,
        backgroundColor: '#FF6000',
        opacity: 0.35,
    },
    c2: {
        top: 350,
        left: -60,
        width: 240,
        height: 240,
        backgroundColor: '#CC4400',
        opacity: 0.25,
    },
    c3: {
        bottom: 100,
        right: -40,
        width: 300,
        height: 300,
        backgroundColor: '#1A0A00',
        opacity: 0.8,
    },
});
