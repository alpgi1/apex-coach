import { useState } from 'react';
import {
    KeyboardAvoidingView,
    Modal,
    Platform,
    Pressable,
    Text,
    TextInput,
    View,
} from 'react-native';

interface Props {
    isVisible: boolean;
    onClose: () => void;
    onStart: (name: string) => void;
}

const QUICK_PICKS = ['Push Day', 'Pull Day', 'Leg Day', 'Upper Body', 'Full Body'];

export default function StartWorkoutModal({ isVisible, onClose, onStart }: Props) {
    const [inputValue, setInputValue] = useState<string>('');
    const [selectedPill, setSelectedPill] = useState<string | null>(null);
    const [isFocused, setIsFocused] = useState<boolean>(false);

    const handleClose = () => {
        setInputValue('');
        setSelectedPill(null);
        setIsFocused(false);
        onClose();
    };

    const handleStart = () => {
        const name = inputValue.trim();
        if (!name) return;
        onStart(name);
        setInputValue('');
        setSelectedPill(null);
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

                        <View className="px-5 pt-2">
                            {/* Header */}
                            <Text className="text-white text-xl font-bold mb-1">
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

                            {/* Quick select */}
                            <Text className="text-[#8E8E93] text-xs font-semibold mb-3 uppercase tracking-wider">
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
                                    <Text className="text-white text-base font-semibold">
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
                                    <Text className="text-white text-base font-bold mr-1">
                                        Start Workout
                                    </Text>
                                    <Text className="text-white text-base font-bold">→</Text>
                                </Pressable>
                            </View>
                        </View>
                    </View>
                </KeyboardAvoidingView>
            </View>
        </Modal>
    );
}
