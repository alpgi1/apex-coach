import { Ionicons } from '@expo/vector-icons';
import { useEffect, useRef, useState } from 'react';
import {
    Dimensions,
    KeyboardAvoidingView,
    Modal,
    Platform,
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';
import Animated, {
    Easing,
    useAnimatedStyle,
    useSharedValue,
    withTiming,
} from 'react-native-reanimated';
import AnimatedBackground from './AnimatedBackground';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const TOTAL_SLIDES = 3;

interface Props {
    isVisible: boolean;
    onComplete: (name: string) => void;
}

const FEATURES = [
    { icon: 'barbell-outline' as const,              text: 'Log workouts with full set history' },
    { icon: 'trending-up-outline' as const,          text: 'Track personal records automatically' },
    { icon: 'chatbubble-ellipses-outline' as const,  text: 'AI coach powered by your data' },
];

export default function OnboardingModal({ isVisible, onComplete }: Props) {
    const [step, setStep] = useState(0);
    const [nameValue, setNameValue] = useState('');
    const nameInputRef = useRef<TextInput>(null);

    const translateX    = useSharedValue(0);
    const contentOpacity = useSharedValue(0);

    useEffect(() => {
        if (isVisible) {
            contentOpacity.value = withTiming(1, { duration: 600 });
        } else {
            contentOpacity.value = 0;
            setStep(0);
            setNameValue('');
            translateX.value = 0;
        }
    }, [isVisible]);

    useEffect(() => {
        if (step === TOTAL_SLIDES - 1) {
            setTimeout(() => nameInputRef.current?.focus(), 420);
        }
    }, [step]);

    const goNext = () => {
        const next = step + 1;
        translateX.value = withTiming(-next * SCREEN_WIDTH, {
            duration: 380,
            easing: Easing.out(Easing.cubic),
        });
        setStep(next);
    };

    const handleComplete = () => {
        const trimmed = nameValue.trim();
        if (!trimmed) return;
        onComplete(trimmed);
    };

    const slidesAnimStyle = useAnimatedStyle(() => ({
        transform: [{ translateX: translateX.value }],
    }));

    const wrapperAnimStyle = useAnimatedStyle(() => ({
        opacity: contentOpacity.value,
    }));

    const isLastSlide = step === TOTAL_SLIDES - 1;
    const canProceed  = isLastSlide ? nameValue.trim().length > 0 : true;

    return (
        <Modal animationType="fade" transparent visible={isVisible} statusBarTranslucent>
            <View style={styles.root}>
                <AnimatedBackground />

                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={styles.kav}
                >
                    <Animated.View style={[styles.wrapper, wrapperAnimStyle]}>

                        {/* ── SLIDES ──────────────────────────────────── */}
                        <View style={styles.slidesViewport}>
                            <Animated.View style={[styles.slidesRow, slidesAnimStyle]}>

                                {/* Slide 1 — Welcome */}
                                <View style={styles.slide}>
                                    <View style={styles.iconCircle}>
                                        <Ionicons name="barbell" size={36} color="white" />
                                    </View>
                                    <Text style={styles.welcomeLabel}>Welcome to</Text>
                                    <Text style={styles.bigTitle}>Apex Coach</Text>
                                    <Text style={styles.tagline}>Train smarter. Lift heavier.</Text>
                                    <Text style={styles.description}>
                                        Your intelligent training companion, built for lifters who want real progress.
                                    </Text>
                                </View>

                                {/* Slide 2 — Features */}
                                <View style={styles.slide}>
                                    <View style={styles.iconCircle}>
                                        <Ionicons name="trophy" size={36} color="white" />
                                    </View>
                                    <Text style={styles.slideTitle}>Everything{'\n'}You Need</Text>
                                    <Text style={styles.description}>
                                        Apex Coach gives you the tools to train with purpose.
                                    </Text>
                                    <View style={styles.featureList}>
                                        {FEATURES.map((f) => (
                                            <View key={f.text} style={styles.featureRow}>
                                                <View style={styles.featureIconWrap}>
                                                    <Ionicons name={f.icon} size={18} color="#FF8C00" />
                                                </View>
                                                <Text style={styles.featureText}>{f.text}</Text>
                                            </View>
                                        ))}
                                    </View>
                                </View>

                                {/* Slide 3 — Name */}
                                <View style={styles.slide}>
                                    <View style={styles.iconCircle}>
                                        <Ionicons name="person" size={36} color="white" />
                                    </View>
                                    <Text style={styles.slideTitle}>One Last{'\n'}Thing</Text>
                                    <Text style={styles.inputLabel}>What should we call you?</Text>
                                    <TextInput
                                        ref={nameInputRef}
                                        value={nameValue}
                                        onChangeText={setNameValue}
                                        onSubmitEditing={handleComplete}
                                        placeholder="Your name..."
                                        placeholderTextColor="rgba(255,255,255,0.4)"
                                        returnKeyType="done"
                                        style={styles.input}
                                        autoCorrect={false}
                                    />
                                    <Text style={styles.footnote}>You can change this later in Profile</Text>
                                </View>

                            </Animated.View>
                        </View>

                        {/* ── BOTTOM ──────────────────────────────────── */}
                        <View style={styles.bottom}>
                            <View style={styles.dotsRow}>
                                {Array.from({ length: TOTAL_SLIDES }).map((_, i) => (
                                    <View key={i} style={[styles.dot, step === i && styles.dotActive]} />
                                ))}
                            </View>

                            <Pressable
                                onPress={isLastSlide ? handleComplete : goNext}
                                disabled={!canProceed}
                                style={[styles.button, !canProceed && styles.buttonDisabled]}
                            >
                                <Text style={styles.buttonText}>
                                    {isLastSlide ? 'Get Started →' : 'Next →'}
                                </Text>
                            </Pressable>
                        </View>

                    </Animated.View>
                </KeyboardAvoidingView>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    root: {
        flex: 1,
        backgroundColor: '#0A0A0A',
    },
    kav: {
        flex: 1,
    },
    wrapper: {
        flex: 1,
    },

    /* ── Slides ── */
    slidesViewport: {
        flex: 1,
        overflow: 'hidden',
    },
    slidesRow: {
        flexDirection: 'row',
        width: SCREEN_WIDTH * TOTAL_SLIDES,
        flex: 1,
    },
    slide: {
        width: SCREEN_WIDTH,
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 28,
    },

    /* ── Icon circle ── */
    iconCircle: {
        width: 72,
        height: 72,
        borderRadius: 36,
        backgroundColor: 'rgba(255,255,255,0.08)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.14)',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 32,
    },

    /* ── Typography ── */
    welcomeLabel: {
        fontSize: 13,
        letterSpacing: 1,
        textTransform: 'uppercase',
        color: 'rgba(255,255,255,0.45)',
        marginBottom: 6,
    },
    bigTitle: {
        fontSize: 52,
        fontWeight: 'bold',
        color: 'white',
        marginBottom: 8,
        textAlign: 'center',
    },
    tagline: {
        fontSize: 14,
        fontStyle: 'italic',
        color: 'rgba(255,255,255,0.45)',
        marginBottom: 24,
    },
    slideTitle: {
        fontSize: 40,
        fontWeight: 'bold',
        color: 'white',
        textAlign: 'center',
        lineHeight: 46,
        marginBottom: 16,
    },
    description: {
        fontSize: 15,
        color: 'rgba(255,255,255,0.55)',
        textAlign: 'center',
        lineHeight: 22,
        maxWidth: 280,
    },

    /* ── Feature list ── */
    featureList: {
        marginTop: 32,
        width: '100%',
        gap: 12,
    },
    featureRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 14,
        paddingHorizontal: 16,
        paddingVertical: 14,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.07)',
    },
    featureIconWrap: {
        width: 34,
        height: 34,
        borderRadius: 9,
        backgroundColor: 'rgba(255,140,0,0.12)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    featureText: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: 14,
        flex: 1,
    },

    /* ── Name input ── */
    inputLabel: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.65)',
        marginBottom: 12,
        alignSelf: 'flex-start',
        width: '100%',
    },
    input: {
        width: '100%',
        backgroundColor: 'rgba(255,255,255,0.08)',
        borderRadius: 16,
        paddingHorizontal: 20,
        paddingVertical: 16,
        color: 'white',
        fontSize: 18,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.18)',
        marginBottom: 12,
    },
    footnote: {
        color: 'rgba(255,255,255,0.3)',
        fontSize: 12,
        textAlign: 'center',
    },

    /* ── Bottom (dots + button) ── */
    bottom: {
        paddingHorizontal: 24,
        paddingBottom: 48,
    },
    dotsRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
        paddingVertical: 24,
    },
    dot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: 'rgba(255,255,255,0.2)',
    },
    dotActive: {
        width: 22,
        backgroundColor: 'white',
    },
    button: {
        backgroundColor: 'white',
        borderRadius: 999,
        height: 56,
        alignItems: 'center',
        justifyContent: 'center',
    },
    buttonDisabled: {
        opacity: 0.3,
    },
    buttonText: {
        color: 'black',
        fontWeight: 'bold',
        fontSize: 16,
        letterSpacing: 0.3,
    },
});
