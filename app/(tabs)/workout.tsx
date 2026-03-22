import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
    Alert,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withTiming,
} from 'react-native-reanimated';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import AnimatedBackground from '../../src/components/layout/AnimatedBackground';

import CollapsedExerciseCard from '../../src/components/workout/CollapsedExerciseCard';
import ExerciseCard, { type SetRowDraft } from '../../src/components/workout/ExerciseCard';
import ExercisePickerModal from '../../src/components/workout/ExercisePickerModal';
import RestTimer from '../../src/components/workout/RestTimer';
import { useProgressiveOverload } from '../../src/hooks/useProgressiveOverload';
import { useWorkoutSession } from '../../src/hooks/useWorkoutSession';
import { getExerciseById } from '../../src/services/storage/exerciseStorage';
import { useUserStore } from '../../src/store/userStore';
import { ExerciseMetadata } from '../../src/types/exercise.types';
import { WorkoutSet } from '../../src/types/workout.types';

/* ──────────────────────────── helpers ──────────────────────────── */

const formatTimer = (totalSeconds: number): string => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
};

const formatVolume = (kg: number): string =>
    kg >= 1000 ? `${(kg / 1000).toFixed(1)}k kg` : `${kg.toLocaleString()} kg`;

/* ──────────────────────── main screen ─────────────────────────── */

export default function WorkoutScreen() {
    const router = useRouter();
    const {
        activeSession,
        isWorkoutActive,
        addExercise,
        addWarmupSet,
        addEmptySets,
        completeSet,
        updateSetValues,
        removeSet,
        finishWorkout,
        setSessionNotes,
    } = useWorkoutSession();

    const { suggestion, fetchSuggestion } = useProgressiveOverload();
    const { targetRIR, restTimerDuration, autoStartRestTimer } = useUserStore();

    /* ── rest timer ────────────────────────────────────────────── */
    const [isRestTimerRunning, setIsRestTimerRunning] = useState(false);
    const insets = useSafeAreaInsets();

    /* ── timer ────────────────────────────────────────────────── */
    const [elapsed, setElapsed] = useState<number>(0);

    useEffect(() => {
        if (!isWorkoutActive || !activeSession) {
            setElapsed(0);
            return;
        }

        const start = new Date(activeSession.startTime).getTime();
        setElapsed(Math.floor((Date.now() - start) / 1000));

        const id = setInterval(() => {
            setElapsed(Math.floor((Date.now() - start) / 1000));
        }, 1000);

        return () => clearInterval(id);
    }, [isWorkoutActive, activeSession]);

    /* ── live volume ─────────────────────────────────────────── */
    const liveVolume = useMemo<number>(() => {
        if (!activeSession) return 0;
        let total = 0;
        for (const log of activeSession.logs) {
            for (const s of log.sets) {
                if (s.isCompleted && s.setType === 'WORKING') {
                    total += s.weightKg * s.reps;
                }
            }
        }
        return total;
    }, [activeSession]);

    /* ── expanded exercise state ──────────────────────────────── */
    const [expandedLogId, setExpandedLogId] = useState<string | null>(null);
    const [isPickerVisible, setIsPickerVisible] = useState<boolean>(false);
    const [exerciseMap, setExerciseMap] = useState<Record<string, ExerciseMetadata>>({});

    const expandedLog = activeSession?.logs.find((l) => l.id === expandedLogId) ?? null;

    /* ── auto-expand first exercise on session start ──────────── */
    useEffect(() => {
        if (activeSession?.logs.length && !expandedLogId) {
            setExpandedLogId(activeSession.logs[0].id);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeSession?.id, activeSession?.logs.length]);

    /* ── auto-scroll to expanded card ─────────────────────────── */
    const scrollRef = useRef<ScrollView>(null);
    const cardPositions = useRef<Record<string, number>>({});

    useEffect(() => {
        if (expandedLogId && cardPositions.current[expandedLogId] != null) {
            setTimeout(() => {
                scrollRef.current?.scrollTo({
                    y: cardPositions.current[expandedLogId!],
                    animated: true,
                });
            }, 50);
        }
    }, [expandedLogId]);

    /* ── draft inputs per set (keyed by set.id) ─────────────── */
    const [drafts, setDrafts] = useState<Record<string, SetRowDraft>>({});

    const getDraft = (s: WorkoutSet): SetRowDraft =>
        drafts[s.id] ?? {
            weight: s.weightKg > 0 ? String(s.weightKg) : '',
            reps: s.reps > 0 ? String(s.reps) : '',
            rpe: s.rpe != null ? String(s.rpe) : '',
        };

    const updateDraft = (setId: string, field: keyof SetRowDraft, value: string) => {
        setDrafts((prev) => ({
            ...prev,
            [setId]: { ...(prev[setId] ?? { weight: '', reps: '', rpe: '' }), [field]: value },
        }));
    };

    const tryAutoComplete = (
        logId: string,
        setId: string,
        isAlreadyCompleted: boolean,
        merged: SetRowDraft
    ) => {
        if (isAlreadyCompleted) return;
        const w = parseFloat(merged.weight);
        const r = parseInt(merged.reps, 10);
        const rpe = parseFloat(merged.rpe);
        if (!isNaN(w) && w > 0 && !isNaN(r) && r > 0 && !isNaN(rpe)) {
            const currentSet = activeSession?.logs.find((l) => l.id === logId)?.sets.find((s) => s.id === setId);
            completeSet(logId, setId);
            if (autoStartRestTimer && currentSet?.setType !== 'WARMUP') setIsRestTimerRunning(true);
        }
    };

    /* ── load missing exercise metadata (e.g. from template) ─── */
    useEffect(() => {
        if (!activeSession) return;
        const loadMissingMeta = async () => {
            for (const log of activeSession.logs) {
                if (!exerciseMap[log.exerciseId]) {
                    const ex = await getExerciseById(log.exerciseId);
                    if (ex) {
                        setExerciseMap((prev) => ({ ...prev, [ex.id]: ex }));
                    }
                }
            }
        };
        loadMissingMeta();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeSession?.logs.length]);

    /* ── fetch suggestion when expanded exercise changes ──────── */
    useEffect(() => {
        if (expandedLog) {
            const exercise = exerciseMap[expandedLog.exerciseId];
            fetchSuggestion(
                expandedLog.exerciseId,
                10 - targetRIR,
                exercise?.idealRepsMin ?? 5,
                exercise?.idealRepsMax ?? 10
            );
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [expandedLog?.exerciseId, targetRIR]);

    /* ── handlers ────────────────────────────────────────────── */
    const handleExerciseSelect = (exercise: ExerciseMetadata) => {
        const newLogId = addExercise(exercise.id);
        setExerciseMap((prev) => ({ ...prev, [exercise.id]: exercise }));
        setExpandedLogId(newLogId);
    };

    const [isFinishModalVisible, setIsFinishModalVisible] = useState<boolean>(false);
    const modalOpacity = useSharedValue(0);
    const modalScale = useSharedValue(0.9);

    const animatedOverlayStyle = useAnimatedStyle(() => ({
        opacity: modalOpacity.value,
    }));
    const animatedCardStyle = useAnimatedStyle(() => ({
        transform: [{ scale: modalScale.value }],
        opacity: modalOpacity.value,
    }));

    useEffect(() => {
        if (isFinishModalVisible) {
            modalOpacity.value = withTiming(1, { duration: 200 });
            modalScale.value = withTiming(1, { duration: 200 });
        } else {
            modalOpacity.value = withTiming(0, { duration: 150 });
            modalScale.value = withTiming(0.9, { duration: 150 });
        }
    }, [isFinishModalVisible]);

    const handleFinish = async () => {
        setIsFinishModalVisible(false);
        try {
            await finishWorkout();
            router.replace('/(tabs)');
        } catch (error) {
            console.error('Failed to save workout:', error);
            Alert.alert(
                'Save Failed',
                'Your workout could not be saved. Please try again.',
                [{ text: 'OK', onPress: () => setIsFinishModalVisible(true) }]
            );
        }
    };

    /* ══════════════════ NO ACTIVE SESSION STATE ══════════════ */
    if (!isWorkoutActive || !activeSession) {
        return (
            <View style={styles.root}>
                <AnimatedBackground />
                <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24 }}>
                    <Ionicons name="barbell-outline" size={64} color="#8E8E93" />
                    <Text className="text-white text-xl font-outfit-bold mt-4 text-center">
                        No Active Session
                    </Text>
                    <Text className="text-[#8E8E93] text-sm mt-2 text-center">
                        Start a workout from the dashboard
                    </Text>
                    <Pressable
                        onPress={() => router.replace('/(tabs)')}
                        className="mt-6 bg-[#FF6000] rounded-full px-8 py-3 active:opacity-80"
                    >
                        <Text className="text-white font-outfit-bold text-base">
                            Go to Dashboard
                        </Text>
                    </Pressable>
                </SafeAreaView>
            </View>
        );
    }

    /* ═══════════════════ ACTIVE SESSION UI ═══════════════════ */
    return (
        <View style={styles.root}>
            {/* ── BACKGROUND MESH ───────────────────────────── */}
            <AnimatedBackground />

            {/* ── CONTENT ───────────────────────────────────── */}
            <SafeAreaView edges={['top']} style={{ flex: 1, flexDirection: 'column' }}>
                {/* ── SECTION 1 — TOP BAR ───────────────────────── */}
                <View className="flex-row items-center justify-between px-4 py-3">
                    <Pressable
                        onPress={() => router.back()}
                        style={styles.iconBtn}
                        className="active:opacity-70"
                    >
                        <Ionicons name="chevron-back" size={22} color="#FFFFFF" />
                    </Pressable>

                    <View className="items-center">
                        <Text className="text-white text-lg font-outfit-bold">
                            {activeSession.name}
                        </Text>
                        <Text className="text-[#8E8E93] text-xs tracking-widest mt-0.5">
                            ACTIVE SESSION
                        </Text>
                    </View>

                    <Pressable style={styles.iconBtn} className="active:opacity-70">
                        <Ionicons name="ellipsis-horizontal" size={22} color="#FFFFFF" />
                    </Pressable>
                </View>

                <ScrollView
                    ref={scrollRef}
                    className="flex-1"
                    contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 160 + insets.bottom }}
                    showsVerticalScrollIndicator={false}
                    automaticallyAdjustKeyboardInsets
                    keyboardDismissMode="interactive"
                >
                    {/* ── SECTION 2 — TIMER + VOLUME ────────────── */}
                    <View className="items-center mt-2 mb-6">
                        <Text style={styles.timer}>
                            {formatTimer(elapsed)}
                        </Text>
                        <Text style={styles.volume}>
                            {formatVolume(liveVolume)}
                        </Text>
                        <Text className="text-[#8E8E93] text-xs tracking-widest mt-1">
                            LIVE TOTAL VOLUME
                        </Text>
                    </View>

                    {/* ── SECTION 3 — EXERCISE LIST ────────────────── */}
                    {activeSession.logs.map((log) => (
                        <View
                            key={log.id}
                            onLayout={(e) => {
                                cardPositions.current[log.id] = e.nativeEvent.layout.y;
                            }}
                        >
                            {log.id === expandedLogId ? (
                                <ExerciseCard
                                    log={log}
                                    exerciseName={exerciseMap[log.exerciseId]?.name ?? log.exerciseId}
                                    suggestion={suggestion}
                                    targetRIR={targetRIR}
                                    getDraft={getDraft}
                                    updateDraft={updateDraft}
                                    tryAutoComplete={tryAutoComplete}
                                    completeSet={completeSet}
                                    updateSetValues={updateSetValues}
                                    removeSet={removeSet}
                                    addWarmupSet={addWarmupSet}
                                    addEmptySets={addEmptySets}
                                    onCollapse={() => setExpandedLogId(null)}
                                />
                            ) : (
                                <CollapsedExerciseCard
                                    log={log}
                                    exerciseName={exerciseMap[log.exerciseId]?.name ?? log.exerciseId}
                                    onExpand={() => setExpandedLogId(log.id)}
                                />
                            )}
                        </View>
                    ))}

                    {/* ── Session Notes ─────────────────────────── */}
                    <View className="mt-3 mb-2 rounded-2xl border border-white/10 bg-white/[0.07] p-4">
                        <View className="flex-row items-center mb-2">
                            <Ionicons name="pencil-outline" size={14} color="#8E8E93" style={{ marginRight: 6 }} />
                            <Text className="text-[#8E8E93] text-xs font-outfit-semibold tracking-widest">
                                SESSION NOTES
                            </Text>
                        </View>
                        <TextInput
                            multiline
                            placeholder="How did it feel? Any PRs, injuries, notes..."
                            placeholderTextColor="#4A4A4E"
                            value={activeSession.notes ?? ''}
                            onChangeText={setSessionNotes}
                            style={styles.notesInput}
                        />
                    </View>

                    {/* ── + Add Exercise button ──────────────────── */}
                    <Pressable
                        onPress={() => setIsPickerVisible(true)}
                        className="mt-2 mb-4 border border-[#FF6000] rounded-full py-2.5 items-center active:opacity-70"
                    >
                        <Text className="text-[#FF6000] font-bold text-sm">+ Add Exercise</Text>
                    </Pressable>
                </ScrollView>

            </SafeAreaView>

            {/* ── REST TIMER ──────────────────────────────────── */}
            <View style={{ position: 'absolute', left: 16, right: 16, bottom: insets.bottom + 150 }}>
                <RestTimer
                    duration={restTimerDuration}
                    isRunning={isRestTimerRunning}
                    onDismiss={() => setIsRestTimerRunning(false)}
                />
            </View>

            {/* ── SECTION 5 — BOTTOM BUTTON ───────────────────── */}
            <View style={[styles.bottomBar, { bottom: insets.bottom + 90 }]}>
                <Pressable
                    onPress={() => setIsFinishModalVisible(true)}
                    style={styles.finishBtn}
                    className="flex-1 active:opacity-80"
                >
                    <Ionicons name="checkmark-circle-outline" size={18} color="white" style={{ marginRight: 6 }} />
                    <Text className="text-white font-bold text-base">Finish Workout</Text>
                </Pressable>
            </View>

            {/* ── FINISH CONFIRMATION MODAL ──────────────────── */}
            {isFinishModalVisible && (
                <Animated.View style={[StyleSheet.absoluteFill, styles.modalOverlay, animatedOverlayStyle]}>
                    <Animated.View style={[styles.modalCard, animatedCardStyle]}>
                        <Ionicons name="flag" size={32} color="#FF6000" style={{ marginBottom: 12 }} />
                        <Text className="text-white text-xl font-bold mb-1">Finish Workout?</Text>
                        <Text className="text-[#8E8E93] text-sm mb-1">{activeSession?.name}</Text>
                        <View className="flex-row gap-6 mt-2 mb-6">
                            <View className="items-center">
                                <Text className="text-[#FF6000] text-lg font-bold">{formatTimer(elapsed)}</Text>
                                <Text className="text-[#8E8E93] text-xs mt-0.5">Time</Text>
                            </View>
                            <View className="items-center">
                                <Text className="text-[#FF6000] text-lg font-bold">{formatVolume(liveVolume)}</Text>
                                <Text className="text-[#8E8E93] text-xs mt-0.5">Total Volume</Text>
                            </View>
                        </View>
                        <Pressable
                            onPress={handleFinish}
                            style={styles.finishBtn}
                            className="w-full active:opacity-80 mb-3"
                        >
                            <Ionicons name="checkmark-circle-outline" size={18} color="white" style={{ marginRight: 6 }} />
                            <Text className="text-white font-bold text-base">Finish</Text>
                        </Pressable>
                        <Pressable
                            onPress={() => setIsFinishModalVisible(false)}
                            style={styles.continueBtn}
                            className="w-full active:opacity-70"
                        >
                            <Text className="text-white font-semibold text-base">Continue</Text>
                        </Pressable>
                    </Animated.View>
                </Animated.View>
            )}

            {/* ── EXERCISE PICKER MODAL ──────────────────────── */}
            <ExercisePickerModal
                isVisible={isPickerVisible}
                onClose={() => setIsPickerVisible(false)}
                onSelectExercise={handleExerciseSelect}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    root: {
        flex: 1,
        backgroundColor: '#0A0A0A',
    },
    iconBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.1)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    bottomBar: {
        position: 'absolute',
        left: 16,
        right: 16,
        flexDirection: 'row',
        backgroundColor: 'transparent',
    },
    timer: {
        fontSize: 56,
        fontFamily: 'Outfit_700Bold',
        letterSpacing: 4,
        color: '#FF6000',
    },
    volume: {
        fontSize: 28,
        fontFamily: 'Outfit_700Bold',
        color: 'white',
        marginTop: 8,
    },
    finishBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 999,
        paddingVertical: 14,
        backgroundColor: '#FF6000',
        shadowColor: '#FF6000',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.45,
        shadowRadius: 14,
        elevation: 8,
    },
    notesInput: {
        color: 'white',
        fontFamily: 'Outfit_400Regular',
        fontSize: 14,
        minHeight: 60,
        textAlignVertical: 'top',
    },
    continueBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 999,
        paddingVertical: 14,
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.18)',
    },
    modalOverlay: {
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.65)',
        zIndex: 99,
    },
    modalCard: {
        width: '82%',
        backgroundColor: 'rgba(28,28,30,0.95)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        borderRadius: 24,
        padding: 28,
        alignItems: 'center',
    },
});
