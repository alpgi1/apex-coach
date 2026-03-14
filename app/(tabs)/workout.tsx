import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
    Pressable,
    ScrollView,
    Text,
    TextInput,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import ExercisePickerModal from '../../src/components/workout/ExercisePickerModal';
import { useProgressiveOverload } from '../../src/hooks/useProgressiveOverload';
import { useWorkoutSession } from '../../src/hooks/useWorkoutSession';
import { useUserStore } from '../../src/store/userStore';
import { ExerciseMetadata } from '../../src/types/exercise.types';
import { RPEScale } from '../../src/types/workout.types';

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
        logSet,
        completeSet,
        finishWorkout,
    } = useWorkoutSession();

    const { suggestion, fetchSuggestion } = useProgressiveOverload();
    const { targetRIR } = useUserStore();

    /* ── timer ────────────────────────────────────────────────── */
    const [elapsed, setElapsed] = useState<number>(0);

    useEffect(() => {
        if (!isWorkoutActive || !activeSession) {
            setElapsed(0);
            return;
        }

        const start = new Date(activeSession.startTime).getTime();
        // Initialise immediately so first render is accurate
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

    /* ── current exercise index ──────────────────────────────── */
    const [currentExerciseIdx, setCurrentExerciseIdx] = useState<number>(0);
    const [isPickerVisible, setIsPickerVisible] = useState<boolean>(false);
    const [exerciseMap, setExerciseMap] = useState<Record<string, ExerciseMetadata>>({});
    const currentLog = activeSession?.logs[currentExerciseIdx] ?? null;
    const nextLog = activeSession?.logs[currentExerciseIdx + 1] ?? null;

    /* ── draft inputs per exercise-log (keyed by exerciseLog.id) */
    const [drafts, setDrafts] = useState<Record<string, SetRowDraft>>({});

    const getDraft = (logId: string): SetRowDraft =>
        drafts[logId] ?? { weight: '', reps: '', rpe: '' };

    const updateDraft = (logId: string, field: keyof SetRowDraft, value: string) => {
        setDrafts((prev) => ({
            ...prev,
            [logId]: { ...getDraft(logId), [field]: value },
        }));
    };

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
    const handleAddSet = (exerciseLogId: string) => {
        const draft = getDraft(exerciseLogId);
        const weight = parseFloat(draft.weight);
        const reps = parseInt(draft.reps, 10);
        const rpe = parseFloat(draft.rpe);

        if (isNaN(weight) || isNaN(reps)) return;

        logSet(
            exerciseLogId,
            weight,
            reps,
            isNaN(rpe) ? 8 : (rpe as RPEScale)
        );

        // Clear the draft
        setDrafts((prev) => ({
            ...prev,
            [exerciseLogId]: { weight: '', reps: '', rpe: '' },
        }));
    };

    const handleCompleteSet = (exerciseLogId: string, setId: string) => {
        completeSet(exerciseLogId, setId);
    };

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
            <SafeAreaView className="flex-1 bg-[#1A1A1A] justify-center items-center px-6">
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
        );
    }

    /* ═══════════════════ ACTIVE SESSION UI ═══════════════════ */
    return (
        <SafeAreaView className="flex-1 bg-[#1A1A1A]">
            {/* ── SECTION 1 — TOP BAR ───────────────────────── */}
            <View className="flex-row items-center justify-between px-4 py-3">
                <Pressable
                    onPress={() => router.back()}
                    className="w-10 h-10 items-center justify-center rounded-full bg-[#242424] active:opacity-70"
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

                <Pressable className="w-10 h-10 items-center justify-center rounded-full bg-[#242424] active:opacity-70">
                    <Ionicons name="ellipsis-horizontal" size={22} color="#FFFFFF" />
                </Pressable>
            </View>

            <ScrollView
                className="flex-1"
                contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 128 }}
                showsVerticalScrollIndicator={false}
            >
                {/* ── SECTION 2 — TIMER + VOLUME ────────────── */}
                <View className="items-center mt-2 mb-6">
                    <Text className="text-[#FF6000] text-5xl font-bold tracking-wider">
                        {formatTimer(elapsed)}
                    </Text>
                    <Text className="text-white text-2xl font-bold mt-2">
                        {formatVolume(liveVolume)}
                    </Text>
                    <Text className="text-[#8E8E93] text-xs tracking-widest mt-1">
                        LIVE TOTAL VOLUME
                    </Text>
                </View>

                {/* ── SECTION 3 — EXERCISE CARD ─────────────── */}
                {currentLog && (
                    <View className="bg-[#242424] rounded-2xl p-4 mb-4">
                        {/* Exercise header */}
                        <View className="flex-row items-center justify-between mb-2">
                            <Text className="text-white text-lg font-bold flex-1 mr-2">
                                {exerciseMap[currentLog.exerciseId]?.name ?? currentLog.exerciseId}
                            </Text>
                            <View className="bg-[#3A3A3C] rounded-full px-3 py-1">
                                <Text className="text-[#8E8E93] text-xs font-semibold">
                                    WORKING
                                </Text>
                            </View>
                        </View>

                        {/* Progressive overload suggestion */}
                        {suggestion && suggestion.exerciseId === currentLog.exerciseId && (
                            <Text className="text-[#FF6000] text-sm mb-3">
                                Suggested: {suggestion.suggestedWeightKg}kg x{' '}
                                {suggestion.suggestedRepsMin}-{suggestion.suggestedRepsMax} @ RPE {10 - targetRIR}
                            </Text>
                        )}

                        {/* Set table header */}
                        <View className="flex-row items-center mb-2 px-1">
                            <Text className="text-[#8E8E93] text-xs font-semibold w-10">
                                SET
                            </Text>
                            <Text className="text-[#8E8E93] text-xs font-semibold flex-1 text-center">
                                KG
                            </Text>
                            <Text className="text-[#8E8E93] text-xs font-semibold flex-1 text-center">
                                REPS
                            </Text>
                            <Text className="text-[#8E8E93] text-xs font-semibold flex-1 text-center">
                                RPE
                            </Text>
                            <Text className="text-[#8E8E93] text-xs font-semibold w-10 text-center">
                                ✓
                            </Text>
                        </View>

                        {/* Completed / logged sets */}
                        {currentLog.sets.map((s) => (
                            <View
                                key={s.id}
                                className="flex-row items-center py-2 px-1 border-b border-[#3A3A3C]"
                            >
                                <Text
                                    className={`w-10 font-bold ${s.isCompleted ? 'text-white' : 'text-[#FF6000]'
                                        }`}
                                >
                                    {s.setNumber}
                                </Text>
                                <Text className="flex-1 text-white text-center">
                                    {s.weightKg}
                                </Text>
                                <Text className="flex-1 text-white text-center">
                                    {s.reps}
                                </Text>
                                <Text
                                    className={`flex-1 text-center font-semibold ${rpeColor(
                                        s.rpe
                                    )}`}
                                >
                                    {s.rpe ?? '-'}
                                </Text>

                                {/* Complete checkbox */}
                                <Pressable
                                    onPress={() =>
                                        !s.isCompleted &&
                                        handleCompleteSet(currentLog.id, s.id)
                                    }
                                    className="w-10 items-center"
                                >
                                    <View
                                        className={`w-7 h-7 rounded-full items-center justify-center ${s.isCompleted
                                            ? 'bg-[#FF6000]'
                                            : 'border-2 border-[#3A3A3C]'
                                            }`}
                                    >
                                        {s.isCompleted && (
                                            <Ionicons
                                                name="checkmark"
                                                size={16}
                                                color="#FFFFFF"
                                            />
                                        )}
                                    </View>
                                </Pressable>
                            </View>
                        ))}

                        {/* Active input row for new set */}
                        <View className="flex-row items-center py-3 px-1">
                            <Text className="text-[#FF6000] font-bold w-10">
                                {currentLog.sets.length + 1}
                            </Text>
                            <TextInput
                                className="flex-1 bg-[#1A1A1A] rounded-lg text-white text-center py-2 mx-1"
                                placeholder="kg"
                                placeholderTextColor="#8E8E93"
                                keyboardType="numeric"
                                value={getDraft(currentLog.id).weight}
                                onChangeText={(v) =>
                                    updateDraft(currentLog.id, 'weight', v)
                                }
                            />
                            <TextInput
                                className="flex-1 bg-[#1A1A1A] rounded-lg text-white text-center py-2 mx-1"
                                placeholder="reps"
                                placeholderTextColor="#8E8E93"
                                keyboardType="numeric"
                                value={getDraft(currentLog.id).reps}
                                onChangeText={(v) =>
                                    updateDraft(currentLog.id, 'reps', v)
                                }
                            />
                            <TextInput
                                className="flex-1 bg-[#1A1A1A] rounded-lg text-white text-center py-2 mx-1"
                                placeholder="rpe"
                                placeholderTextColor="#8E8E93"
                                keyboardType="numeric"
                                value={getDraft(currentLog.id).rpe}
                                onChangeText={(v) =>
                                    updateDraft(currentLog.id, 'rpe', v)
                                }
                            />
                            <View className="w-10" />
                        </View>

                        {/* + Add Set button */}
                        <Pressable
                            onPress={() => handleAddSet(currentLog.id)}
                            className="mt-2 border border-[#FF6000] rounded-full py-2.5 items-center active:opacity-70"
                        >
                            <Text className="text-[#FF6000] font-bold text-sm">
                                + Add Set
                            </Text>
                        </Pressable>
                    </View>
                )}

                {/* ── + Add Exercise button ──────────────────── */}
                <Pressable
                    onPress={() => setIsPickerVisible(true)}
                    className="mt-2 mb-4 border border-[#FF6000] rounded-full py-2.5 items-center active:opacity-70"
                >
                    <Text className="text-[#FF6000] font-bold text-sm">
                        + Add Exercise
                    </Text>
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
                        <Ionicons
                            name="chevron-forward"
                            size={14}
                            color="#8E8E93"
                        />
                        <Ionicons
                            name="chevron-forward"
                            size={14}
                            color="#8E8E93"
                            style={{ marginLeft: -6 }}
                        />
                    </Pressable>
                )}
            </ScrollView>

            {/* ── SECTION 5 — BOTTOM BUTTONS ────────────────── */}
            <View className="absolute bottom-0 left-0 right-0 bg-[#1A1A1A] px-4 pb-8 pt-3 flex-row gap-3">
                <Pressable
                    onPress={handleNextExercise}
                    className="flex-1 bg-[#007AFF] rounded-full py-3.5 items-center active:opacity-80"
                >
                    <Text className="text-white font-bold text-base">
                        Next Exercise
                    </Text>
                </Pressable>
                <Pressable
                    onPress={handleFinish}
                    className="flex-1 bg-[#FF6000] rounded-full py-3.5 items-center active:opacity-80"
                >
                    <Text className="text-white font-bold text-base">
                        Finish Workout
                    </Text>
                </Pressable>
            </View>

            {/* ── EXERCISE PICKER MODAL ──────────────────────── */}
            <ExercisePickerModal
                isVisible={isPickerVisible}
                onClose={() => setIsPickerVisible(false)}
                onSelectExercise={handleExerciseSelect}
            />
        </SafeAreaView>
    );
}