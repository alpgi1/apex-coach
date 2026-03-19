import { useEffect, useState } from 'react';
import {
    KeyboardAvoidingView,
    Modal,
    Platform,
    Pressable,
    ScrollView,
    Text,
    TextInput,
    View,
} from 'react-native';

import { getAllTemplates } from '../../services/storage/templateStorage';
import { WorkoutTemplate } from '../../types/workout.types';

interface Props {
    isVisible: boolean;
    onClose: () => void;
    onStart: (name: string, template?: WorkoutTemplate) => void;
}

const QUICK_PICKS = ['Push Day', 'Pull Day', 'Leg Day', 'Upper Body', 'Full Body'];

export default function StartWorkoutModal({ isVisible, onClose, onStart }: Props) {
    const [inputValue, setInputValue] = useState<string>('');
    const [selectedPill, setSelectedPill] = useState<string | null>(null);
    const [selectedTemplate, setSelectedTemplate] = useState<WorkoutTemplate | null>(null);
    const [isFocused, setIsFocused] = useState<boolean>(false);
    const [templates, setTemplates] = useState<WorkoutTemplate[]>([]);

    useEffect(() => {
        if (!isVisible) return;
        getAllTemplates().then(setTemplates).catch(() => {});
    }, [isVisible]);

    const handleClose = () => {
        setInputValue('');
        setSelectedPill(null);
        setSelectedTemplate(null);
        setIsFocused(false);
        onClose();
    };

    const handleStart = () => {
        const name = inputValue.trim();
        if (!name) return;
        onStart(name, selectedTemplate ?? undefined);
        setInputValue('');
        setSelectedPill(null);
        setSelectedTemplate(null);
        setIsFocused(false);
        onClose();
    };

    const handlePillPress = (name: string) => {
        setInputValue(name);
        setSelectedPill(name);
    };

    const handleTextChange = (text: string) => {
        setInputValue(text);
        setSelectedPill(null);
        setSelectedTemplate(null);
    };

    const handleTemplatePress = (template: WorkoutTemplate) => {
        setInputValue(template.name);
        setSelectedTemplate(template);
        setSelectedPill(null);
    };

    const canStart = inputValue.trim().length > 0;

    return (
        <Modal
            animationType="slide"
            transparent
            visible={isVisible}
            onRequestClose={handleClose}
            statusBarTranslucent
        >
            <View className="flex-1 justify-end">
                {/* Backdrop */}
                <Pressable
                    className="absolute inset-0 bg-black/50"
                    onPress={handleClose}
                />

                {/* Sheet */}
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                >
                    <View className="bg-[#1A1A1A] rounded-t-3xl pb-10">
                        {/* Handle bar */}
                        <View className="items-center pt-3 pb-2">
                            <View className="w-10 h-1 rounded-full bg-[#3A3A3C]" />
                        </View>

                        <ScrollView
                            keyboardShouldPersistTaps="handled"
                            className="px-5 pt-2"
                        >
                            {/* Header */}
                            <Text className="text-white text-xl font-outfit-bold mb-1">
                                Start New Workout
                            </Text>
                            <Text className="text-[#8E8E93] text-sm mb-5">
                                Name your session
                            </Text>

                            {/* Text input */}
                            <TextInput
                                value={inputValue}
                                onChangeText={handleTextChange}
                                onFocus={() => setIsFocused(true)}
                                onBlur={() => setIsFocused(false)}
                                placeholder="e.g. Push Day"
                                placeholderTextColor="#8E8E93"
                                autoFocus
                                returnKeyType="done"
                                onSubmitEditing={handleStart}
                                className={`bg-[#242424] rounded-xl px-4 py-3.5 text-white text-base mb-5 ${
                                    isFocused ? 'border border-[#FF6000]' : 'border border-transparent'
                                }`}
                            />

                            {/* My Templates — only if any exist */}
                            {templates.length > 0 && (
                                <View className="mb-5">
                                    <Text className="text-[#8E8E93] text-xs font-outfit-semibold mb-3 uppercase tracking-wider">
                                        My Templates
                                    </Text>
                                    <ScrollView
                                        horizontal
                                        showsHorizontalScrollIndicator={false}
                                        keyboardShouldPersistTaps="handled"
                                        contentContainerStyle={{ gap: 8 }}
                                    >
                                        {templates.map((template) => {
                                            const isSelected = selectedTemplate?.id === template.id;
                                            return (
                                                <Pressable
                                                    key={template.id}
                                                    onPress={() => handleTemplatePress(template)}
                                                    className={`bg-[#242424] rounded-xl px-3 py-2.5 active:opacity-80 ${
                                                        isSelected ? 'border border-[#FF6000]' : 'border border-transparent'
                                                    }`}
                                                >
                                                    <Text className="text-white text-sm font-outfit-bold">
                                                        {template.name}
                                                    </Text>
                                                    <Text className="text-[#8E8E93] text-xs mt-0.5">
                                                        {template.exercises.length} exercise
                                                        {template.exercises.length !== 1 ? 's' : ''}
                                                    </Text>
                                                </Pressable>
                                            );
                                        })}
                                    </ScrollView>
                                </View>
                            )}

                            {/* Quick select */}
                            <Text className="text-[#8E8E93] text-xs font-outfit-semibold mb-3 uppercase tracking-wider">
                                Quick Select
                            </Text>
                            <View className="flex-row flex-wrap gap-2 mb-6">
                                {QUICK_PICKS.map((name) => {
                                    const isSelected = selectedPill === name;
                                    return (
                                        <Pressable
                                            key={name}
                                            onPress={() => handlePillPress(name)}
                                            className={`rounded-full px-3 py-1.5 active:opacity-80 ${
                                                isSelected
                                                    ? 'bg-[#FF6000]/20 border border-[#FF6000]'
                                                    : 'bg-[#242424]'
                                            }`}
                                        >
                                            <Text
                                                className={`text-sm font-medium ${
                                                    isSelected
                                                        ? 'text-[#FF6000]'
                                                        : 'text-[#8E8E93]'
                                                }`}
                                            >
                                                {name}
                                            </Text>
                                        </Pressable>
                                    );
                                })}
                            </View>

                            {/* Bottom buttons */}
                            <View className="flex-row gap-3">
                                <Pressable
                                    onPress={handleClose}
                                    className="flex-1 bg-[#242424] rounded-full h-[52px] items-center justify-center active:opacity-70"
                                >
                                    <Text className="text-white text-base font-outfit-semibold">
                                        Cancel
                                    </Text>
                                </Pressable>

                                <Pressable
                                    onPress={handleStart}
                                    disabled={!canStart}
                                    className={`flex-1 bg-[#FF6000] rounded-full h-[52px] items-center justify-center flex-row active:opacity-80 ${
                                        !canStart ? 'opacity-50' : ''
                                    }`}
                                >
                                    <Text className="text-white text-base font-outfit-bold mr-1">
                                        Start Workout
                                    </Text>
                                    <Text className="text-white text-base font-outfit-bold">→</Text>
                                </Pressable>
                            </View>
                        </ScrollView>
                    </View>
                </KeyboardAvoidingView>
            </View>
        </Modal>
    );
}
