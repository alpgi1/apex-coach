import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import AnimatedBackground from '../../src/components/layout/AnimatedBackground';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import {
    Alert,
    Image,
    Pressable,
    ScrollView,
    StyleSheet,
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
    const { name, weightUnit, targetRIR, profilePhoto, setName, setWeightUnit, setTargetRIR, setProfilePhoto } =
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

    const handlePickPhoto = async () => {
        const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permission.granted) return;

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
        });

        if (!result.canceled) {
            setProfilePhoto(result.assets[0].uri);
        }
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
        <View style={styles.root}>
            {/* ── BACKGROUND MESH ───────────────────────────── */}
            <AnimatedBackground />

            {/* ── CONTENT ───────────────────────────────────── */}
            <SafeAreaView style={{ flex: 1 }}>
                <ScrollView
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.scrollContent}
                >
                    {/* ── AVATAR + NAME ─────────────────────── */}
                    <View className="items-center pt-6 pb-8">
                        <Pressable onPress={handlePickPhoto} style={styles.avatar}>
                            {profilePhoto ? (
                                <Image source={{ uri: profilePhoto }} style={styles.avatarImg} />
                            ) : (
                                <Ionicons name="person" size={40} color="rgba(255,255,255,0.5)" />
                            )}
                            <View style={styles.cameraOverlay}>
                                <Ionicons name="camera" size={12} color="white" />
                            </View>
                        </Pressable>

                        {isEditingName ? (
                            <View className="flex-row items-center gap-2 mt-3">
                                <TextInput
                                    ref={inputRef}
                                    value={draftName}
                                    onChangeText={setDraftName}
                                    onSubmitEditing={handleConfirmName}
                                    returnKeyType="done"
                                    placeholder="Your name"
                                    placeholderTextColor="rgba(255,255,255,0.3)"
                                    style={styles.nameInput}
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
                            <Pressable onPress={handleStartEdit} style={styles.nameRow}>
                                <Text style={styles.nameText}>{name || 'Lifter'}</Text>
                                <Ionicons name="pencil" size={14} color="rgba(255,255,255,0.4)" style={{ marginLeft: 6 }} />
                            </Pressable>
                        )}
                        <Text style={styles.nameSub}>Tap name to edit</Text>
                    </View>

                    {/* ── PREFERENCES ───────────────────────── */}
                    <View style={styles.card} className="mb-4">
                        <Text style={styles.sectionLabel} className="mb-3">Preferences</Text>

                        <View style={styles.divider} className="flex-row items-center justify-between py-3">
                            <View className="flex-row items-center gap-3">
                                <Ionicons name="barbell-outline" size={20} color="rgba(255,255,255,0.5)" />
                                <Text style={styles.rowLabel}>Weight Unit</Text>
                            </View>
                            <View className="flex-row gap-2">
                                {(['KG', 'LBS'] as const).map((unit) => (
                                    <Pressable
                                        key={unit}
                                        onPress={() => setWeightUnit(unit)}
                                        style={[
                                            styles.pill,
                                            weightUnit === unit ? styles.pillActive : styles.pillInactive,
                                        ]}
                                    >
                                        <Text style={[
                                            styles.pillText,
                                            weightUnit === unit ? styles.pillTextActive : styles.pillTextInactive,
                                        ]}>
                                            {unit}
                                        </Text>
                                    </Pressable>
                                ))}
                            </View>
                        </View>

                        <View className="flex-row items-center justify-between py-3">
                            <View className="flex-row items-center gap-3">
                                <Ionicons name="flame-outline" size={20} color="rgba(255,255,255,0.5)" />
                                <Text style={styles.rowLabel}>Target RIR</Text>
                            </View>
                            <View className="flex-row items-center gap-3">
                                <Pressable
                                    onPress={() => setTargetRIR(Math.max(0, targetRIR - 1))}
                                    style={styles.stepper}
                                >
                                    <Text style={styles.stepperText}>−</Text>
                                </Pressable>
                                <Text style={styles.stepperValue}>{targetRIR}</Text>
                                <Pressable
                                    onPress={() => setTargetRIR(Math.min(5, targetRIR + 1))}
                                    style={styles.stepper}
                                >
                                    <Text style={styles.stepperText}>+</Text>
                                </Pressable>
                            </View>
                        </View>
                    </View>

                    {/* ── YOUR STATS ────────────────────────── */}
                    <View style={styles.card} className="mb-4">
                        <Text style={styles.sectionLabel} className="mb-3">Your Stats</Text>

                        <Pressable
                            onPress={() => router.push('/records')}
                            style={styles.topDivider}
                            className="flex-row items-center justify-between py-3 active:opacity-70"
                        >
                            <View className="flex-row items-center gap-3">
                                <Ionicons name="trophy-outline" size={20} color="#FFD60A" />
                                <Text style={styles.rowLabel}>Personal Records</Text>
                            </View>
                            <Ionicons name="chevron-forward" size={18} color="rgba(255,255,255,0.4)" />
                        </Pressable>

                        <View style={styles.divider} className="flex-row items-center justify-between py-3">
                            <View className="flex-row items-center gap-3">
                                <Ionicons name="calendar-outline" size={20} color="rgba(255,255,255,0.5)" />
                                <Text style={styles.rowLabel}>Total Workouts</Text>
                            </View>
                            <Text style={styles.rowValue}>{totalWorkouts}</Text>
                        </View>

                        <View className="flex-row items-center justify-between py-3">
                            <View className="flex-row items-center gap-3">
                                <Ionicons name="star-outline" size={20} color="rgba(255,255,255,0.5)" />
                                <Text style={styles.rowLabel}>Favorite Exercise</Text>
                            </View>
                            <Text style={styles.rowMuted}>Coming soon</Text>
                        </View>
                    </View>

                    {/* ── MY TEMPLATES ──────────────────────── */}
                    <View style={styles.card} className="mb-4">
                        <View className="flex-row items-center justify-between mb-3">
                            <Text style={styles.sectionLabel}>My Templates</Text>
                            <Pressable
                                onPress={() => router.push('/template/create')}
                                className="flex-row items-center gap-1 active:opacity-70"
                            >
                                <Ionicons name="add" size={16} color="#FF6000" />
                                <Text className="text-[#FF6000] text-sm font-outfit-semibold">New</Text>
                            </Pressable>
                        </View>

                        {templates.length === 0 ? (
                            <Text style={styles.emptyText} className="py-2 text-center">
                                No templates yet. Create your first one.
                            </Text>
                        ) : (
                            templates.map((template) => (
                                <View
                                    key={template.id}
                                    style={styles.divider}
                                    className="flex-row items-center justify-between py-3"
                                >
                                    <Pressable
                                        onPress={() => router.push(('/template/' + template.id) as never)}
                                        className="flex-1 active:opacity-70"
                                    >
                                        <Text style={styles.rowLabel} className="font-outfit-semibold">
                                            {template.name}
                                        </Text>
                                        <Text style={styles.rowMuted} className="mt-0.5 text-xs">
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

                    {/* ── DANGER ZONE ───────────────────────── */}
                    <View style={styles.card}>
                        <Text style={styles.sectionLabel} className="mb-3">Danger Zone</Text>
                        <Pressable
                            onPress={handleClearData}
                            className="flex-row items-center justify-between py-3 active:opacity-70"
                        >
                            <View className="flex-row items-center gap-3">
                                <Ionicons name="trash-outline" size={20} color="#FF3B30" />
                                <Text style={styles.dangerText}>Clear All Data</Text>
                            </View>
                            <Ionicons name="chevron-forward" size={18} color="#FF3B30" />
                        </Pressable>
                    </View>
                </ScrollView>
            </SafeAreaView>
        </View>
    );
}

const styles = StyleSheet.create({
    root: {
        flex: 1,
        backgroundColor: '#0A0A0A',
    },
    scrollContent: {
        paddingHorizontal: 16,
        paddingBottom: 110,
    },
    /* avatar */
    avatar: {
        width: 88,
        height: 88,
        borderRadius: 44,
        backgroundColor: 'rgba(255,255,255,0.1)',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        borderWidth: 2,
        borderColor: 'rgba(255,255,255,0.2)',
    },
    avatarImg: {
        width: 88,
        height: 88,
        borderRadius: 44,
    },
    cameraOverlay: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 26,
        backgroundColor: 'rgba(0,0,0,0.5)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    nameInput: {
        color: 'white',
        fontSize: 20,
        fontWeight: 'bold',
        borderBottomWidth: 1,
        borderBottomColor: '#FF6000',
        paddingBottom: 4,
        minWidth: 120,
        textAlign: 'center',
    },
    nameRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 14,
    },
    nameText: {
        color: 'white',
        fontSize: 24,
        fontWeight: 'bold',
    },
    nameSub: {
        color: 'rgba(255,255,255,0.4)',
        fontSize: 12,
        marginTop: 4,
    },
    /* cards */
    card: {
        backgroundColor: 'rgba(255,255,255,0.07)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        borderRadius: 16,
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    sectionLabel: {
        color: 'rgba(255,255,255,0.4)',
        fontSize: 11,
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    divider: {
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: 'rgba(255,255,255,0.1)',
    },
    topDivider: {
        borderTopWidth: StyleSheet.hairlineWidth,
        borderTopColor: 'rgba(255,255,255,0.1)',
    },
    rowLabel: {
        color: 'white',
        fontSize: 16,
    },
    rowValue: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 16,
    },
    rowMuted: {
        color: 'rgba(255,255,255,0.5)',
        fontSize: 14,
    },
    emptyText: {
        color: 'rgba(255,255,255,0.5)',
        fontSize: 14,
    },
    dangerText: {
        color: '#FF3B30',
        fontSize: 16,
        fontWeight: '600',
    },
    /* preference controls */
    pill: {
        paddingHorizontal: 16,
        paddingVertical: 6,
        borderRadius: 999,
    },
    pillActive: {
        backgroundColor: '#FF6000',
    },
    pillInactive: {
        backgroundColor: 'rgba(255,255,255,0.1)',
    },
    pillText: {
        fontSize: 14,
        fontWeight: '600',
    },
    pillTextActive: {
        color: 'white',
    },
    pillTextInactive: {
        color: 'rgba(255,255,255,0.5)',
    },
    stepper: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: 'rgba(255,255,255,0.1)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    stepperText: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
    },
    stepperValue: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
        width: 24,
        textAlign: 'center',
    },
});
