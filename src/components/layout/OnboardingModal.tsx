import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Modal, Pressable, Text, TextInput, View } from 'react-native';

interface Props {
    isVisible: boolean;
    onComplete: (name: string) => void;
}

export default function OnboardingModal({ isVisible, onComplete }: Props) {
    const [inputValue, setInputValue] = useState<string>('');
    const [isFocused, setIsFocused] = useState<boolean>(false);

    const canComplete = inputValue.trim().length > 0;

    const handleComplete = () => {
        const name = inputValue.trim();
        if (!name) return;
        onComplete(name);
    };

    return (
        <Modal animationType="fade" transparent visible={isVisible} statusBarTranslucent>
            <View className="flex-1 bg-[#1A1A1A] justify-center px-6">
                {/* Icon */}
                <View className="items-center">
                    <Ionicons name="barbell" size={64} color="#FF6000" />
                </View>

                {/* Headline */}
                <Text className="text-white text-3xl font-bold text-center mt-6">
                    Welcome to Apex Coach
                </Text>
                <Text className="text-[#8E8E93] text-base text-center mt-2">
                    Built for serious lifters.
                </Text>

                <View className="h-10" />

                {/* Name input */}
                <Text className="text-[#8E8E93] text-sm mb-2">
                    What should we call you?
                </Text>
                <TextInput
                    value={inputValue}
                    onChangeText={setInputValue}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    onSubmitEditing={handleComplete}
                    placeholder="e.g. Alex"
                    placeholderTextColor="#8E8E93"
                    autoFocus
                    returnKeyType="done"
                    className={`bg-[#242424] rounded-xl px-4 py-3.5 text-white text-base ${
                        isFocused ? 'border border-[#FF6000]' : 'border border-transparent'
                    }`}
                />

                {/* CTA button */}
                <Pressable
                    onPress={handleComplete}
                    disabled={!canComplete}
                    className={`mt-4 bg-[#FF6000] rounded-full h-[52px] items-center justify-center active:opacity-80 ${
                        !canComplete ? 'opacity-50' : ''
                    }`}
                >
                    <Text className="text-white text-base font-bold">Let's Go →</Text>
                </Pressable>

                <Text className="text-[#8E8E93] text-xs text-center mt-3">
                    You can change this later in Profile
                </Text>
            </View>
        </Modal>
    );
}
