import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withDelay,
    withTiming,
} from 'react-native-reanimated';

interface Props {
    isVisible: boolean;
    onComplete: (name: string) => void;
}

export default function OnboardingModal({ isVisible, onComplete }: Props) {
    const [inputValue, setInputValue] = useState<string>('');

    const canComplete = inputValue.trim().length > 0;

    const handleComplete = () => {
        const name = inputValue.trim();
        if (!name) return;
        onComplete(name);
    };

    /* ── animations ─────────────────────────────────────────── */
    const contentOpacity = useSharedValue(0);
    const titleScale = useSharedValue(0.85);
    const buttonTranslateY = useSharedValue(30);
    const buttonOpacity = useSharedValue(0);

    useEffect(() => {
        if (isVisible) {
            contentOpacity.value = withTiming(1, { duration: 600 });
            titleScale.value = withTiming(1, { duration: 500 });
            buttonTranslateY.value = withDelay(300, withTiming(0, { duration: 400 }));
            buttonOpacity.value = withDelay(300, withTiming(1, { duration: 400 }));
        } else {
            contentOpacity.value = 0;
            titleScale.value = 0.85;
            buttonTranslateY.value = 30;
            buttonOpacity.value = 0;
        }
    }, [isVisible]);

    const contentStyle = useAnimatedStyle(() => ({
        opacity: contentOpacity.value,
    }));

    const titleStyle = useAnimatedStyle(() => ({
        transform: [{ scale: titleScale.value }],
    }));

    const buttonStyle = useAnimatedStyle(() => ({
        transform: [{ translateY: buttonTranslateY.value }],
        opacity: buttonOpacity.value,
    }));

    return (
        <Modal animationType="fade" transparent visible={isVisible} statusBarTranslucent>
            <View style={styles.root}>

                {/* ── BACKGROUND MESH ───────────────────────── */}
                <View style={[styles.circle, styles.circle1]} />
                <View style={[styles.circle, styles.circle2]} />
                <View style={[styles.circle, styles.circle3]} />
                <BlurView style={StyleSheet.absoluteFill} intensity={70} tint="dark" />

                {/* ── CONTENT ───────────────────────────────── */}
                <Animated.View style={[styles.content, contentStyle]}>

                    {/* TOP — icon + headline */}
                    <View style={styles.topSection}>
                        <View style={styles.iconCircle}>
                            <Ionicons name="barbell" size={32} color="white" />
                        </View>

                        <Text style={styles.welcomeLabel}>Welcome to</Text>
                        <Animated.Text style={[styles.title, titleStyle]}>
                            Apex Coach
                        </Animated.Text>
                        <Text style={styles.tagline}>Train smarter. Lift heavier.</Text>
                    </View>

                    {/* MIDDLE — input */}
                    <View style={styles.middleSection}>
                        <Text style={styles.inputLabel}>What should we call you?</Text>
                        <TextInput
                            value={inputValue}
                            onChangeText={setInputValue}
                            onSubmitEditing={handleComplete}
                            placeholder="Your name..."
                            placeholderTextColor="rgba(255,255,255,0.4)"
                            autoFocus
                            returnKeyType="done"
                            style={styles.input}
                        />
                    </View>

                    {/* BOTTOM — button + footnote */}
                    <Animated.View style={[styles.bottomSection, buttonStyle]}>
                        <Pressable
                            onPress={handleComplete}
                            disabled={!canComplete}
                            style={[styles.button, !canComplete && styles.buttonDisabled]}
                        >
                            <Text style={styles.buttonText}>Get Started →</Text>
                        </Pressable>
                        <Text style={styles.footnote}>
                            You can change this later in Profile
                        </Text>
                    </Animated.View>

                </Animated.View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    root: {
        flex: 1,
        backgroundColor: '#0A0A0A',
    },
    circle: {
        position: 'absolute',
        borderRadius: 999,
    },
    circle1: {
        top: -50,
        left: -80,
        width: 320,
        height: 320,
        backgroundColor: '#FF6000',
        opacity: 0.5,
    },
    circle2: {
        top: 200,
        right: -100,
        width: 280,
        height: 280,
        backgroundColor: '#FF8C00',
        opacity: 0.35,
    },
    circle3: {
        bottom: 100,
        left: 20,
        width: 380,
        height: 380,
        backgroundColor: '#CC4400',
        opacity: 0.3,
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        paddingHorizontal: 24,
    },
    topSection: {
        alignItems: 'center',
    },
    iconCircle: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: 'rgba(255,255,255,0.1)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    welcomeLabel: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.6)',
        marginTop: 24,
    },
    title: {
        fontSize: 48,
        fontWeight: 'bold',
        color: 'white',
        marginTop: 4,
    },
    tagline: {
        fontSize: 14,
        fontStyle: 'italic',
        color: 'rgba(255,255,255,0.5)',
        marginTop: 8,
    },
    middleSection: {
        marginTop: 64,
    },
    inputLabel: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.7)',
        marginBottom: 8,
    },
    input: {
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 16,
        paddingHorizontal: 20,
        paddingVertical: 16,
        color: 'white',
        fontSize: 18,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
    },
    bottomSection: {
        marginTop: 32,
    },
    button: {
        backgroundColor: 'white',
        borderRadius: 999,
        height: 56,
        alignItems: 'center',
        justifyContent: 'center',
    },
    buttonDisabled: {
        opacity: 0.4,
    },
    buttonText: {
        color: 'black',
        fontWeight: 'bold',
        fontSize: 16,
    },
    footnote: {
        color: 'rgba(255,255,255,0.4)',
        fontSize: 12,
        textAlign: 'center',
        marginTop: 12,
    },
});
