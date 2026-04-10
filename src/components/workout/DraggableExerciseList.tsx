import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRef, useState } from 'react';
import {
    Alert,
    LayoutAnimation,
    Platform,
    Pressable,
    UIManager,
    View,
} from 'react-native';
import { ExerciseLog } from '../../types/workout.types';
import CollapsedExerciseCard from './CollapsedExerciseCard';
import ExerciseCard, { type SetRowDraft } from './ExerciseCard';
import { WorkoutSet } from '../../types/workout.types';
import { ExerciseMetadata } from '../../types/exercise.types';

// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface DraggableExerciseListProps {
    logs: ExerciseLog[];
    expandedLogId: string | null;
    exerciseMap: Record<string, ExerciseMetadata>;
    suggestion: any;
    targetRIR: number;
    cardPositions: React.MutableRefObject<Record<string, number>>;
    getDraft: (s: WorkoutSet) => SetRowDraft;
    updateDraft: (setId: string, field: keyof SetRowDraft, value: string) => void;
    tryAutoComplete: (logId: string, setId: string, isAlreadyCompleted: boolean, merged: SetRowDraft) => void;
    completeSet: (logId: string, setId: string) => void;
    updateSetValues: (logId: string, setId: string, weight: number, reps: number, rpe?: number) => void;
    removeSet: (logId: string, setId: string) => void;
    addWarmupSet: (logId: string) => void;
    addDropSet: (logId: string) => void;
    addEmptySets: (logId: string, count: number, weightKg?: number) => void;
    onExpand: (logId: string) => void;
    onCollapse: () => void;
    onReorder: (fromIndex: number, toIndex: number) => void;
    onRemoveLog: (logId: string) => void;
}

export default function DraggableExerciseList({
    logs,
    expandedLogId,
    exerciseMap,
    suggestion,
    targetRIR,
    cardPositions,
    getDraft,
    updateDraft,
    tryAutoComplete,
    completeSet,
    updateSetValues,
    removeSet,
    addWarmupSet,
    addDropSet,
    addEmptySets,
    onExpand,
    onCollapse,
    onReorder,
    onRemoveLog,
}: DraggableExerciseListProps) {
    const handleRemoveLog = (log: ExerciseLog) => {
        const hasCompletedSets = log.sets.some((s) => s.isCompleted);
        if (hasCompletedSets) {
            Alert.alert(
                'Remove Exercise',
                'This exercise has completed sets. Remove it anyway?',
                [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Remove', style: 'destructive', onPress: () => onRemoveLog(log.id) },
                ],
            );
        } else {
            onRemoveLog(log.id);
        }
    };
    // Tracks which item is being dragged
    const [draggingIndex, setDraggingIndex] = useState<number | null>(null);
    const [hoverIndex, setHoverIndex] = useState<number | null>(null);

    // Per-item layout heights, measured at render time
    const itemHeights = useRef<Record<number, number>>({});

    const handleDragStart = (index: number) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        setDraggingIndex(index);
        setHoverIndex(index);
    };

    const handleMoveUp = (index: number) => {
        if (index === 0) return;
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        onReorder(index, index - 1);
    };

    const handleMoveDown = (index: number) => {
        if (index === logs.length - 1) return;
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        onReorder(index, index + 1);
    };

    const handleDragEnd = () => {
        setDraggingIndex(null);
        setHoverIndex(null);
    };

    return (
        <>
            {logs.map((log, index) => {
                const isExpanded = log.id === expandedLogId;
                const isDragging = draggingIndex === index;
                const isFirst = index === 0;
                const isLast = index === logs.length - 1;

                return (
                    <View
                        key={log.id}
                        onLayout={(e) => {
                            cardPositions.current[log.id] = e.nativeEvent.layout.y;
                            itemHeights.current[index] = e.nativeEvent.layout.height;
                        }}
                        style={[
                            isDragging && {
                                opacity: 0.85,
                                transform: [{ scale: 1.02 }],
                                shadowColor: '#FF6000',
                                shadowOpacity: 0.25,
                                shadowRadius: 12,
                                shadowOffset: { width: 0, height: 4 },
                                elevation: 8,
                                borderRadius: 16,
                            },
                        ]}
                    >
                        {isExpanded ? (
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
                                addDropSet={addDropSet}
                                addEmptySets={addEmptySets}
                                onCollapse={onCollapse}
                                onRemoveLog={() => handleRemoveLog(log)}
                            />
                        ) : (
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                {/* Collapsed card — takes up the flex space */}
                                <View style={{ flex: 1 }}>
                                    <CollapsedExerciseCard
                                        log={log}
                                        exerciseName={exerciseMap[log.exerciseId]?.name ?? log.exerciseId}
                                        onExpand={() => onExpand(log.id)}
                                    />
                                </View>

                                {/* Reorder controls */}
                                {logs.length > 1 && (
                                    <View style={{ marginLeft: 6, alignItems: 'center', gap: 2 }}>
                                        {/* Move Up */}
                                        <Pressable
                                            onPress={() => handleMoveUp(index)}
                                            onLongPress={() => handleDragStart(index)}
                                            onPressOut={handleDragEnd}
                                            disabled={isFirst}
                                            style={({ pressed }) => ({
                                                width: 30,
                                                height: 30,
                                                borderRadius: 8,
                                                backgroundColor: isFirst
                                                    ? 'rgba(255,255,255,0.03)'
                                                    : pressed
                                                        ? 'rgba(255,96,0,0.2)'
                                                        : 'rgba(255,255,255,0.06)',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                            })}
                                        >
                                            <Ionicons
                                                name="chevron-up"
                                                size={16}
                                                color={isFirst ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.6)'}
                                            />
                                        </Pressable>

                                        {/* Move Down */}
                                        <Pressable
                                            onPress={() => handleMoveDown(index)}
                                            onLongPress={() => handleDragStart(index)}
                                            onPressOut={handleDragEnd}
                                            disabled={isLast}
                                            style={({ pressed }) => ({
                                                width: 30,
                                                height: 30,
                                                borderRadius: 8,
                                                backgroundColor: isLast
                                                    ? 'rgba(255,255,255,0.03)'
                                                    : pressed
                                                        ? 'rgba(255,96,0,0.2)'
                                                        : 'rgba(255,255,255,0.06)',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                            })}
                                        >
                                            <Ionicons
                                                name="chevron-down"
                                                size={16}
                                                color={isLast ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.6)'}
                                            />
                                        </Pressable>
                                    </View>
                                )}
                            </View>
                        )}
                    </View>
                );
            })}
        </>
    );
}
