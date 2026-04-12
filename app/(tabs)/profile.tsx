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
    Switch,
    Text,
    TextInput,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { clearAllData } from '../../src/services/storage/database';
import { deleteAccount } from '../../src/services/api/userApi';
import { calculateStreak, STREAK_MILESTONES, StreakResult } from '../../src/services/storage/streakStorage';
import { postBodyWeight } from '../../src/services/api/weightApi';
import { getAllTemplates, deleteTemplate as deleteTemplateLocal } from '../../src/services/storage/templateStorage';
import { deleteTemplate as deleteTemplateApi } from '../../src/services/api/templateApi';
import { useAuthStore } from '../../src/store/authStore';
import { getWorkoutHistory } from '../../src/services/storage/workoutStorage';
import { getWeightHistoryDays, getTodayWeight, logWeight } from '../../src/services/storage/weightStorage';
import { useUserStore } from '../../src/store/userStore';
import { WorkoutTemplate } from '../../src/types/workout.types';
import { WeightLog } from '../../src/types/weight.types';
import WeightLineChart from '../../src/components/charts/WeightLineChart';

export default function ProfileScreen() {
    const { name, weightUnit, targetRIR, profilePhoto, restTimerDuration, autoStartRestTimer, setName, setWeightUnit, setTargetRIR, setProfilePhoto, setRestTimerDuration, setAutoStartRestTimer } =
        useUserStore();
    const { signOut } = useAuthStore();

    const router = useRouter();
    const [isEditingName, setIsEditingName] = useState<boolean>(false);
    const [draftName, setDraftName] = useState<string>(name);
    const [totalWorkouts, setTotalWorkouts] = useState<number>(0);
    const [templates, setTemplates] = useState<WorkoutTemplate[]>([]);
    const [weightHistory, setWeightHistory] = useState<WeightLog[]>([]);
    const [draftWeight, setDraftWeight] = useState<string>('');
    const [streak, setStreak] = useState<StreakResult | null>(null);

    const inputRef = useRef<TextInput>(null);

    useFocusEffect(
        useCallback(() => {
            getWorkoutHistory()
                .then((h) => setTotalWorkouts(h.length))
                .catch(() => setTotalWorkouts(0));
            getAllTemplates()
                .then((t) => setTemplates(t))
                .catch(() => setTemplates([]));
            getWeightHistoryDays(90)
                .then((w) => setWeightHistory(w))
                .catch(() => setWeightHistory([]));
            getTodayWeight()
                .then((w) => { if (w) setDraftWeight(String(w.weightKg)); })
                .catch(() => {});
            calculateStreak()
                .then((s) => setStreak(s))
                .catch(() => {});
        }, [])
    );

    const handleLogWeight = async () => {
        const kg = parseFloat(draftWeight.replace(',', '.'));
        if (isNaN(kg) || kg <= 0 || kg > 500) return;
        const today = new Date().toISOString().slice(0, 10);
        await logWeight(kg, today).catch(() => {});
        postBodyWeight(today, kg).catch(() => {});   // fire-and-forget
        const updated = await getWeightHistoryDays(90).catch(() => []);
        setWeightHistory(updated);
    };

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
                        await deleteTemplateLocal(id).catch(() => {});
                        setTemplates((prev) => prev.filter((t) => t.id !== id));
                        deleteTemplateApi(id).catch(() => {});
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

    const handleSignOut = () => {
        Alert.alert(
            'Sign Out',
            'Are you sure you want to sign out?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Sign Out',
                    style: 'destructive',
                    onPress: () => signOut(),
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
                        useUserStore.getState().reset();
                        setTotalWorkouts(0);
                        setTemplates([]);
                    },
                },
            ]
        );
    };

    const handleDeleteAccount = () => {
        Alert.alert(
            'Delete Account',
            'This will permanently delete your account and all your data. This action cannot be undone.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete Account',
                    style: 'destructive',
                    onPress: () => {
                        Alert.alert(
                            'Are you absolutely sure?',
                            'All your workouts, plans, and progress will be lost forever.',
                            [
                                { text: 'Cancel', style: 'cancel' },
                                {
                                    text: 'Yes, Delete Everything',
                                    style: 'destructive',
                                    onPress: async () => {
                                        try {
                                            await deleteAccount();
                                        } catch {
                                            // Backend deletion failed — still clear local data and sign out
                                        } finally {
                                            clearAllData();
                                            await signOut();
                                        }
                                    },
                                },
                            ]
                        );
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
            <SafeAreaView edges={["top"]} style={{ flex: 1 }}>
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

                        <View style={styles.divider} className="py-3">
                            <View className="flex-row items-center gap-3 mb-2.5">
                                <Ionicons name="timer-outline" size={20} color="rgba(255,255,255,0.5)" />
                                <Text style={styles.rowLabel}>Rest Timer</Text>
                            </View>
                            <View className="flex-row gap-2">
                                {([60, 90, 120, 180] as const).map((sec) => (
                                    <Pressable
                                        key={sec}
                                        onPress={() => setRestTimerDuration(sec)}
                                        style={[
                                            styles.pill,
                                            { flex: 1, alignItems: 'center' },
                                            restTimerDuration === sec ? styles.pillActive : styles.pillInactive,
                                        ]}
                                    >
                                        <Text style={[
                                            styles.pillText,
                                            restTimerDuration === sec ? styles.pillTextActive : styles.pillTextInactive,
                                        ]}>
                                            {sec < 120 ? `${sec}s` : `${sec / 60}m`}
                                        </Text>
                                    </Pressable>
                                ))}
                            </View>
                        </View>

                        <View className="flex-row items-center justify-between py-3">
                            <View className="flex-row items-center gap-3">
                                <Ionicons name="play-circle-outline" size={20} color="rgba(255,255,255,0.5)" />
                                <Text style={styles.rowLabel}>Auto-Start Rest</Text>
                            </View>
                            <Switch
                                value={autoStartRestTimer}
                                onValueChange={setAutoStartRestTimer}
                                trackColor={{ false: 'rgba(255,255,255,0.1)', true: '#FF6000' }}
                                thumbColor="white"
                            />
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

                    {/* ── ACHIEVEMENTS ──────────────────────── */}
                    <View style={styles.card} className="mb-4">
                        <Text style={styles.sectionLabel} className="mb-1">Achievements</Text>
                        {streak && (
                            <Text style={[styles.rowMuted, { fontSize: 12, marginBottom: 12 }]}>
                                {streak.currentStreak}w current · {streak.longestStreak}w best
                            </Text>
                        )}
                        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
                            {STREAK_MILESTONES.map((m) => {
                                const earned = (streak?.earnedMilestones ?? []).some(e => e.weeks === m.weeks);
                                return (
                                    <View
                                        key={m.weeks}
                                        style={[
                                            styles.badge,
                                            earned
                                                ? { borderColor: `${m.color}60`, backgroundColor: `${m.color}12` }
                                                : styles.badgeLocked,
                                        ]}
                                    >
                                        <Text style={{ fontSize: 22, opacity: earned ? 1 : 0.25 }}>
                                            {m.emoji}
                                        </Text>
                                        <Text style={[styles.badgeLabel, { color: earned ? m.color : 'rgba(255,255,255,0.25)' }]}>
                                            {m.label}
                                        </Text>
                                        <Text style={[styles.badgeWeeks, { color: earned ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.2)' }]}>
                                            {m.weeks}w
                                        </Text>
                                    </View>
                                );
                            })}
                        </View>
                    </View>

                    {/* ── BODY WEIGHT ───────────────────────── */}
                    <View style={styles.card} className="mb-4">
                        <Text style={styles.sectionLabel} className="mb-3">Body Weight</Text>

                        <View style={styles.divider} className="flex-row items-center justify-between py-3">
                            <View className="flex-row items-center gap-3">
                                <Ionicons name="scale-outline" size={20} color="rgba(255,255,255,0.5)" />
                                <TextInput
                                    value={draftWeight}
                                    onChangeText={setDraftWeight}
                                    onSubmitEditing={handleLogWeight}
                                    placeholder="kg"
                                    placeholderTextColor="rgba(255,255,255,0.3)"
                                    keyboardType="decimal-pad"
                                    returnKeyType="done"
                                    style={{ color: 'white', fontSize: 16, minWidth: 60 }}
                                />
                            </View>
                            <Pressable
                                onPress={handleLogWeight}
                                style={[styles.pill, styles.pillActive]}
                                className="active:opacity-70"
                            >
                                <Text style={[styles.pillText, styles.pillTextActive]}>Log</Text>
                            </Pressable>
                        </View>

                        {weightHistory.length >= 2 ? (
                            <View className="mt-3">
                                <WeightLineChart
                                    data={[...weightHistory].reverse()}
                                />
                            </View>
                        ) : weightHistory.length === 1 ? (
                            <Text style={styles.rowMuted} className="py-3 text-center text-xs">
                                Log again tomorrow to see your trend chart
                            </Text>
                        ) : null}

                        {weightHistory.length > 0 && (
                            <View className="flex-row items-center justify-between pt-3">
                                <Text style={styles.rowMuted}>Last logged</Text>
                                <Text style={styles.rowValue}>{weightHistory[0].weightKg} kg</Text>
                            </View>
                        )}
                    </View>

                    {/* ── MY TEMPLATES ──────────────────────── */}
                    <View style={styles.card} className="mb-4">
                        <View className="flex-row items-center justify-between mb-3">
                            <Text style={styles.sectionLabel}>My Workout Plans</Text>
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

                    {/* ── APP INFO ─────────────────────────── */}
                    <View style={styles.card} className="mb-4">
                        <Text style={styles.sectionLabel} className="mb-3">App</Text>

                        <Pressable
                            onPress={() => router.push('/connected-apps' as never)}
                            style={styles.divider}
                            className="flex-row items-center justify-between py-3 active:opacity-70"
                        >
                            <View className="flex-row items-center gap-3">
                                <Ionicons name="link-outline" size={20} color="rgba(255,255,255,0.5)" />
                                <Text style={styles.rowLabel}>Connected Apps</Text>
                            </View>
                            <Ionicons name="chevron-forward" size={18} color="rgba(255,255,255,0.4)" />
                        </Pressable>

                        <View style={styles.divider} className="flex-row items-center justify-between py-3">
                            <View className="flex-row items-center gap-3">
                                <Ionicons name="information-circle-outline" size={20} color="rgba(255,255,255,0.5)" />
                                <Text style={styles.rowLabel}>Version</Text>
                            </View>
                            <Text style={styles.rowMuted}>1.0.0</Text>
                        </View>

                        <View className="flex-row items-center justify-between py-3">
                            <View className="flex-row items-center gap-3">
                                <Ionicons name="heart-outline" size={20} color="rgba(255,255,255,0.5)" />
                                <Text style={styles.rowLabel}>Made by Alpgiray</Text>
                            </View>
                        </View>
                    </View>

                    {/* ── DANGER ZONE ───────────────────────── */}
                    <View style={styles.card}>
                        <Text style={styles.sectionLabel} className="mb-3">Danger Zone</Text>
                        <Pressable
                            onPress={handleSignOut}
                            style={styles.divider}
                            className="flex-row items-center justify-between py-3 active:opacity-70"
                        >
                            <View className="flex-row items-center gap-3">
                                <Ionicons name="log-out-outline" size={20} color="#FF3B30" />
                                <Text style={styles.dangerText}>Sign Out</Text>
                            </View>
                            <Ionicons name="chevron-forward" size={18} color="#FF3B30" />
                        </Pressable>
                        <Pressable
                            onPress={handleClearData}
                            style={styles.divider}
                            className="flex-row items-center justify-between py-3 active:opacity-70"
                        >
                            <View className="flex-row items-center gap-3">
                                <Ionicons name="trash-outline" size={20} color="#FF3B30" />
                                <Text style={styles.dangerText}>Clear All Data</Text>
                            </View>
                            <Ionicons name="chevron-forward" size={18} color="#FF3B30" />
                        </Pressable>
                        <Pressable
                            onPress={handleDeleteAccount}
                            className="flex-row items-center justify-between py-3 active:opacity-70"
                        >
                            <View className="flex-row items-center gap-3">
                                <Ionicons name="person-remove-outline" size={20} color="#FF3B30" />
                                <View>
                                    <Text style={styles.dangerText}>Delete Account</Text>
                                    <Text style={{ color: 'rgba(255,59,48,0.5)', fontSize: 11, fontFamily: 'Outfit_400Regular' }}>
                                        Permanently removes all data
                                    </Text>
                                </View>
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
    badge: {
        flex: 1,
        minWidth: '28%',
        alignItems: 'center',
        borderWidth: 1,
        borderRadius: 14,
        paddingVertical: 10,
        paddingHorizontal: 6,
        gap: 3,
    },
    badgeLocked: {
        borderColor: 'rgba(255,255,255,0.08)',
        backgroundColor: 'rgba(255,255,255,0.03)',
    },
    badgeLabel: {
        fontSize: 10,
        fontWeight: '600',
        textAlign: 'center',
    },
    badgeWeeks: {
        fontSize: 10,
    },
});
