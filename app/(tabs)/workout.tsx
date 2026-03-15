import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import AnimatedBackground from '../../src/components/layout/AnimatedBackground';

import ExercisePickerModal from '../../src/components/workout/ExercisePickerModal';
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

const rpeColor = (rpe: number | undefined): string => {
    if (rpe === undefined) return 'text-white';
    if (rpe <= 7) return 'text-green-400';
    if (rpe <= 8.5) return 'text-yellow-400';
    return 'text-red-400';
};

/* ──────────────────────── set-input row ────────────────────────── */

interface SetRowDraft {
    weight: string;
    reps: string;
    rpe: string;
}

/* ──────────────────────── main screen ─────────────────────────── */

export default function WorkoutScreen() {
    const router = useRouter();
    const {
        activeSession,
        isWorkoutActive,
        addExercise,
        addEmptySets,
        completeSet,
        updateSetValues,
        finishWorkout,
    } = useWorkoutSession();

    const { suggestion, fetchSuggestion } = useProgressiveOverload();
    const { targetRIR } = useUserStore();
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

    /* ── reset exercise index when session changes ───────────── */
    useEffect(() => {
        setCurrentExerciseIdx(0);
    }, [activeSession?.id]);

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

    /* ── current exercise index ──────────────────────────────── */
    const [currentExerciseIdx, setCurrentExerciseIdx] = useState<number>(0);
    const [isPickerVisible, setIsPickerVisible] = useState<boolean>(false);
    const [exerciseMap, setExerciseMap] = useState<Record<string, ExerciseMetadata>>({});
    const currentLog = activeSession?.logs[currentExerciseIdx] ?? null;
    const nextLog = activeSession?.logs[currentExerciseIdx + 1] ?? null;

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

    /* ── fetch suggestion when exercise changes ──────────────── */
    useEffect(() => {
        if (currentLog) {
            const exercise = exerciseMap[currentLog.exerciseId];
            fetchSuggestion(
                currentLog.exerciseId,
                10 - targetRIR,
                exercise?.idealRepsMin ?? 5,
                exercise?.idealRepsMax ?? 10
            );
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentLog?.exerciseId, targetRIR]);

    /* ── handlers ────────────────────────────────────────────── */
    const handleNextExercise = () => {
        if (activeSession && currentExerciseIdx < activeSession.logs.length - 1) {
            setCurrentExerciseIdx((prev) => prev + 1);
        }
    };

    const handleExerciseSelect = (exercise: ExerciseMetadata) => {
        addExercise(exercise.id);
        setExerciseMap((prev) => ({ ...prev, [exercise.id]: exercise }));
    };

    const handleFinish = async () => {
        await finishWorkout();
        router.replace('/(tabs)');
    };

    /* ══════════════════ NO ACTIVE SESSION STATE ══════════════ */
    if (!isWorkoutActive || !activeSession) {
        return (
            <View style={styles.root}>
                <AnimatedBackground />
                <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24 }}>
                    <Ionicons name="barbell-outline" size={64} color="#8E8E93" />
                    <Text className="text-white text-xl font-bold mt-4 text-center">
                        No Active Session
                    </Text>
                    <Text className="text-[#8E8E93] text-sm mt-2 text-center">
                        Start a workout from the dashboard
                    </Text>
                    <Pressable
                        onPress={() => router.replace('/(tabs)')}
                        className="mt-6 bg-[#FF6000] rounded-full px-8 py-3 active:opacity-80"
                    >
                        <Text className="text-white font-bold text-base">
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
                        <Text className="text-white text-lg font-bold">
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
                    className="flex-1"
                    contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 80 + insets.bottom }}
                    showsVerticalScrollIndicator={false}
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

                    {/* ── SECTION 3 — EXERCISE CARD ─────────────── */}
                    {currentLog && (
                        <View style={styles.card} className="p-4 mb-4">
                            {/* Exercise header */}
                            <View className="flex-row items-center justify-between mb-2">
                                <Text className="text-white text-lg font-bold flex-1 mr-2">
                                    {exerciseMap[currentLog.exerciseId]?.name ?? currentLog.exerciseId}
                                </Text>
                                <View style={styles.workingBadge}>
                                    <Text className="text-[#8E8E93] text-xs font-semibold">
                                        WORKING
                                    </Text>
                                </View>
                            </View>

                            {/* Progressive overload suggestion */}
                            {suggestion && suggestion.exerciseId === currentLog.exerciseId && (
                                <View className="mb-3">
                                    <Text className="text-[#FF6000] text-sm font-semibold">
                                        Suggested: {suggestion.suggestedWeightKg}kg x{' '}
                                        {suggestion.suggestedRepsMin}-{suggestion.suggestedRepsMax} @ RPE {10 - targetRIR}
                                    </Text>
                                    <Text className="text-[#8E8E93] text-xs mt-0.5 italic">
                                        {suggestion.rationale}
                                    </Text>
                                </View>
                            )}

                            {/* Set table header */}
                            <View className="flex-row items-center mb-2 px-1">
                                <Text className="text-[#8E8E93] text-xs font-semibold w-10">SET</Text>
                                <Text className="text-[#8E8E93] text-xs font-semibold flex-1 text-center">KG</Text>
                                <Text className="text-[#8E8E93] text-xs font-semibold flex-1 text-center">REPS</Text>
                                <Text className="text-[#8E8E93] text-xs font-semibold flex-1 text-center">RPE</Text>
                                <Text className="text-[#8E8E93] text-xs font-semibold w-10 text-center">✓</Text>
                            </View>

                            {/* Inline editable set rows */}
                            {currentLog.sets.map((s) => {
                                const draft = getDraft(s);
                                return (
                                    <View
                                        key={s.id}
                                        className={`flex-row items-center py-2 px-1 border-b border-[#3A3A3C] ${s.isCompleted ? 'bg-green-500/5' : ''}`}
                                    >
                                        <Text className={`w-10 font-bold ${s.isCompleted ? 'text-white' : 'text-[#FF6000]'}`}>
                                            {s.setNumber}
                                        </Text>
                                        <TextInput
                                            style={styles.setInput}
                                            placeholder="kg"
                                            placeholderTextColor="#8E8E93"
                                            keyboardType="numeric"
                                            value={draft.weight}
                                            onChangeText={(v) => {
                                                updateDraft(s.id, 'weight', v);
                                                const w = parseFloat(v);
                                                const r = parseInt(draft.reps, 10);
                                                if (!isNaN(w) && !isNaN(r)) {
                                                    const rpe = parseFloat(draft.rpe);
                                                    updateSetValues(currentLog.id, s.id, w, r, isNaN(rpe) ? undefined : rpe);
                                                }
                                            }}
                                        />
                                        <TextInput
                                            style={styles.setInput}
                                            placeholder="reps"
                                            placeholderTextColor="#8E8E93"
                                            keyboardType="numeric"
                                            value={draft.reps}
                                            onChangeText={(v) => {
                                                updateDraft(s.id, 'reps', v);
                                                const w = parseFloat(draft.weight);
                                                const r = parseInt(v, 10);
                                                if (!isNaN(w) && !isNaN(r)) {
                                                    const rpe = parseFloat(draft.rpe);
                                                    updateSetValues(currentLog.id, s.id, w, r, isNaN(rpe) ? undefined : rpe);
                                                }
                                            }}
                                        />
                                        <TextInput
                                            style={[styles.setInput, { color: s.rpe === undefined ? 'white' : s.rpe <= 7 ? '#4ade80' : s.rpe <= 8.5 ? '#facc15' : '#f87171' }]}
                                            className={`flex-1 rounded-lg text-center py-2 mx-1 ${rpeColor(s.rpe)}`}
                                            placeholder="rpe"
                                            placeholderTextColor="#8E8E93"
                                            keyboardType="numeric"
                                            value={draft.rpe}
                                            onChangeText={(v) => {
                                                updateDraft(s.id, 'rpe', v);
                                                const w = parseFloat(draft.weight);
                                                const r = parseInt(draft.reps, 10);
                                                if (!isNaN(w) && !isNaN(r)) {
                                                    const rpe = parseFloat(v);
                                                    updateSetValues(currentLog.id, s.id, w, r, isNaN(rpe) ? undefined : rpe);
                                                }
                                            }}
                                        />
                                        <Pressable
                                            onPress={() => {
                                                if (!s.isCompleted) {
                                                    const w = parseFloat(draft.weight);
                                                    const r = parseInt(draft.reps, 10);
                                                    if (!isNaN(w) && !isNaN(r)) {
                                                        const rpe = parseFloat(draft.rpe);
                                                        updateSetValues(currentLog.id, s.id, w, r, isNaN(rpe) ? undefined : rpe);
                                                    }
                                                }
                                                completeSet(currentLog.id, s.id);
                                            }}
                                            className="w-10 items-center"
                                        >
                                            <View className={`w-7 h-7 rounded-full items-center justify-center ${s.isCompleted ? 'bg-[#FF6000]' : 'border-2 border-[#3A3A3C]'}`}>
                                                {s.isCompleted && (
                                                    <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                                                )}
                                            </View>
                                        </Pressable>
                                    </View>
                                );
                            })}

                            {/* + Add Set button */}
                            <Pressable
                                onPress={() => addEmptySets(currentLog.id, 1)}
                                className="mt-2 border border-[#FF6000] rounded-full py-2.5 items-center active:opacity-70"
                            >
                                <Text className="text-[#FF6000] font-bold text-sm">+ Add Set</Text>
                            </Pressable>
                        </View>
                    )}

                    {/* ── + Add Exercise button ──────────────────── */}
                    <Pressable
                        onPress={() => setIsPickerVisible(true)}
                        className="mt-2 mb-4 border border-[#FF6000] rounded-full py-2.5 items-center active:opacity-70"
                    >
                        <Text className="text-[#FF6000] font-bold text-sm">+ Add Exercise</Text>
                    </Pressable>

                    {/* ── SECTION 4 — NEXT EXERCISE ─────────────── */}
                    {nextLog && (
                        <Pressable
                            onPress={handleNextExercise}
                            className="flex-row items-center justify-center py-3 mb-2 active:opacity-70"
                        >
                            <Text className="text-[#8E8E93] text-sm">
                                Next: {exerciseMap[nextLog.exerciseId]?.name ?? nextLog.exerciseId}{' '}
                            </Text>
                            <Ionicons name="chevron-forward" size={14} color="#8E8E93" />
                            <Ionicons name="chevron-forward" size={14} color="#8E8E93" style={{ marginLeft: -6 }} />
                        </Pressable>
                    )}
                </ScrollView>

            </SafeAreaView>

            {/* ── SECTION 5 — BOTTOM BUTTONS ────────────────── */}
            <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 16 }]}>
                <Pressable
                    onPress={handleNextExercise}
                    className="flex-1 bg-[#007AFF] rounded-full py-3.5 items-center active:opacity-80"
                >
                    <Text className="text-white font-bold text-base">Next Exercise</Text>
                </Pressable>
                <Pressable
                    onPress={handleFinish}
                    className="flex-1 bg-[#FF6000] rounded-full py-3.5 items-center active:opacity-80"
                >
                    <Text className="text-white font-bold text-base">Finish Workout</Text>
                </Pressable>
            </View>

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
    card: {
        backgroundColor: 'rgba(255,255,255,0.07)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
        borderRadius: 16,
    },
    workingBadge: {
        backgroundColor: 'rgba(255,255,255,0.08)',
        borderRadius: 999,
        paddingHorizontal: 12,
        paddingVertical: 4,
    },
    setInput: {
        flex: 1,
        backgroundColor: 'rgba(255,255,255,0.06)',
        borderRadius: 8,
        color: 'white',
        textAlign: 'center',
        paddingVertical: 8,
        marginHorizontal: 4,
    },
    bottomBar: {
        position: 'absolute',
        bottom: 20,
        left: 0,
        right: 0,
        flexDirection: 'row',
        gap: 12,
        paddingHorizontal: 16,
        paddingTop: 12,
        backgroundColor: 'transparent',
    },
    timer: {
        fontSize: 56,
        fontWeight: 'bold',
        letterSpacing: 4,
        color: '#FF6000',
    },
    volume: {
        fontSize: 28,
        fontWeight: 'bold',
        color: 'white',
        marginTop: 8,
    },
});
