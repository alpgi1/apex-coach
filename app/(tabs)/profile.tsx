import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import {
    Alert,
    Pressable,
    ScrollView,
    Text,
    TextInput,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { clearAllData } from '../../src/services/storage/database';
import { deleteTemplate, getAllTemplates } from '../../src/services/storage/templateStorage';
import { getWorkoutHistory } from '../../src/services/storage/workoutStorage';
import { useUserStore } from '../../src/store/userStore';
import { WorkoutTemplate } from '../../src/types/workout.types';

export default function ProfileScreen() {
    const { name, weightUnit, targetRIR, setName, setWeightUnit, setTargetRIR } =
        useUserStore();

    const router = useRouter();
    const [isEditingName, setIsEditingName] = useState<boolean>(false);
    const [draftName, setDraftName] = useState<string>(name);
    const [totalWorkouts, setTotalWorkouts] = useState<number>(0);
    const [templates, setTemplates] = useState<WorkoutTemplate[]>([]);

    const inputRef = useRef<TextInput>(null);

    useFocusEffect(
        useCallback(() => {
            getWorkoutHistory()
                .then((h) => setTotalWorkouts(h.length))
                .catch(() => setTotalWorkouts(0));
            getAllTemplates()
                .then((t) => setTemplates(t))
                .catch(() => setTemplates([]));
        }, [])
    );

    const handleStartEdit = () => {
        setDraftName(name);
        setIsEditingName(true);
        setTimeout(() => inputRef.current?.focus(), 50);
    };

    const handleConfirmName = () => {
        const trimmed = draftName.trim();
        if (trimmed) setName(trimmed);
        setIsEditingName(false);
    };

    const handleDeleteTemplate = (id: string) => {
        Alert.alert(
            'Delete Template',
            'Are you sure you want to delete this template?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        await deleteTemplate(id);
                        setTemplates((prev) => prev.filter((t) => t.id !== id));
                    },
                },
            ]
        );
    };

    const handleClearData = () => {
        Alert.alert(
            'Clear All Data',
            'This will permanently delete all your workouts and reset your profile. This cannot be undone.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Clear Everything',
                    style: 'destructive',
                    onPress: () => {
                        clearAllData();
                        setName('');
                        setWeightUnit('KG');
                        setTargetRIR(2);
                        setTotalWorkouts(0);
                    },
                },
            ]
        );
    };

    return (
        <SafeAreaView className="flex-1 bg-[#1A1A1A]">
            <ScrollView
                className="flex-1"
                contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40 }}
                showsVerticalScrollIndicator={false}
            >
                {/* ── SECTION 1 — HEADER ─────────────────────── */}
                <View className="pt-3 pb-6">
                    <Text className="text-white text-2xl font-bold">Profile</Text>
                </View>

                {/* ── SECTION 2 — AVATAR + NAME ──────────────── */}
                <View className="items-center mb-6">
                    <View className="w-24 h-24 rounded-full bg-[#242424] items-center justify-center mb-4">
                        <Ionicons name="person" size={48} color="#8E8E93" />
                    </View>

                    {isEditingName ? (
                        <View className="flex-row items-center gap-2">
                            <TextInput
                                ref={inputRef}
                                value={draftName}
                                onChangeText={setDraftName}
                                onSubmitEditing={handleConfirmName}
                                returnKeyType="done"
                                placeholder="Your name"
                                placeholderTextColor="#8E8E93"
                                className="text-white text-xl font-bold border-b border-[#FF6000] pb-1 min-w-[120px] text-center"
                                autoFocus
                            />
                            <Pressable
                                onPress={handleConfirmName}
                                className="w-8 h-8 rounded-full bg-[#FF6000] items-center justify-center active:opacity-70"
                            >
                                <Ionicons name="checkmark" size={16} color="white" />
                            </Pressable>
                        </View>
                    ) : (
                        <Pressable onPress={handleStartEdit} className="items-center active:opacity-70">
                            <Text className="text-white text-xl font-bold mb-1">
                                {name || 'Lifter'}
                            </Text>
                            <Text className="text-[#8E8E93] text-sm">Tap to edit</Text>
                        </Pressable>
                    )}
                </View>

                {/* ── SECTION 3 — PREFERENCES ────────────────── */}
                <View className="bg-[#242424] rounded-2xl px-4 py-3 mb-4">
                    <Text className="text-[#8E8E93] text-xs font-semibold uppercase tracking-wider mb-3">
                        Preferences
                    </Text>

                    {/* Weight Unit row */}
                    <View className="flex-row items-center justify-between py-3 border-b border-[#3A3A3C]">
                        <View className="flex-row items-center gap-3">
                            <Ionicons name="barbell-outline" size={20} color="#8E8E93" />
                            <Text className="text-white text-base">Weight Unit</Text>
                        </View>
                        <View className="flex-row gap-2">
                            {(['KG', 'LBS'] as const).map((unit) => (
                                <Pressable
                                    key={unit}
                                    onPress={() => setWeightUnit(unit)}
                                    className={`px-4 py-1.5 rounded-full active:opacity-80 ${
                                        weightUnit === unit
                                            ? 'bg-[#FF6000]'
                                            : 'bg-[#3A3A3C]'
                                    }`}
                                >
                                    <Text
                                        className={`text-sm font-semibold ${
                                            weightUnit === unit
                                                ? 'text-white'
                                                : 'text-[#8E8E93]'
                                        }`}
                                    >
                                        {unit}
                                    </Text>
                                </Pressable>
                            ))}
                        </View>
                    </View>

                    {/* Target RIR row */}
                    <View className="flex-row items-center justify-between py-3">
                        <View className="flex-row items-center gap-3">
                            <Ionicons name="flame-outline" size={20} color="#8E8E93" />
                            <Text className="text-white text-base">Target RIR</Text>
                        </View>
                        <View className="flex-row items-center gap-3">
                            <Pressable
                                onPress={() => setTargetRIR(Math.max(0, targetRIR - 1))}
                                className="w-8 h-8 rounded-full bg-[#3A3A3C] items-center justify-center active:opacity-70"
                            >
                                <Text className="text-white text-lg font-bold">−</Text>
                            </Pressable>
                            <Text className="text-white text-lg font-bold w-6 text-center">
                                {targetRIR}
                            </Text>
                            <Pressable
                                onPress={() => setTargetRIR(Math.min(5, targetRIR + 1))}
                                className="w-8 h-8 rounded-full bg-[#3A3A3C] items-center justify-center active:opacity-70"
                            >
                                <Text className="text-white text-lg font-bold">+</Text>
                            </Pressable>
                        </View>
                    </View>
                </View>

                {/* ── SECTION 4 — STATS ──────────────────────── */}
                <View className="bg-[#242424] rounded-2xl px-4 py-3 mb-4">
                    <Text className="text-[#8E8E93] text-xs font-semibold uppercase tracking-wider mb-3">
                        Your Stats
                    </Text>

                    <View className="flex-row items-center justify-between py-3 border-b border-[#3A3A3C]">
                        <View className="flex-row items-center gap-3">
                            <Ionicons name="calendar-outline" size={20} color="#8E8E93" />
                            <Text className="text-white text-base">Total Workouts</Text>
                        </View>
                        <Text className="text-white font-bold text-base">{totalWorkouts}</Text>
                    </View>

                    <View className="flex-row items-center justify-between py-3">
                        <View className="flex-row items-center gap-3">
                            <Ionicons name="trophy-outline" size={20} color="#8E8E93" />
                            <Text className="text-white text-base">Favorite Exercise</Text>
                        </View>
                        <Text className="text-[#8E8E93] text-sm">Coming soon</Text>
                    </View>
                </View>

                {/* ── SECTION 5 — MY TEMPLATES ───────────────── */}
                <View className="bg-[#242424] rounded-2xl px-4 py-3 mb-4">
                    <View className="flex-row items-center justify-between mb-3">
                        <Text className="text-[#8E8E93] text-xs font-semibold uppercase tracking-wider">
                            My Templates
                        </Text>
                        <Pressable
                            onPress={() => router.push('/template/create')}
                            className="flex-row items-center gap-1 active:opacity-70"
                        >
                            <Ionicons name="add" size={16} color="#FF6000" />
                            <Text className="text-[#FF6000] text-sm font-semibold">New</Text>
                        </Pressable>
                    </View>

                    {templates.length === 0 ? (
                        <Text className="text-[#8E8E93] text-sm py-2 text-center">
                            No templates yet. Create your first one.
                        </Text>
                    ) : (
                        templates.map((template) => (
                            <View
                                key={template.id}
                                className="flex-row items-center justify-between py-3 border-b border-[#3A3A3C]"
                            >
                                <Pressable
                                    onPress={() => router.push(('/template/' + template.id) as never)}
                                    className="flex-1 active:opacity-70"
                                >
                                    <Text className="text-white font-semibold text-base">
                                        {template.name}
                                    </Text>
                                    <Text className="text-[#8E8E93] text-xs mt-0.5">
                                        {template.exercises.length} exercise
                                        {template.exercises.length !== 1 ? 's' : ''}
                                    </Text>
                                </Pressable>
                                <Pressable
                                    onPress={() => handleDeleteTemplate(template.id)}
                                    className="w-8 h-8 items-center justify-center active:opacity-70"
                                >
                                    <Ionicons name="trash-outline" size={18} color="#FF3B30" />
                                </Pressable>
                            </View>
                        ))
                    )}
                </View>

                {/* ── SECTION 6 — DANGER ZONE ────────────────── */}
                <View className="bg-[#242424] rounded-2xl px-4 py-3">
                    <Text className="text-[#8E8E93] text-xs font-semibold uppercase tracking-wider mb-3">
                        Danger Zone
                    </Text>

                    <Pressable
                        onPress={handleClearData}
                        className="flex-row items-center justify-between py-3 active:opacity-70"
                    >
                        <View className="flex-row items-center gap-3">
                            <Ionicons name="trash-outline" size={20} color="#FF3B30" />
                            <Text className="text-[#FF3B30] text-base font-semibold">
                                Clear All Data
                            </Text>
                        </View>
                        <Ionicons name="chevron-forward" size={18} color="#FF3B30" />
                    </Pressable>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}
