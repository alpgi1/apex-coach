import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useEffect } from 'react';
import {
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import ReanimatedSwipeable from 'react-native-gesture-handler/ReanimatedSwipeable';
import Animated, {
    type SharedValue,
    useAnimatedStyle,
    useSharedValue,
    withSequence,
    withSpring,
} from 'react-native-reanimated';
import { AICoachProgressionResponse } from '../../types/api.types';
import { ExerciseLog, WorkoutSet } from '../../types/workout.types';
import RPESelector from './RPESelector';

/* ──────────────── types shared with workout.tsx ──────────────── */

export interface SetRowDraft {
    weight: string;
    reps: string;
    rpe: string;
}

const WARMUP_COLOR = '#30D158';
const DROP_COLOR = '#5AC8FA'; // iOS system blue

const clampInput = (v: string, max: number): string => {
    const n = parseFloat(v);
    if (!isNaN(n) && n > max) return String(max);
    return v;
};

interface ExerciseCardProps {
    log: ExerciseLog;
    exerciseName: string;
    suggestion: AICoachProgressionResponse | null;
    targetRIR: number;
    getDraft: (s: WorkoutSet) => SetRowDraft;
    updateDraft: (setId: string, field: keyof SetRowDraft, value: string) => void;
    tryAutoComplete: (logId: string, setId: string, isCompleted: boolean, merged: SetRowDraft) => void;
    completeSet: (logId: string, setId: string) => void;
    updateSetValues: (logId: string, setId: string, w: number, r: number, rpe?: number) => void;
    removeSet: (logId: string, setId: string) => void;
    addWarmupSet: (logId: string) => void;
    addDropSet: (logId: string) => void;
    addEmptySets: (logId: string, count: number) => void;
    onCollapse: () => void;
}

/* ──────────────── swipe delete action ────────────────────────── */

function RightSwipeAction({ drag }: { drag: SharedValue<number> }) {
    const animStyle = useAnimatedStyle(() => ({
        transform: [{ translateX: drag.value + 70 }],
    }));

    return (
        <Animated.View
            style={[
                {
                    width: 70,
                    backgroundColor: '#FF3B30',
                    justifyContent: 'center',
                    alignItems: 'center',
                },
                animStyle,
            ]}
        >
            <Ionicons name="trash-outline" size={22} color="white" />
        </Animated.View>
    );
}

/* ──────────────── animated checkmark ─────────────────────────── */

function AnimatedCheckmark({ isCompleted }: { isCompleted: boolean }) {
    const scale = useSharedValue(1);

    useEffect(() => {
        if (isCompleted) {
            scale.value = withSequence(
                withSpring(1.3, { damping: 6, stiffness: 200 }),
                withSpring(1, { damping: 8, stiffness: 200 }),
            );
        } else {
            scale.value = 1;
        }
    }, [isCompleted]);

    const animStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
    }));

    return (
        <Animated.View
            style={[
                {
                    width: 28,
                    height: 28,
                    borderRadius: 14,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: isCompleted ? '#FF6000' : 'transparent',
                    borderWidth: isCompleted ? 0 : 2,
                    borderColor: '#3A3A3C',
                },
                animStyle,
            ]}
        >
            {isCompleted && (
                <Ionicons name="checkmark" size={16} color="#FFFFFF" />
            )}
        </Animated.View>
    );
}

/* ──────────────── main component ─────────────────────────────── */

export default function ExerciseCard({
    log,
    exerciseName,
    suggestion,
    targetRIR,
    getDraft,
    updateDraft,
    tryAutoComplete,
    completeSet,
    updateSetValues,
    removeSet,
    addWarmupSet,
    addDropSet,
    addEmptySets,
    onCollapse,
}: ExerciseCardProps) {
    return (
        <GestureHandlerRootView className="mb-2">
            <View className="rounded-2xl border border-white/10 bg-white/[0.07] p-4">
                {/* Exercise header */}
                <Pressable
                    onPress={onCollapse}
                    className="flex-row items-center justify-between mb-2 active:opacity-70"
                >
                    <View className="flex-row items-center flex-1 mr-2">
                        <Ionicons name="chevron-up" size={16} color="rgba(255,255,255,0.35)" style={{ marginRight: 8 }} />
                        <Text className="text-white text-lg font-outfit-bold" numberOfLines={1}>
                            {exerciseName}
                        </Text>
                    </View>
                    <View className="rounded-full px-3 py-1 bg-white/[0.08]">
                        <Text className="text-[#8E8E93] text-xs font-outfit-semibold">
                            WORKING
                        </Text>
                    </View>
                </Pressable>

                {/* Progressive overload suggestion */}
                {suggestion && suggestion.exerciseId === log.exerciseId && (
                    <View className="mb-3">
                        <Text className="text-[#FF6000] text-sm font-outfit-semibold">
                            Suggested: {suggestion.suggestedWeightKg}kg x{' '}
                            {suggestion.suggestedRepsMin}-{suggestion.suggestedRepsMax} @ RPE {10 - targetRIR}
                        </Text>
                        <Text className="text-[#8E8E93] text-xs mt-0.5 italic">
                            {suggestion.rationale}
                        </Text>
                    </View>
                )}

                {/* Add Warm-Up + Drop Set buttons */}
                <View className="flex-row gap-4 mb-3">
                    <Pressable
                        onPress={() => addWarmupSet(log.id)}
                        className="flex-row items-center active:opacity-70"
                    >
                        <Ionicons name="flame-outline" size={14} color={WARMUP_COLOR} style={{ marginRight: 4 }} />
                        <Text style={{ color: WARMUP_COLOR, fontSize: 13, fontWeight: '600' }}>
                            + Warm-Up
                        </Text>
                    </Pressable>
                    <Pressable
                        onPress={() => addDropSet(log.id)}
                        className="flex-row items-center active:opacity-70"
                    >
                        <Ionicons name="trending-down-outline" size={14} color={DROP_COLOR} style={{ marginRight: 4 }} />
                        <Text style={{ color: DROP_COLOR, fontSize: 13, fontWeight: '600' }}>
                            + Drop Set
                        </Text>
                    </Pressable>
                </View>

                {/* Set table header */}
                <View className="flex-row items-center mb-2 px-1">
                    <Text className="text-[#8E8E93] text-xs font-outfit-semibold w-10">SET</Text>
                    <Text className="text-[#8E8E93] text-xs font-outfit-semibold flex-1 text-center">KG</Text>
                    <Text className="text-[#8E8E93] text-xs font-outfit-semibold flex-1 text-center">REPS</Text>
                    <Text className="text-[#8E8E93] text-xs font-outfit-semibold flex-1 text-center">RPE</Text>
                    <Text className="text-[#8E8E93] text-xs font-outfit-semibold w-10 text-center">✓</Text>
                </View>

                {/* Set rows */}
                {log.sets.map((s) => {
                    const draft = getDraft(s);
                    const canDelete = log.sets.length > 1;
                    return (
                        <ReanimatedSwipeable
                            key={s.id}
                            friction={2}
                            rightThreshold={40}
                            enabled={canDelete && !s.isCompleted}
                            onSwipeableOpen={() => {
                                removeSet(log.id, s.id);
                            }}
                            renderRightActions={(_progress: SharedValue<number>, drag: SharedValue<number>) => (
                                <RightSwipeAction drag={drag} />
                            )}
                            overshootRight={false}
                        >
                            <View
                                className="flex-row items-center py-2 px-1 border-b border-[#3A3A3C]"
                                style={
                                    s.setType === 'WARMUP'
                                        ? styles.warmupRow
                                        : s.setType === 'DROP'
                                            ? styles.dropRow
                                            : undefined
                                }
                            >
                                <Text
                                    className="w-10 font-outfit-bold"
                                    style={{
                                        color: s.isCompleted
                                            ? 'white'
                                            : s.setType === 'WARMUP'
                                                ? WARMUP_COLOR
                                                : s.setType === 'DROP'
                                                    ? DROP_COLOR
                                                    : '#FF6000',
                                    }}
                                >
                                    {s.setType === 'WARMUP' ? 'W' : s.setType === 'DROP' ? 'D' : s.setNumber}
                                </Text>
                                <TextInput
                                    style={styles.setInput}
                                    placeholder="kg"
                                    placeholderTextColor="#8E8E93"
                                    keyboardType="numeric"
                                    value={draft.weight}
                                    onChangeText={(v) => {
                                        const val = clampInput(v, 500);
                                        updateDraft(s.id, 'weight', val);
                                        const w = parseFloat(val);
                                        const r = parseInt(draft.reps, 10);
                                        if (!isNaN(w) && !isNaN(r)) {
                                            const rpe = parseFloat(draft.rpe);
                                            updateSetValues(log.id, s.id, w, r, isNaN(rpe) ? undefined : rpe);
                                        }
                                        tryAutoComplete(log.id, s.id, s.isCompleted, { ...draft, weight: val });
                                    }}
                                />
                                <TextInput
                                    style={styles.setInput}
                                    placeholder="reps"
                                    placeholderTextColor="#8E8E93"
                                    keyboardType="numeric"
                                    value={draft.reps}
                                    onChangeText={(v) => {
                                        const val = clampInput(v, 100);
                                        updateDraft(s.id, 'reps', val);
                                        const w = parseFloat(draft.weight);
                                        const r = parseInt(val, 10);
                                        if (!isNaN(w) && !isNaN(r)) {
                                            const rpe = parseFloat(draft.rpe);
                                            updateSetValues(log.id, s.id, w, r, isNaN(rpe) ? undefined : rpe);
                                        }
                                        tryAutoComplete(log.id, s.id, s.isCompleted, { ...draft, reps: val });
                                    }}
                                />
                                <RPESelector
                                    value={draft.rpe ? parseFloat(draft.rpe) : s.rpe}
                                    onChange={(rpe) => {
                                        const rpeStr = String(rpe);
                                        updateDraft(s.id, 'rpe', rpeStr);
                                        const w = parseFloat(draft.weight);
                                        const r = parseInt(draft.reps, 10);
                                        updateSetValues(
                                            log.id,
                                            s.id,
                                            isNaN(w) ? s.weightKg : w,
                                            isNaN(r) ? s.reps : r,
                                            rpe
                                        );
                                        tryAutoComplete(log.id, s.id, s.isCompleted, { ...draft, rpe: rpeStr });
                                    }}
                                    disabled={s.isCompleted}
                                />
                                <Pressable
                                    onPress={() => {
                                        if (!s.isCompleted) {
                                            const w = parseFloat(draft.weight);
                                            const r = parseInt(draft.reps, 10);
                                            if (!isNaN(w) && !isNaN(r)) {
                                                const rpe = parseFloat(draft.rpe);
                                                updateSetValues(log.id, s.id, w, r, isNaN(rpe) ? undefined : rpe);
                                            }
                                            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                                        } else {
                                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                        }
                                        completeSet(log.id, s.id);
                                    }}
                                    className="w-10 items-center"
                                >
                                    <AnimatedCheckmark isCompleted={s.isCompleted} />
                                </Pressable>
                            </View>
                        </ReanimatedSwipeable>
                    );
                })}

                {/* + Add Set button */}
                <Pressable
                    onPress={() => addEmptySets(log.id, 1)}
                    className="mt-2 border border-[#FF6000] rounded-full py-2.5 items-center active:opacity-70"
                >
                    <Text className="text-[#FF6000] font-outfit-bold text-sm">+ Add Set</Text>
                </Pressable>
            </View>
        </GestureHandlerRootView>
    );
}

const styles = StyleSheet.create({
    setInput: {
        flex: 1,
        backgroundColor: 'rgba(255,255,255,0.06)',
        borderRadius: 8,
        color: 'white',
        textAlign: 'center',
        paddingVertical: 8,
        marginHorizontal: 4,
    },
    warmupRow: {
        backgroundColor: 'rgba(48,209,88,0.08)',
        borderRadius: 12,
    },
    dropRow: {
        backgroundColor: 'rgba(90,200,250,0.08)',
        borderRadius: 12,
    },
});
