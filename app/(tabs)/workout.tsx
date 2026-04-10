import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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

import DraggableExerciseList from '../../src/components/workout/DraggableExerciseList';
import ExerciseCard, { type SetRowDraft } from '../../src/components/workout/ExerciseCard';
import ExercisePickerModal from '../../src/components/workout/ExercisePickerModal';
import StartWorkoutModal from '../../src/components/workout/StartWorkoutModal';
import RestTimer from '../../src/components/workout/RestTimer';
import { useProgressiveOverload } from '../../src/hooks/useProgressiveOverload';
import { useWorkoutSession } from '../../src/hooks/useWorkoutSession';
import { getExerciseById } from '../../src/services/storage/exerciseStorage';
import { getAllTemplates, deleteTemplate as deleteTemplateLocal } from '../../src/services/storage/templateStorage';
import { deleteTemplate as deleteTemplateApi } from '../../src/services/api/templateApi';
import { FEATURED_PLANS } from '../../src/data/featuredPlans';
import { getWorkoutHistory } from '../../src/services/storage/workoutStorage';
import { useUserStore } from '../../src/store/userStore';
import { ExerciseMetadata } from '../../src/types/exercise.types';
import { WorkoutSet, WorkoutTemplate } from '../../src/types/workout.types';
import { formatTimer, formatVolume } from '../../src/utils/formatters';

/* ──────────────────────── main screen ─────────────────────────── */

export default function WorkoutScreen() {
    const router = useRouter();
    const {
        activeSession,
        isWorkoutActive,
        startWorkout,
        addExercise,
        addWarmupSet,
        addDropSet,
        addEmptySets,
        completeSet,
        updateSetValues,
        removeSet,
        removeLog,
        finishWorkout,
        setSessionNotes,
        reorderLogs,
    } = useWorkoutSession();

    const { suggestion, fetchSuggestion } = useProgressiveOverload();
    const { targetRIR, restTimerDuration, autoStartRestTimer } = useUserStore();

    /* ── inactive: templates + history ────────────────────────── */
    const [inactiveTemplates, setInactiveTemplates] = useState<WorkoutTemplate[]>([]);
    const [weeklyCount, setWeeklyCount] = useState(0);
    const [isStartModalVisible, setIsStartModalVisible] = useState(false);

    useFocusEffect(
        useCallback(() => {
            if (!isWorkoutActive) {
                getAllTemplates().then(setInactiveTemplates).catch(() => {});
                getWorkoutHistory().then((history) => {
                    const monday = new Date();
                    monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));
                    monday.setHours(0, 0, 0, 0);
                    setWeeklyCount(history.filter((s) => new Date(s.startTime) >= monday).length);
                }).catch(() => {});
            }
        }, [isWorkoutActive])
    );

    const handleWorkoutStart = async (workoutName: string, template?: WorkoutTemplate) => {
        if (template) {
            const loaded = await Promise.all(template.exercises.map((te) => getExerciseById(te.exerciseId)));
            const newMap: Record<string, ExerciseMetadata> = {};
            for (const ex of loaded) { if (ex) newMap[ex.id] = ex; }
            setExerciseMap((prev) => ({ ...prev, ...newMap }));
        }
        startWorkout(workoutName);
        if (template) {
            for (const te of template.exercises) {
                const logId = addExercise(te.exerciseId);
                addEmptySets(logId, te.targetSets, te.targetWeightKg);
            }
        }
        setIsStartModalVisible(false);
    };

    const handleStartFromTemplate = async (template: WorkoutTemplate) => {
        const loaded = await Promise.all(template.exercises.map((te) => getExerciseById(te.exerciseId)));
        const newMap: Record<string, ExerciseMetadata> = {};
        for (const ex of loaded) { if (ex) newMap[ex.id] = ex; }
        setExerciseMap((prev) => ({ ...prev, ...newMap }));
        startWorkout(template.name);
        for (const te of template.exercises) {
            const logId = addExercise(te.exerciseId);
            addEmptySets(logId, te.targetSets, te.targetWeightKg);
        }
    };

    const handleInactiveDeleteTemplate = (id: string) => {
        Alert.alert('Delete Template', 'Are you sure you want to delete this template?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Delete', style: 'destructive',
                onPress: async () => {
                    await deleteTemplateLocal(id).catch(() => {});
                    setInactiveTemplates((prev) => prev.filter((t) => t.id !== id));
                    deleteTemplateApi(id).catch(() => {});
                },
            },
        ]);
    };

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
                if (s.isCompleted && (s.setType === 'WORKING' || s.setType === 'DROP')) {
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
        setDrafts((prev) => {
            if (prev[setId]) {
                return { ...prev, [setId]: { ...prev[setId], [field]: value } };
            }
            // Draft not yet initialized — seed from actual set to preserve pre-filled values (e.g. drop set weight)
            const set = activeSession?.logs.flatMap((l) => l.sets).find((s) => s.id === setId);
            const seed: SetRowDraft = {
                weight: set && set.weightKg > 0 ? String(set.weightKg) : '',
                reps: set && set.reps > 0 ? String(set.reps) : '',
                rpe: set?.rpe != null ? String(set.rpe) : '',
            };
            return { ...prev, [setId]: { ...seed, [field]: value } };
        });
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
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
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
                <SafeAreaView edges={['top']} style={{ flex: 1 }}>
                    {/* ── HEADER ── */}
                    <View style={styles.inactiveHeader}>
                        <View>
                            <Text style={styles.inactiveTitle}>Workout</Text>
                            {weeklyCount > 0 && (
                                <View style={styles.weeklyStrip}>
                                    <Ionicons name="flame" size={12} color="#FF6000" />
                                    <Text style={styles.weeklyStripText}>
                                        {weeklyCount} workout{weeklyCount !== 1 ? 's' : ''} this week
                                    </Text>
                                </View>
                            )}
                        </View>
                        <Pressable
                            onPress={() => router.push('/template/create' as any)}
                            style={styles.inactiveNewBtn}
                            className="active:opacity-70"
                        >
                            <Ionicons name="add" size={16} color="#FF6000" />
                            <Text style={styles.inactiveNewBtnText}>New Plan</Text>
                        </Pressable>
                    </View>

                    <ScrollView
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 110 }}
                    >
                        {/* ── MY PLANS ── */}
                        <Text style={[styles.inactiveSectionLabel, { marginBottom: 10 }]}>MY PLANS</Text>

                        {inactiveTemplates.length === 0 ? (
                            <View style={[styles.inactiveCard, { alignItems: 'center', paddingVertical: 32 }]}>
                                <Ionicons name="clipboard-outline" size={36} color="rgba(255,255,255,0.15)" />
                                <Text style={{ color: 'rgba(255,255,255,0.3)', fontSize: 14, fontFamily: 'Outfit_500Medium', marginTop: 10 }}>
                                    No plans yet
                                </Text>
                                <Pressable
                                    onPress={() => router.push('/template/create' as any)}
                                    style={[styles.inactiveStartChip, { marginTop: 14, paddingHorizontal: 16, paddingVertical: 8 }]}
                                    className="active:opacity-70"
                                >
                                    <Ionicons name="add" size={14} color="#FF6000" />
                                    <Text style={[styles.inactiveStartChipText, { fontSize: 13 }]}>Create your first plan</Text>
                                </Pressable>
                            </View>
                        ) : (
                            inactiveTemplates.map((template) => (
                                <Pressable
                                    key={template.id}
                                    onPress={() => router.push(('/template/' + template.id) as any)}
                                    style={styles.planCard}
                                    className="active:opacity-90"
                                >
                                    <View style={{ flex: 1 }}>
                                        <Text style={styles.planCardName}>{template.name}</Text>
                                        <Text style={styles.planCardSub}>
                                            {template.exercises.length} exercise{template.exercises.length !== 1 ? 's' : ''}
                                        </Text>
                                    </View>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                        <Pressable
                                            onPress={() => handleStartFromTemplate(template)}
                                            style={styles.planStartBtn}
                                            className="active:opacity-70"
                                            hitSlop={8}
                                        >
                                            <Ionicons name="play" size={14} color="#FFFFFF" />
                                            <Text style={styles.planStartBtnText}>Start</Text>
                                        </Pressable>
                                        <Pressable
                                            onPress={() => handleInactiveDeleteTemplate(template.id)}
                                            style={{ width: 32, height: 32, alignItems: 'center', justifyContent: 'center' }}
                                            className="active:opacity-70"
                                            hitSlop={8}
                                        >
                                            <Ionicons name="trash-outline" size={16} color="rgba(255,59,48,0.6)" />
                                        </Pressable>
                                    </View>
                                </Pressable>
                            ))
                        )}

                        {/* ── PROGRAMS ── */}
                        <Text style={[styles.inactiveSectionLabel, { marginTop: 20, marginBottom: 10 }]}>PROGRAMS</Text>
                        <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={{ gap: 10, paddingRight: 16 }}
                            style={{ marginHorizontal: -16, paddingLeft: 16, marginBottom: 20 }}
                        >
                            {FEATURED_PLANS.map((plan) => (
                                <Pressable
                                    key={plan.id}
                                    onPress={() => router.push((`/featured-plan/${plan.id}`) as any)}
                                    style={[styles.programCard, { borderColor: plan.color + '33' }]}
                                    className="active:opacity-80"
                                >
                                    <View style={[styles.programIcon, { backgroundColor: plan.color + '22' }]}>
                                        <Text style={[styles.programAbbreviation, { color: plan.color }]}>{plan.abbreviation}</Text>
                                    </View>
                                    <Text style={styles.programName}>{plan.name}</Text>
                                    <View style={[styles.programTag, { backgroundColor: plan.color + '18', borderColor: plan.color + '33' }]}>
                                        <Text style={[styles.programTagText, { color: plan.color }]}>{plan.tag}</Text>
                                    </View>
                                    <Text style={styles.programDays}>{plan.daysPerWeek}×/week</Text>
                                </Pressable>
                            ))}
                        </ScrollView>

                        {/* ── EXPLORE ── */}
                        <Text style={[styles.inactiveSectionLabel, { marginTop: 0, marginBottom: 10 }]}>EXPLORE</Text>
                        <View style={styles.inactiveCard}>
                            <Pressable
                                onPress={() => router.push('/exercises' as any)}
                                style={styles.inactiveRow}
                                className="active:opacity-70"
                            >
                                <View style={[styles.inactiveIcon, { backgroundColor: 'rgba(0,201,167,0.12)' }]}>
                                    <Ionicons name="fitness-outline" size={20} color="#00C9A7" />
                                </View>
                                <Text style={styles.inactiveRowLabel}>Exercise Library</Text>
                                <Ionicons name="chevron-forward" size={18} color="rgba(255,255,255,0.3)" />
                            </Pressable>
                        </View>
                    </ScrollView>
                </SafeAreaView>

                <StartWorkoutModal
                    isVisible={isStartModalVisible}
                    onClose={() => setIsStartModalVisible(false)}
                    onStart={handleWorkoutStart}
                />
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

                </View>

                <ScrollView
                    ref={scrollRef}
                    className="flex-1"
                    contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: (isRestTimerRunning ? 230 : 160) + insets.bottom }}
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
                            {formatVolume(liveVolume)} kg
                        </Text>
                        <Text className="text-[#8E8E93] text-xs tracking-widest mt-1">
                            LIVE TOTAL VOLUME
                        </Text>
                    </View>

                    {/* ── SECTION 3 — EXERCISE LIST ────────────────── */}
                    <DraggableExerciseList
                        logs={activeSession.logs}
                        expandedLogId={expandedLogId}
                        exerciseMap={exerciseMap}
                        suggestion={suggestion}
                        targetRIR={targetRIR}
                        cardPositions={cardPositions}
                        getDraft={getDraft}
                        updateDraft={updateDraft}
                        tryAutoComplete={tryAutoComplete}
                        completeSet={completeSet}
                        updateSetValues={updateSetValues}
                        removeSet={removeSet}
                        addWarmupSet={addWarmupSet}
                        addDropSet={addDropSet}
                        addEmptySets={addEmptySets}
                        onExpand={(id) => setExpandedLogId(id)}
                        onCollapse={() => setExpandedLogId(null)}
                        onReorder={reorderLogs}
                        onRemoveLog={removeLog}
                    />

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
                                <Text className="text-[#FF6000] text-lg font-bold">{formatVolume(liveVolume)} kg</Text>
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
    /* ── inactive state ── */
    inactiveHeader: {
        paddingHorizontal: 20,
        paddingTop: 8,
        paddingBottom: 16,
        flexDirection: 'row',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
    },
    inactiveTitle: {
        color: '#FFFFFF',
        fontSize: 28,
        fontFamily: 'Outfit_700Bold',
        marginBottom: 6,
    },
    weeklyStrip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    weeklyStripText: {
        color: 'rgba(255,255,255,0.4)',
        fontSize: 12,
        fontFamily: 'Outfit_500Medium',
    },
    inactiveNewBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        borderWidth: 1,
        borderColor: 'rgba(255,96,0,0.35)',
        borderRadius: 20,
        paddingHorizontal: 12,
        paddingVertical: 6,
        marginTop: 6,
    },
    inactiveNewBtnText: {
        color: '#FF6000',
        fontSize: 13,
        fontFamily: 'Outfit_600SemiBold',
    },
    inactiveStartChip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        borderWidth: 1,
        borderColor: 'rgba(255,96,0,0.35)',
        borderRadius: 20,
        paddingHorizontal: 10,
        paddingVertical: 5,
    },
    inactiveStartChipText: {
        color: '#FF6000',
        fontSize: 12,
        fontFamily: 'Outfit_600SemiBold',
    },
    planCard: {
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
        borderRadius: 16,
        paddingHorizontal: 16,
        paddingVertical: 16,
        marginBottom: 10,
        flexDirection: 'row',
        alignItems: 'center',
    },
    planCardName: {
        color: '#FFFFFF',
        fontSize: 17,
        fontFamily: 'Outfit_600SemiBold',
        marginBottom: 4,
    },
    planCardSub: {
        color: 'rgba(255,255,255,0.4)',
        fontSize: 13,
        fontFamily: 'Outfit_400Regular',
    },
    planStartBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        backgroundColor: '#FF6000',
        borderRadius: 20,
        paddingHorizontal: 14,
        paddingVertical: 8,
    },
    planStartBtnText: {
        color: '#FFFFFF',
        fontSize: 13,
        fontFamily: 'Outfit_700Bold',
    },
    inactiveCard: {
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
        borderRadius: 16,
        paddingHorizontal: 16,
        paddingVertical: 12,
        marginBottom: 12,
    },
    inactiveSectionLabel: {
        color: 'rgba(255,255,255,0.35)',
        fontSize: 11,
        fontFamily: 'Outfit_600SemiBold',
        letterSpacing: 1,
        textTransform: 'uppercase',
        marginBottom: 8,
    },
    inactiveRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingVertical: 4,
    },
    inactiveIcon: {
        width: 36,
        height: 36,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
    },
    inactiveRowLabel: {
        flex: 1,
        color: '#FFFFFF',
        fontSize: 15,
        fontFamily: 'Outfit_500Medium',
    },
    inactiveTemplateRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
    },
    programCard: {
        width: 130,
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderWidth: 1,
        borderRadius: 16,
        padding: 14,
        gap: 6,
        alignItems: 'center',
    },
    programIcon: {
        width: 42, height: 42, borderRadius: 12,
        alignItems: 'center', justifyContent: 'center',
        marginBottom: 2,
    },
    programAbbreviation: {
        fontSize: 16,
        fontFamily: 'Outfit_700Bold',
        fontStyle: 'italic',
        letterSpacing: 0.5,
        textAlign: 'center',
    },
    programName: {
        color: '#FFFFFF',
        fontSize: 14, fontFamily: 'Outfit_600SemiBold',
        lineHeight: 18,
        textAlign: 'center',
    },
    programTag: {
        alignSelf: 'center',
        borderWidth: 1,
        borderRadius: 6,
        paddingHorizontal: 6,
        paddingVertical: 2,
    },
    programTagText: {
        fontSize: 10, fontFamily: 'Outfit_600SemiBold',
        textAlign: 'center',
    },
    programDays: {
        color: 'rgba(255,255,255,0.3)',
        fontSize: 11, fontFamily: 'Outfit_500Medium',
        textAlign: 'center',
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
