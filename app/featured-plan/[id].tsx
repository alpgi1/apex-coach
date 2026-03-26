import { Ionicons } from '@expo/vector-icons';
import * as Crypto from 'expo-crypto';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import {
    Alert,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import AnimatedBackground from '../../src/components/layout/AnimatedBackground';
import { FEATURED_PLANS } from '../../src/data/featuredPlans';
import { createTemplate } from '../../src/services/api/templateApi';
import db from '../../src/services/storage/database';
import { DEFAULT_EXERCISES } from '../../src/services/storage/defaultExercises';
import { seedExercises } from '../../src/services/storage/exerciseStorage';
import { saveTemplate } from '../../src/services/storage/templateStorage';
import { useAuthStore } from '../../src/store/authStore';
import { WorkoutTemplate } from '../../src/types/workout.types';

const EXERCISE_NAME_MAP: Record<string, string> = Object.fromEntries(
    DEFAULT_EXERCISES.map((e) => [e.id, e.name])
);

/* ─────────────────────────── screen ────────────────────────── */

export default function FeaturedPlanDetailScreen() {
    const router = useRouter();
    const { id } = useLocalSearchParams<{ id: string }>();

    const plan = FEATURED_PLANS.find((p) => p.id === id) ?? null;
    const [isSaving, setIsSaving] = useState(false);

    /* ── add to my plans ─────────────────────────────────────── */
    const handleAddToMyPlans = async () => {
        if (!plan) return;

        Alert.alert(
            'Add to My Plans',
            `This will add ${plan.sessions.length} workout${plan.sessions.length !== 1 ? 's' : ''} from "${plan.name}" to your plans.`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Add',
                    onPress: async () => {
                        setIsSaving(true);
                        try {
                            await seedExercises(); // Guarantee DB is fully synced before foreign key checks

                            // Resolve the active DB IDs for exercises (because backend sync renames them safely)
                            const allDbExercises = await db.getAllAsync<{ id: string, name: string }>(
                                `SELECT id, name FROM exercises WHERE isCustom = 0`
                            );
                            const nameToActiveId = Object.fromEntries(allDbExercises.map(e => [e.name, e.id]));

                            for (const session of plan.sessions) {
                                const now = new Date().toISOString();
                                const templateId = Crypto.randomUUID();
                                const exerciseIds = session.exercises.map(() => Crypto.randomUUID());
                                const template: WorkoutTemplate = {
                                    id: templateId,
                                    name: session.name,
                                    description: plan.description,
                                    primaryMuscleGroups: [],
                                    createdAt: now,
                                    updatedAt: now,
                                    exercises: session.exercises.map((ex, idx) => {
                                        const name = EXERCISE_NAME_MAP[ex.exerciseId];
                                        return {
                                            id: exerciseIds[idx],
                                            exerciseId: (name && nameToActiveId[name]) ? nameToActiveId[name] : ex.exerciseId,
                                            order: idx,
                                            targetSets: ex.targetSets,
                                            targetRepsMin: ex.targetRepsMin,
                                            targetRepsMax: ex.targetRepsMax,
                                        };
                                    }),
                                };
                                await saveTemplate(template);
                                if (useAuthStore.getState().session) {
                                    createTemplate({
                                        name: template.name,
                                        description: template.description,
                                        exercises: template.exercises,
                                        primaryMuscleGroups: template.primaryMuscleGroups,
                                    }).catch(() => {});
                                }
                            }
                            Alert.alert(
                                'Added!',
                                `${plan.sessions.length} workout${plan.sessions.length !== 1 ? 's' : ''} added to your plans.`,
                                [{ text: 'OK', onPress: () => router.back() }]
                            );
                        } catch (error: any) {
                            console.error('Failed to save featured plan:', error);
                            Alert.alert('Error', `Could not add plans. ${error?.message || 'Please try again.'}`);
                        } finally {
                            setIsSaving(false);
                        }
                    },
                },
            ]
        );
    };

    if (!plan) {
        return (
            <View style={styles.root}>
                <AnimatedBackground />
                <SafeAreaView edges={['top']} style={styles.center}>
                    <Text style={styles.emptyText}>Plan not found</Text>
                    <Pressable onPress={() => router.back()} style={styles.backBtn}>
                        <Text style={styles.backBtnText}>Go Back</Text>
                    </Pressable>
                </SafeAreaView>
            </View>
        );
    }

    return (
        <View style={styles.root}>
            <AnimatedBackground />

            <SafeAreaView style={{ flex: 1 }} edges={['top']}>
                {/* ── HEADER ── */}
                <View style={styles.header}>
                    <Pressable onPress={() => router.back()} style={styles.headerBtn}>
                        <Ionicons name="arrow-back" size={22} color="white" />
                    </Pressable>
                    <Text style={styles.headerTitle} numberOfLines={1}>
                        {plan.name}
                    </Text>
                    <View style={{ width: 40 }} />
                </View>

                <ScrollView
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{ paddingBottom: 120 }}
                >
                    {/* ── PLAN HERO ── */}
                    <View style={styles.heroCard}>
                        <View style={[styles.heroIcon, { backgroundColor: plan.color + '22' }]}>
                            <Text style={[styles.heroAbbreviation, { color: plan.color }]}>{plan.abbreviation}</Text>
                        </View>
                        <View style={{ flex: 1 }}>
                            <View style={styles.heroTagRow}>
                                <View style={[styles.tag, { backgroundColor: plan.color + '22', borderColor: plan.color + '44' }]}>
                                    <Text style={[styles.tagText, { color: plan.color }]}>{plan.tag}</Text>
                                </View>
                                <View style={[styles.tag, { backgroundColor: 'rgba(255,255,255,0.06)', borderColor: 'rgba(255,255,255,0.1)' }]}>
                                    <Ionicons name="calendar-outline" size={11} color="rgba(255,255,255,0.45)" />
                                    <Text style={styles.tagTextDim}>{plan.daysPerWeek} days/week</Text>
                                </View>
                            </View>
                            <Text style={styles.heroDesc}>{plan.description}</Text>
                        </View>
                    </View>

                    {/* ── SESSIONS ── */}
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionLabel}>WORKOUTS</Text>
                        <Text style={styles.sectionCount}>{plan.sessions.length} sessions</Text>
                    </View>

                    {plan.sessions.map((session, sIdx) => (
                        <View key={sIdx} style={styles.sessionCard}>
                            <View style={styles.sessionHeader}>
                                <View style={[styles.sessionNum, { backgroundColor: plan.color + '22' }]}>
                                    <Text style={[styles.sessionNumText, { color: plan.color }]}>{sIdx + 1}</Text>
                                </View>
                                <Text style={styles.sessionName}>{session.name}</Text>
                                <Text style={styles.sessionExCount}>
                                    {session.exercises.length} exercises
                                </Text>
                            </View>

                            {session.exercises.map((ex, eIdx) => (
                                <View
                                    key={eIdx}
                                    style={[
                                        styles.exerciseRow,
                                        eIdx === session.exercises.length - 1 && { borderBottomWidth: 0 },
                                    ]}
                                >
                                    <Text style={styles.exerciseName} numberOfLines={1}>
                                        {EXERCISE_NAME_MAP[ex.exerciseId] ?? ex.exerciseId}
                                    </Text>
                                    <Text style={styles.exerciseSets}>
                                        {ex.targetSets} × {ex.targetRepsMin}
                                        {ex.targetRepsMax !== ex.targetRepsMin ? `–${ex.targetRepsMax}` : ''}
                                    </Text>
                                </View>
                            ))}
                        </View>
                    ))}
                </ScrollView>

                {/* ── ADD TO MY PLANS BUTTON ── */}
                <View style={styles.bottomBar}>
                    <Pressable
                        onPress={handleAddToMyPlans}
                        disabled={isSaving}
                        style={[styles.addBtn, { backgroundColor: plan.color }]}
                        className="active:opacity-80"
                    >
                        <Ionicons name="add-circle-outline" size={20} color="white" />
                        <Text style={styles.addBtnText}>
                            {isSaving ? 'Adding...' : 'Add to My Plans'}
                        </Text>
                    </Pressable>
                </View>
            </SafeAreaView>
        </View>
    );
}

/* ─────────────────────────── styles ────────────────────────── */

const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: '#0A0A0A' },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    header: {
        flexDirection: 'row', alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16, paddingVertical: 10,
    },
    headerBtn: {
        width: 40, height: 40, borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.08)',
        alignItems: 'center', justifyContent: 'center',
    },
    headerTitle: {
        color: 'white', fontSize: 18, fontWeight: 'bold',
        fontFamily: 'Outfit_700Bold', flex: 1,
        textAlign: 'center', marginHorizontal: 8,
    },
    /* hero */
    heroCard: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 14,
        marginHorizontal: 16,
        marginBottom: 24,
        backgroundColor: 'rgba(255,255,255,0.04)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
        borderRadius: 18,
        padding: 16,
    },
    heroIcon: {
        width: 56, height: 56, borderRadius: 16,
        alignItems: 'center', justifyContent: 'center',
    },
    heroAbbreviation: { 
        fontSize: 22, 
        fontFamily: 'Outfit_700Bold',
        fontStyle: 'italic',
        letterSpacing: 0.5,
    },
    heroTagRow: { flexDirection: 'row', gap: 6, marginBottom: 8 },
    tag: {
        flexDirection: 'row', alignItems: 'center', gap: 4,
        borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3,
        borderWidth: 1,
    },
    tagText: { fontSize: 11, fontFamily: 'Outfit_600SemiBold' },
    tagTextDim: {
        fontSize: 11, fontFamily: 'Outfit_500Medium',
        color: 'rgba(255,255,255,0.45)',
    },
    heroDesc: {
        color: 'rgba(255,255,255,0.55)',
        fontSize: 13,
        fontFamily: 'Outfit_400Regular',
        lineHeight: 19,
    },
    /* section header */
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        marginBottom: 10,
    },
    sectionLabel: {
        color: 'rgba(255,255,255,0.35)',
        fontSize: 11, fontFamily: 'Outfit_600SemiBold',
        letterSpacing: 1, textTransform: 'uppercase',
    },
    sectionCount: {
        color: 'rgba(255,255,255,0.25)',
        fontSize: 12, fontFamily: 'Outfit_500Medium',
    },
    /* session card */
    sessionCard: {
        marginHorizontal: 16, marginBottom: 12,
        backgroundColor: 'rgba(255,255,255,0.04)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
        borderRadius: 16,
        overflow: 'hidden',
    },
    sessionHeader: {
        flexDirection: 'row', alignItems: 'center', gap: 10,
        paddingHorizontal: 14, paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.06)',
    },
    sessionNum: {
        width: 26, height: 26, borderRadius: 8,
        alignItems: 'center', justifyContent: 'center',
    },
    sessionNumText: {
        fontSize: 12, fontFamily: 'Outfit_700Bold',
    },
    sessionName: {
        flex: 1, color: '#FFFFFF',
        fontSize: 15, fontFamily: 'Outfit_600SemiBold',
    },
    sessionExCount: {
        color: 'rgba(255,255,255,0.3)',
        fontSize: 12, fontFamily: 'Outfit_500Medium',
    },
    /* exercise row */
    exerciseRow: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 14, paddingVertical: 10,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: 'rgba(255,255,255,0.06)',
    },
    exerciseName: {
        flex: 1, color: 'rgba(255,255,255,0.7)',
        fontSize: 14, fontFamily: 'Outfit_400Regular',
        marginRight: 8,
    },
    exerciseSets: {
        color: 'rgba(255,255,255,0.35)',
        fontSize: 13, fontFamily: 'Outfit_600SemiBold',
    },
    /* bottom bar */
    bottomBar: {
        position: 'absolute', bottom: 0, left: 0, right: 0,
        paddingHorizontal: 16, paddingBottom: 24, paddingTop: 12,
        backgroundColor: 'rgba(10,10,10,0.85)',
    },
    addBtn: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        gap: 8, borderRadius: 999, paddingVertical: 15,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
    addBtnText: {
        color: 'white', fontSize: 16, fontFamily: 'Outfit_700Bold',
    },
    /* error state */
    emptyText: {
        color: 'rgba(255,255,255,0.4)', fontSize: 15,
        fontFamily: 'Outfit_500Medium', marginBottom: 16,
    },
    backBtn: {
        backgroundColor: '#FF6000', paddingHorizontal: 24,
        paddingVertical: 10, borderRadius: 12,
    },
    backBtnText: {
        color: 'white', fontSize: 15, fontWeight: '600',
        fontFamily: 'Outfit_600SemiBold',
    },
});
