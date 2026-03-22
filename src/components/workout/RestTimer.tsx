import { Ionicons } from '@expo/vector-icons';
import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withTiming,
} from 'react-native-reanimated';

interface RestTimerProps {
    duration: number; // seconds
    isRunning: boolean;
    onDismiss: () => void;
}

const formatTime = (s: number): string => {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins}:${String(secs).padStart(2, '0')}`;
};

export default function RestTimer({ duration, isRunning, onDismiss }: RestTimerProps) {
    const [remaining, setRemaining] = useState(duration);
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const opacity = useSharedValue(0);

    useEffect(() => {
        if (isRunning) {
            setRemaining(duration);
            opacity.value = withTiming(1, { duration: 200 });

            intervalRef.current = setInterval(() => {
                setRemaining((prev) => {
                    if (prev <= 1) {
                        clearInterval(intervalRef.current!);
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        } else {
            opacity.value = withTiming(0, { duration: 150 });
            if (intervalRef.current) clearInterval(intervalRef.current);
        }

        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [isRunning, duration]);

    // Auto-dismiss when timer reaches 0
    useEffect(() => {
        if (remaining === 0 && isRunning) {
            const timeout = setTimeout(onDismiss, 1500);
            return () => clearTimeout(timeout);
        }
    }, [remaining, isRunning]);

    const animatedStyle = useAnimatedStyle(() => ({
        opacity: opacity.value,
    }));

    const progress = duration > 0 ? remaining / duration : 0;
    const isFinished = remaining === 0;

    if (!isRunning) return null;

    return (
        <Animated.View style={[styles.container, animatedStyle]}>
            <View style={styles.bar}>
                {/* Progress background */}
                <View style={[styles.progressBg, { width: `${progress * 100}%` }]} />

                <View style={styles.content}>
                    <View style={styles.left}>
                        <Ionicons
                            name={isFinished ? 'checkmark-circle' : 'timer-outline'}
                            size={20}
                            color={isFinished ? '#30D158' : '#4A9EFF'}
                        />
                        <Text style={[styles.label, isFinished && styles.labelFinished]}>
                            {isFinished ? 'Rest Complete' : 'Rest Timer'}
                        </Text>
                    </View>

                    <View style={styles.right}>
                        <Text style={[styles.time, isFinished && styles.timeFinished]}>
                            {formatTime(remaining)}
                        </Text>
                        <Pressable onPress={onDismiss} hitSlop={8} style={styles.dismissBtn}>
                            <Ionicons name="close" size={16} color="rgba(255,255,255,0.6)" />
                        </Pressable>
                    </View>
                </View>
            </View>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    container: {},
    bar: {
        backgroundColor: 'rgba(28,28,30,0.95)',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        overflow: 'hidden',
    },
    progressBg: {
        position: 'absolute',
        top: 0,
        left: 0,
        bottom: 0,
        backgroundColor: 'rgba(74,158,255,0.15)',
    },
    content: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 14,
    },
    left: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    right: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    label: {
        color: 'white',
        fontSize: 15,
        fontWeight: '600',
    },
    labelFinished: {
        color: '#30D158',
    },
    time: {
        color: '#4A9EFF',
        fontSize: 20,
        fontWeight: '700',
        fontVariant: ['tabular-nums'],
        minWidth: 48,
        textAlign: 'right',
    },
    timeFinished: {
        color: '#30D158',
    },
    dismissBtn: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: 'rgba(255,255,255,0.1)',
        alignItems: 'center',
        justifyContent: 'center',
    },
});
