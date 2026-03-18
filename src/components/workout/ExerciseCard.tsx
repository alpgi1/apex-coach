import { Ionicons } from '@expo/vector-icons';
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
                                className={`flex-row items-center py-2 px-1 border-b border-[#3A3A3C] ${s.isCompleted ? 'bg-green-500/5' : ''}`}
                                style={{ backgroundColor: 'transparent' }}
                            >
                                <Text className={`w-10 font-outfit-bold ${s.isCompleted ? 'text-white' : 'text-[#FF6000]'}`}>
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
                                            updateSetValues(log.id, s.id, w, r, isNaN(rpe) ? undefined : rpe);
                                        }
                                        tryAutoComplete(log.id, s.id, s.isCompleted, { ...draft, weight: v });
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
                                            updateSetValues(log.id, s.id, w, r, isNaN(rpe) ? undefined : rpe);
                                        }
                                        tryAutoComplete(log.id, s.id, s.isCompleted, { ...draft, reps: v });
                                    }}
                                />
                                <RPESelector
                                    value={draft.rpe ? parseFloat(draft.rpe) : s.rpe}
                                    onChange={(rpe) => {
                                        const rpeStr = String(rpe);
                                        updateDraft(s.id, 'rpe', rpeStr);
                                        const w = parseFloat(draft.weight);
                                        const r = parseInt(draft.reps, 10);
                                        if (!isNaN(w) && !isNaN(r)) {
                                            updateSetValues(log.id, s.id, w, r, rpe);
                                        }
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
                                        }
                                        completeSet(log.id, s.id);
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
});
