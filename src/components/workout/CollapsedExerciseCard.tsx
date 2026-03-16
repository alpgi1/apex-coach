import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, View } from 'react-native';
import { ExerciseLog } from '../../types/workout.types';

interface CollapsedExerciseCardProps {
    log: ExerciseLog;
    exerciseName: string;
    onExpand: () => void;
}

export default function CollapsedExerciseCard({ log, exerciseName, onExpand }: CollapsedExerciseCardProps) {
    const completedSets = log.sets.filter((s) => s.isCompleted).length;
    const totalSets = log.sets.length;
    const allDone = totalSets > 0 && completedSets === totalSets;

    return (
        <Pressable
            onPress={onExpand}
            className="flex-row items-center justify-between p-4 mb-2 rounded-2xl border border-white/10 bg-white/[0.05] active:opacity-70"
        >
            <View className="flex-row items-center flex-1 mr-3">
                <Ionicons name="chevron-down" size={16} color="rgba(255,255,255,0.35)" style={{ marginRight: 8 }} />
                <Text className="text-white font-bold text-base" numberOfLines={1}>
                    {exerciseName}
                </Text>
            </View>

            <View className="flex-row items-center">
                <Text className="text-[#8E8E93] text-sm font-semibold mr-2">
                    {completedSets}/{totalSets} sets
                </Text>
                {allDone && (
                    <Ionicons name="checkmark-circle" size={18} color="#34C759" />
                )}
            </View>
        </Pressable>
    );
}
