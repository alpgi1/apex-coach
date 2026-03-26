import { Ionicons } from '@expo/vector-icons';
import * as Crypto from 'expo-crypto';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Pressable,
    ScrollView,
    Text,
    TextInput,
    View,
    Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import ExercisePickerModal from '../../src/components/workout/ExercisePickerModal';
import { deleteTemplate, getTemplateById, updateTemplate } from '../../src/services/storage/templateStorage';
import { getExerciseById } from '../../src/services/storage/exerciseStorage';
import { ExerciseMetadata, MuscleGroup } from '../../src/types/exercise.types';
import { TemplateExercise, WorkoutTemplate } from '../../src/types/workout.types';

/* ─────────────────────────── types ─────────────────────────── */

interface ExerciseEntry {
    templateExercise: TemplateExercise;
    exerciseMeta: ExerciseMetadata;
}

/* ─────────────────────────── helpers ───────────────────────── */

const formatLabel = (raw: string): string =>
    raw
        .replace(/_/g, ' ')
        .toLowerCase()
        .replace(/\b\w/g, (c) => c.toUpperCase());

/* ─────────────────────────── screen ────────────────────────── */

export default function TemplateDetailScreen() {
    const router = useRouter();
    const { templateId } = useLocalSearchParams<{ templateId: string }>();

    const [template, setTemplate] = useState<WorkoutTemplate | null>(null);
    const [templateName, setTemplateName] = useState<string>('');
    const [description, setDescription] = useState<string>('');
    const [exercises, setExercises] = useState<ExerciseEntry[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [hasChanges, setHasChanges] = useState<boolean>(false);
    const [isPickerVisible, setIsPickerVisible] = useState<boolean>(false);

    /* ── load template on mount ──────────────────────────────── */
    useEffect(() => {
        const load = async () => {
            if (!templateId) return;
            try {
                const loaded = await getTemplateById(templateId);
                if (!loaded) return;

                setTemplate(loaded);
                setTemplateName(loaded.name);
                setDescription(loaded.description ?? '');

                const entries = await Promise.all(
                    loaded.exercises.map(async (te) => {
                        const meta = await getExerciseById(te.exerciseId);
                        return meta ? { templateExercise: te, exerciseMeta: meta } : null;
                    })
                );
                setExercises(entries.filter((e): e is ExerciseEntry => e !== null));
            } catch (err) {
                console.error('Failed to load template:', err);
            } finally {
                setIsLoading(false);
            }
        };

        load();
    }, [templateId]);

    /* ── mark dirty helpers ──────────────────────────────────── */
    const setNameDirty = (value: string) => {
        setTemplateName(value);
        setHasChanges(true);
    };

    const setDescriptionDirty = (value: string) => {
        setDescription(value);
        setHasChanges(true);
    };

    /* ── exercise handlers ───────────────────────────────────── */
    const handleExerciseSelect = (exercise: ExerciseMetadata) => {
        const templateExercise: TemplateExercise = {
            id: Crypto.randomUUID(),
            exerciseId: exercise.id,
            order: exercises.length,
            targetSets: 3,
            targetRepsMin: exercise.idealRepsMin,
            targetRepsMax: exercise.idealRepsMax,
        };
        setExercises((prev) => [...prev, { templateExercise, exerciseMeta: exercise }]);
        setHasChanges(true);
    };

    const handleRemoveExercise = (id: string) => {
        setExercises((prev) =>
            prev
                .filter((e) => e.templateExercise.id !== id)
                .map((e, idx) => ({
                    ...e,
                    templateExercise: { ...e.templateExercise, order: idx },
                }))
        );
        setHasChanges(true);
    };

    const updateExerciseField = (
        id: string,
        field: keyof Pick<TemplateExercise, 'targetSets' | 'targetRepsMin' | 'targetRepsMax' | 'targetRpe' | 'targetWeightKg'>,
        raw: string
    ) => {
        const MAX: Partial<Record<typeof field, number>> = {
            targetWeightKg: 500,
            targetRepsMin: 100,
            targetRepsMax: 100,
            targetSets: 20,
        };
        let value = parseFloat(raw);
        const max = MAX[field];
        if (!isNaN(value) && max !== undefined && value > max) value = max;
        setExercises((prev) =>
            prev.map((e) =>
                e.templateExercise.id === id
                    ? { ...e, templateExercise: { ...e.templateExercise, [field]: isNaN(value) ? undefined : value } }
                    : e
            )
        );
        setHasChanges(true);
    };

    /* ── save ────────────────────────────────────────────────── */
    const handleSave = async () => {
        if (!template || !hasChanges) return;

        const muscleGroups: MuscleGroup[] = [
            ...new Set(exercises.map((e) => e.exerciseMeta.primaryMuscleGroup)),
        ];

        const updated: WorkoutTemplate = {
            ...template,
            name: templateName.trim(),
            description: description.trim() || undefined,
            exercises: exercises.map((e) => e.templateExercise),
            primaryMuscleGroups: muscleGroups,
            updatedAt: new Date().toISOString(),
        };

        await updateTemplate(updated);
        router.back();
    };

    /* ── delete ──────────────────────────────────────────────── */
    const handleDelete = () => {
        Alert.alert(
            'Delete Template',
            'Are you sure you want to delete this template? This cannot be undone.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        if (!templateId) return;
                        await deleteTemplate(templateId);
                        router.back();
                    },
                },
            ]
        );
    };

    const canSave = hasChanges && templateName.trim().length > 0 && exercises.length > 0;

    /* ══════════════════════ loading state ══════════════════════ */
    if (isLoading) {
        return (
            <SafeAreaView className="flex-1 bg-[#1A1A1A] justify-center items-center">
                <ActivityIndicator size="large" color="#FF6000" />
            </SafeAreaView>
        );
    }

    /* ══════════════════════════ ui ═════════════════════════════ */
    return (
        <SafeAreaView className="flex-1 bg-[#1A1A1A]">

            {/* ── SECTION 1 — HEADER ────────────────────────── */}
            <View className="flex-row items-center justify-between px-4 py-3">
                <Pressable
                    onPress={() => router.back()}
                    className="w-10 h-10 items-center justify-center rounded-full bg-[#242424] active:opacity-70"
                >
                    <Ionicons name="chevron-back" size={22} color="#FFFFFF" />
                </Pressable>

                <Text className="text-white text-lg font-bold" numberOfLines={1}>
                    {templateName || 'Workout Plan'}
                </Text>

                <Pressable
                    onPress={handleSave}
                    disabled={!canSave}
                    className={`px-4 py-2 active:opacity-70 ${!canSave ? 'opacity-40' : ''}`}
                >
                    <Text className="text-[#FF6000] font-semibold text-base">Save</Text>
                </Pressable>
            </View>

            <ScrollView
                className="flex-1"
                contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 48 }}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
            >

                {/* ── SECTION 2 — TEMPLATE NAME ─────────────── */}
                <View className="mb-4">
                    <Text className="text-[#8E8E93] text-xs font-semibold uppercase tracking-wider mb-2">
                        Plan Name
                    </Text>
                    <TextInput
                        value={templateName}
                        onChangeText={setNameDirty}
                        placeholder="e.g. Push Day A"
                        placeholderTextColor="#8E8E93"
                        className="bg-[#242424] rounded-xl px-4 py-3.5 text-white text-base"
                    />
                </View>

                {/* ── SECTION 3 — DESCRIPTION ───────────────── */}
                <View className="mb-6">
                    <Text className="text-[#8E8E93] text-xs font-semibold uppercase tracking-wider mb-2">
                        Description (optional)
                    </Text>
                    <TextInput
                        value={description}
                        onChangeText={setDescriptionDirty}
                        placeholder="e.g. Heavy upper body focus"
                        placeholderTextColor="#8E8E93"
                        multiline
                        numberOfLines={3}
                        textAlignVertical="top"
                        className="bg-[#242424] rounded-xl px-4 py-3.5 text-white text-base"
                    />
                </View>

                {/* ── SECTION 4 — EXERCISES ─────────────────── */}
                <View className="flex-row items-center justify-between mb-3">
                    <Text className="text-white text-lg font-bold">
                        Exercises{exercises.length > 0 ? ` (${exercises.length})` : ''}
                    </Text>
                </View>

                {exercises.map((entry) => {
                    const { templateExercise: te, exerciseMeta: meta } = entry;
                    return (
                        <View key={te.id} className="bg-[#242424] rounded-2xl p-4 mb-3">

                            {/* Exercise header row */}
                            <View className="flex-row items-start justify-between mb-3">
                                <View className="flex-row items-center flex-1 mr-2">
                                    {/* Circular GIF or fallback icon */}
                                    <View className="w-[52px] h-[52px] rounded-full overflow-hidden bg-[#F5F5F5] border border-white/10 mr-3 shrink-0">
                                        {meta.gifUrl ? (
                                            <Image
                                                source={{ uri: meta.gifUrl }}
                                                className="w-full h-full"
                                                resizeMode="cover"
                                            />
                                        ) : (
                                            <View className="w-full h-full bg-[#1A1A1A] items-center justify-center">
                                                <Ionicons name="barbell-outline" size={22} color="rgba(255,255,255,0.3)" />
                                            </View>
                                        )}
                                    </View>

                                    <View className="flex-1 shrink">
                                        <Text className="text-white font-bold text-base mb-1" numberOfLines={2}>
                                            {meta.name}
                                        </Text>
                                        <View className="bg-[#3A3A3C] rounded-full px-2.5 py-0.5 self-start">
                                            <Text className="text-[#8E8E93] text-xs font-semibold">
                                                {formatLabel(meta.primaryMuscleGroup)}
                                            </Text>
                                        </View>
                                    </View>
                                </View>
                                <Pressable
                                    onPress={() => handleRemoveExercise(te.id)}
                                    className="w-8 h-8 items-center justify-center active:opacity-70"
                                >
                                    <Ionicons name="trash-outline" size={18} color="#FF3B30" />
                                </Pressable>
                            </View>

                            {/* Sets / Reps Min / Reps Max / KG */}
                            <View className="flex-row gap-2 mb-2">
                                <View className="flex-1">
                                    <Text className="text-[#8E8E93] text-xs text-center mb-1">Sets</Text>
                                    <TextInput
                                        value={te.targetSets > 0 ? String(te.targetSets) : ''}
                                        onChangeText={(v) => updateExerciseField(te.id, 'targetSets', v)}
                                        keyboardType="numeric"
                                        placeholder="3"
                                        placeholderTextColor="#8E8E93"
                                        className="bg-[#1A1A1A] rounded-lg text-white text-center py-2 text-base"
                                    />
                                </View>
                                <View className="flex-1">
                                    <Text className="text-[#8E8E93] text-xs text-center mb-1">Reps Min</Text>
                                    <TextInput
                                        value={te.targetRepsMin > 0 ? String(te.targetRepsMin) : ''}
                                        onChangeText={(v) => updateExerciseField(te.id, 'targetRepsMin', v)}
                                        keyboardType="numeric"
                                        placeholder="8"
                                        placeholderTextColor="#8E8E93"
                                        className="bg-[#1A1A1A] rounded-lg text-white text-center py-2 text-base"
                                    />
                                </View>
                                <View className="flex-1">
                                    <Text className="text-[#8E8E93] text-xs text-center mb-1">Reps Max</Text>
                                    <TextInput
                                        value={te.targetRepsMax != null ? String(te.targetRepsMax) : ''}
                                        onChangeText={(v) => updateExerciseField(te.id, 'targetRepsMax', v)}
                                        keyboardType="numeric"
                                        placeholder="12"
                                        placeholderTextColor="#8E8E93"
                                        className="bg-[#1A1A1A] rounded-lg text-white text-center py-2 text-base"
                                    />
                                </View>
                                <View className="flex-1">
                                    <Text className="text-[#8E8E93] text-xs text-center mb-1">KG</Text>
                                    <TextInput
                                        value={te.targetWeightKg != null ? String(te.targetWeightKg) : ''}
                                        onChangeText={(v) => updateExerciseField(te.id, 'targetWeightKg', v)}
                                        keyboardType="decimal-pad"
                                        placeholder="—"
                                        placeholderTextColor="#8E8E93"
                                        className="bg-[#1A1A1A] rounded-lg text-white text-center py-2 text-base"
                                    />
                                </View>
                            </View>

                            {/* RPE target (optional) */}
                            <View className="flex-row items-center gap-2">
                                <Text className="text-[#8E8E93] text-xs">Target RPE (optional)</Text>
                                <TextInput
                                    value={te.targetRpe != null ? String(te.targetRpe) : ''}
                                    onChangeText={(v) => updateExerciseField(te.id, 'targetRpe', v)}
                                    keyboardType="numeric"
                                    placeholder="8"
                                    placeholderTextColor="#8E8E93"
                                    className="bg-[#1A1A1A] rounded-lg text-white text-center py-1.5 text-sm w-16"
                                />
                            </View>
                        </View>
                    );
                })}

                {/* + Add Exercise button */}
                <Pressable
                    onPress={() => setIsPickerVisible(true)}
                    className="border border-[#FF6000] rounded-full py-3 items-center mb-6 active:opacity-70"
                >
                    <Text className="text-[#FF6000] font-bold text-sm">+ Add Exercise</Text>
                </Pressable>

                {/* ── SECTION 5 — SAVE + DELETE ─────────────── */}
                <Pressable
                    onPress={handleSave}
                    disabled={!canSave}
                    className={`bg-[#FF6000] rounded-full h-[52px] items-center justify-center mb-3 active:opacity-80 ${
                        !canSave ? 'opacity-50' : ''
                    }`}
                >
                    <Text className="text-white font-bold text-base">Save Changes</Text>
                </Pressable>

                <Pressable
                    onPress={handleDelete}
                    className="border border-[#FF3B30] rounded-full h-[52px] items-center justify-center active:opacity-70"
                >
                    <Text className="text-[#FF3B30] font-bold text-base">Delete Plan</Text>
                </Pressable>

            </ScrollView>

            {/* ── EXERCISE PICKER MODAL ─────────────────────── */}
            <ExercisePickerModal
                isVisible={isPickerVisible}
                onClose={() => setIsPickerVisible(false)}
                onSelectExercise={handleExerciseSelect}
            />

        </SafeAreaView>
    );
}
