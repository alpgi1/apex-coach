import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    Image,
    KeyboardAvoidingView,
    Modal,
    Platform,
    Pressable,
    ScrollView,
    Text,
    TextInput,
    View,
} from 'react-native';

import { getAllExercises, searchExercises } from '../../services/storage/exerciseStorage';
import { ExerciseMetadata, MuscleGroup } from '../../types/exercise.types';

/* ────────────────────────── props ──────────────────────────── */

interface ExercisePickerModalProps {
    isVisible: boolean;
    onClose: () => void;
    onSelectExercise: (exercise: ExerciseMetadata) => void;
}

/* ────────────────────────── constants ──────────────────────── */

const MUSCLE_GROUPS: MuscleGroup[] = [
    'CHEST', 'BACK', 'LEGS', 'SHOULDERS', 'ARMS', 'CORE', 'FULL_BODY',
];

/* ────────────────────────── helpers ────────────────────────── */

const formatLabel = (raw: string): string =>
    raw
        .replace(/_/g, ' ')
        .toLowerCase()
        .replace(/\b\w/g, (c) => c.toUpperCase());

/* ────────────────────────── component ─────────────────────── */

export default function ExercisePickerModal({
    isVisible,
    onClose,
    onSelectExercise,
}: ExercisePickerModalProps) {
    const [exercises, setExercises] = useState<ExerciseMetadata[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [query, setQuery] = useState<string>('');
    const [activeGroup, setActiveGroup] = useState<MuscleGroup | null>(null);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    /* ── unified search: showSpinner only on initial open ───── */
    const runSearch = useCallback(async (name: string, group: MuscleGroup | null, showSpinner = false) => {
        if (showSpinner) setIsLoading(true);
        try {
            if (name.trim().length === 0 && !group) {
                setExercises(await getAllExercises());
            } else {
                setExercises(await searchExercises({
                    name: name.trim() || undefined,
                    muscleGroup: group ?? undefined,
                }));
            }
        } catch (err) {
            console.error('Search failed:', err);
        } finally {
            if (showSpinner) setIsLoading(false);
        }
    }, []);

    /* ── load all exercises on open ─────────────────────────── */
    useEffect(() => {
        if (!isVisible) return;
        runSearch('', null, true);
    }, [isVisible, runSearch]);

    /* ── debounced text search ──────────────────────────────── */
    const handleSearch = useCallback((text: string) => {
        setQuery(text);
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
            setActiveGroup(prev => { runSearch(text, prev); return prev; });
        }, 300);
    }, [runSearch]);

    /* ── muscle group chip tap ──────────────────────────────── */
    const handleGroupPress = useCallback((group: MuscleGroup) => {
        setActiveGroup(prev => {
            const next = prev === group ? null : group;
            runSearch(query, next);
            return next;
        });
    }, [query, runSearch]);

    /* ── cleanup ────────────────────────────────────────────── */
    useEffect(() => {
        return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
    }, []);

    /* ── select handler ─────────────────────────────────────── */
    const handleSelect = (exercise: ExerciseMetadata) => {
        onSelectExercise(exercise);
        onClose();
        setQuery('');
        setActiveGroup(null);
    };

    /* ── reset on close ─────────────────────────────────────── */
    useEffect(() => {
        if (!isVisible) { setQuery(''); setActiveGroup(null); }
    }, [isVisible]);

    /* ── row renderer ───────────────────────────────────────── */
    const renderItem = ({ item }: { item: ExerciseMetadata }) => (
        <Pressable
            onPress={() => handleSelect(item)}
            className="flex-row items-center py-4 px-4 active:bg-[#2A2A2A]"
        >
            {item.gifUrl ? (
                <View style={{ width: 44, height: 44, borderRadius: 22, overflow: 'hidden', backgroundColor: '#2A2A2A', marginRight: 12 }}>
                    <Image source={{ uri: item.gifUrl }} style={{ width: 44, height: 44 }} resizeMode="cover" />
                </View>
            ) : (
                <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: '#2A2A2A', marginRight: 12, alignItems: 'center', justifyContent: 'center' }}>
                    <Ionicons name="barbell-outline" size={20} color="#3A3A3C" />
                </View>
            )}

            <View className="flex-1 mr-3">
                <Text className="text-white text-base font-outfit-bold mb-1.5">
                    {item.name}
                </Text>
                <View className="flex-row flex-wrap gap-2">
                    <View className="bg-[#3A3A3C] rounded-full px-2.5 py-0.5">
                        <Text className="text-[#8E8E93] text-xs font-outfit-semibold">
                            {formatLabel(item.primaryMuscleGroup)}
                        </Text>
                    </View>
                    <View className="bg-[#3A3A3C] rounded-full px-2.5 py-0.5">
                        <Text className="text-[#8E8E93] text-xs font-outfit-semibold">
                            {formatLabel(item.equipment)}
                        </Text>
                    </View>
                </View>
            </View>

            <Ionicons name="chevron-forward" size={20} color="#FF6000" />
        </Pressable>
    );

    const renderSeparator = () => (
        <View className="h-px bg-[#2A2A2A] mx-4" />
    );

    /* ══════════════════════ render ═════════════════════════── */
    return (
        <Modal
            visible={isVisible}
            animationType="slide"
            transparent
            onRequestClose={onClose}
        >
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
            {/* Backdrop */}
            <Pressable
                onPress={onClose}
                className="flex-1 bg-black/50"
            />

            {/* Bottom sheet */}
            <View className="bg-[#1A1A1A] rounded-t-3xl pb-10 max-h-[85%]">
                {/* Handle bar */}
                <View className="items-center pt-3 pb-2">
                    <View className="w-10 h-1 rounded-full bg-[#3A3A3C]" />
                </View>

                {/* Header */}
                <View className="flex-row items-center justify-between px-5 pb-3">
                    <Text className="text-white text-xl font-outfit-bold">
                        Add Exercise
                    </Text>
                    <Pressable
                        onPress={onClose}
                        className="w-8 h-8 items-center justify-center rounded-full bg-[#242424] active:opacity-70"
                    >
                        <Ionicons name="close" size={18} color="#8E8E93" />
                    </Pressable>
                </View>

                {/* Search input */}
                <View className="mx-4 mb-3 flex-row items-center bg-[#242424] rounded-xl px-3 py-2.5">
                    <Ionicons
                        name="search"
                        size={18}
                        color="#8E8E93"
                        style={{ marginRight: 8 }}
                    />
                    <TextInput
                        className="flex-1 text-white text-base"
                        placeholder="Search exercises..."
                        placeholderTextColor="#8E8E93"
                        value={query}
                        onChangeText={handleSearch}
                        autoCapitalize="none"
                        autoCorrect={false}
                    />
                    {query.length > 0 && (
                        <Pressable
                            onPress={() => handleSearch('')}
                            className="ml-2 active:opacity-70"
                        >
                            <Ionicons name="close-circle" size={18} color="#8E8E93" />
                        </Pressable>
                    )}
                </View>

                {/* Muscle group filter chips */}
                <View style={{ marginBottom: 12 }}>
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={{ paddingHorizontal: 16 }}
                        keyboardShouldPersistTaps="handled"
                    >
                        {MUSCLE_GROUPS.map((group, index) => {
                            const active = activeGroup === group;
                            return (
                                <Pressable
                                    key={group}
                                    onPress={() => handleGroupPress(group)}
                                    style={{
                                        backgroundColor: active ? '#FF6000' : '#242424',
                                        borderRadius: 999,
                                        paddingHorizontal: 14,
                                        paddingVertical: 8,
                                        borderWidth: 1,
                                        borderColor: active ? '#FF6000' : '#3A3A3C',
                                        marginRight: index < MUSCLE_GROUPS.length - 1 ? 8 : 0,
                                    }}
                                >
                                    <Text style={{
                                        color: active ? '#000' : '#8E8E93',
                                        fontSize: 13,
                                        fontWeight: '600',
                                    }}>
                                        {formatLabel(group)}
                                    </Text>
                                </Pressable>
                            );
                        })}
                    </ScrollView>
                </View>

                {/* List */}
                {isLoading ? (
                    <View className="items-center justify-center py-16">
                        <ActivityIndicator size="large" color="#FF6000" />
                        <Text className="text-[#8E8E93] text-sm mt-3">
                            Loading exercises...
                        </Text>
                    </View>
                ) : exercises.length === 0 ? (
                    <View className="items-center justify-center py-16">
                        <Ionicons name="barbell-outline" size={48} color="#3A3A3C" />
                        <Text className="text-[#8E8E93] text-sm mt-3">
                            No exercises found
                        </Text>
                    </View>
                ) : (
                    <FlatList
                        data={exercises}
                        keyExtractor={(item) => item.id}
                        renderItem={renderItem}
                        ItemSeparatorComponent={renderSeparator}
                        showsVerticalScrollIndicator={false}
                        keyboardShouldPersistTaps="handled"
                    />
                )}
            </View>
            </KeyboardAvoidingView>
        </Modal>
    );
}
