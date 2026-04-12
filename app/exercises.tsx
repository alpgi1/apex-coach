import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    Image,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import AnimatedBackground from '../src/components/layout/AnimatedBackground';
import { getAllExercises, searchExercises } from '../src/services/storage/exerciseStorage';
import { ExerciseMetadata, MuscleGroup } from '../src/types/exercise.types';

/* ────────────────────────── constants ──────────────────────── */

const MUSCLE_GROUPS: MuscleGroup[] = [
    'CHEST', 'BACK', 'LEGS', 'SHOULDERS', 'ARMS', 'CORE', 'FULL_BODY',
];

const formatLabel = (raw: string): string =>
    raw
        .replace(/_/g, ' ')
        .toLowerCase()
        .replace(/\b\w/g, (c) => c.toUpperCase());

const MUSCLE_GROUP_COLORS: Record<string, string> = {
    CHEST:     '#E05252',
    BACK:      '#5B8DEF',
    LEGS:      '#52B788',
    SHOULDERS: '#F4A261',
    ARMS:      '#9B72CF',
    CORE:      '#E9C46A',
    FULL_BODY: '#FF6000',
};

const getInitials = (name: string): string => {
    const words = name.trim().split(/\s+/);
    if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
    return (words[0][0] + words[1][0]).toUpperCase();
};

/* ────────────────────────── component ─────────────────────── */

export default function ExercisesScreen() {
    const router = useRouter();

    const [exercises, setExercises] = useState<ExerciseMetadata[]>([]);
    const [activeMuscleGroup, setActiveMuscleGroup] = useState<MuscleGroup | null>(null);
    const [query, setQuery] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    /* ── unified loader (local SQLite) ─────────────────────── */
    const load = useCallback(async (q: string, mg: MuscleGroup | null) => {
        setIsLoading(true);
        try {
            let results: ExerciseMetadata[];
            if (q.trim().length === 0 && !mg) {
                results = await getAllExercises();
            } else {
                results = await searchExercises({
                    name: q.trim() || undefined,
                    muscleGroup: mg ?? undefined,
                });
            }
            setExercises(results);
        } catch (err) {
            console.error('Failed to load exercises:', err);
        } finally {
            setIsLoading(false);
        }
    }, []);

    /* ── initial load ──────────────────────────────────────── */
    useEffect(() => {
        load('', null);
    }, [load]);

    /* ── debounced search ──────────────────────────────────── */
    const handleSearch = useCallback((text: string) => {
        setQuery(text);
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
            setActiveMuscleGroup(null);
            load(text, null);
        }, 300);
    }, [load]);

    /* ── muscle group chip tap ─────────────────────────────── */
    const handleGroupPress = useCallback((mg: MuscleGroup) => {
        const next = activeMuscleGroup === mg ? null : mg;
        setActiveMuscleGroup(next);
        setQuery('');
        load('', next);
    }, [activeMuscleGroup, load]);

    /* ── navigate to detail ────────────────────────────────── */
    const handlePress = (item: ExerciseMetadata) => {
        router.push({
            pathname: '/exercise-detail' as any,
            params: { exercise: JSON.stringify(item) },
        });
    };

    /* ── cleanup ───────────────────────────────────────────── */
    useEffect(() => {
        return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
    }, []);

    /* ── row renderer ──────────────────────────────────────── */
    const renderItem = ({ item }: { item: ExerciseMetadata }) => (
        <Pressable onPress={() => handlePress(item)} style={styles.row}>
            {/* Circular GIF or fallback icon */}
            <View style={[
                styles.thumbWrapper,
                { backgroundColor: item.gifUrl ? '#F5F5F5' : (MUSCLE_GROUP_COLORS[item.primaryMuscleGroup] ?? '#3A3A3C') },
            ]}>
                {item.gifUrl ? (
                    <Image
                        source={{ uri: item.gifUrl }}
                        style={styles.thumb}
                        resizeMode="cover"
                    />
                ) : (
                    <View style={styles.thumbFallback}>
                        <Text style={styles.thumbInitials}>
                            {getInitials(item.name)}
                        </Text>
                    </View>
                )}
            </View>

            {/* Text */}
            <View style={styles.rowInfo}>
                <Text style={styles.rowName} numberOfLines={1}>{item.name}</Text>
                <Text style={styles.rowMuscle} numberOfLines={1}>
                    {formatLabel(item.primaryMuscleGroup)} · {formatLabel(item.equipment)}
                </Text>
            </View>

            <Ionicons name="chevron-forward" size={18} color="rgba(255,255,255,0.3)" />
        </Pressable>
    );

    const renderSeparator = () => <View style={styles.separator} />;

    /* ══════════════════════ render ═════════════════════════── */
    return (
        <View style={styles.root}>
            <AnimatedBackground />

            <SafeAreaView edges={['top']} style={{ flex: 1 }}>
                {/* ── HEADER ──────────────────────────────────── */}
                <View style={styles.header}>
                    <Pressable onPress={() => router.back()} style={styles.headerBtn}>
                        <Ionicons name="arrow-back" size={22} color="white" />
                    </Pressable>
                    <Text style={styles.headerTitle}>Exercise Library</Text>
                    <View style={{ width: 40 }} />
                </View>

                {/* ── SEARCH BAR ──────────────────────────────── */}
                <View style={styles.searchContainer}>
                    <View style={styles.searchBar}>
                        <Ionicons name="search" size={18} color="#8E8E93" style={{ marginRight: 8 }} />
                        <TextInput
                            style={styles.searchInput}
                            placeholder="Search exercises..."
                            placeholderTextColor="#8E8E93"
                            value={query}
                            onChangeText={handleSearch}
                            autoCapitalize="none"
                            autoCorrect={false}
                        />
                        {query.length > 0 && (
                            <Pressable onPress={() => handleSearch('')}>
                                <Ionicons name="close-circle" size={18} color="#8E8E93" />
                            </Pressable>
                        )}
                    </View>
                </View>

                {/* ── MUSCLE GROUP CHIPS ──────────────────────── */}
                <View style={{ marginBottom: 8 }}>
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={{ paddingHorizontal: 16 }}
                        keyboardShouldPersistTaps="handled"
                    >
                        {MUSCLE_GROUPS.map((mg, index) => {
                            const active = activeMuscleGroup === mg;
                            return (
                                <Pressable
                                    key={mg}
                                    onPress={() => handleGroupPress(mg)}
                                    style={[
                                        styles.chip,
                                        active ? styles.chipActive : styles.chipInactive,
                                        index < MUSCLE_GROUPS.length - 1 && { marginRight: 8 },
                                    ]}
                                >
                                    <Text style={[
                                        styles.chipText,
                                        active ? styles.chipTextActive : styles.chipTextInactive,
                                    ]}>
                                        {formatLabel(mg)}
                                    </Text>
                                </Pressable>
                            );
                        })}
                    </ScrollView>
                </View>

                {/* ── COUNT ───────────────────────────────────── */}
                {!isLoading && (
                    <Text style={styles.countText}>{exercises.length} exercises</Text>
                )}

                {/* ── LIST ────────────────────────────────────── */}
                {isLoading ? (
                    <View style={styles.center}>
                        <ActivityIndicator size="large" color="#FF6000" />
                        <Text style={styles.loadingText}>Loading exercises...</Text>
                    </View>
                ) : exercises.length === 0 ? (
                    <View style={styles.center}>
                        <Ionicons name="barbell-outline" size={48} color="#3A3A3C" />
                        <Text style={styles.loadingText}>No exercises found</Text>
                    </View>
                ) : (
                    <FlatList
                        data={exercises}
                        keyExtractor={(item) => item.id}
                        renderItem={renderItem}
                        ItemSeparatorComponent={renderSeparator}
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={{ paddingBottom: 40 }}
                        keyboardShouldPersistTaps="handled"
                    />
                )}
            </SafeAreaView>
        </View>
    );
}

/* ────────────────────────── styles ─────────────────────────── */

const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: '#0A0A0A' },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 10,
    },
    headerBtn: {
        width: 40, height: 40, borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.08)',
        alignItems: 'center', justifyContent: 'center',
    },
    headerTitle: {
        color: 'white', fontSize: 20, fontWeight: 'bold',
        fontFamily: 'Outfit_700Bold',
    },
    searchContainer: { paddingHorizontal: 16, marginBottom: 10 },
    searchBar: {
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.07)',
        borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10,
        borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
    },
    searchInput: {
        flex: 1, color: 'white', fontSize: 15,
        fontFamily: 'Outfit_400Regular',
    },
    chip: { borderRadius: 999, paddingHorizontal: 14, paddingVertical: 7, borderWidth: 1 },
    chipActive: { backgroundColor: '#FF6000', borderColor: '#FF6000' },
    chipInactive: { backgroundColor: 'rgba(255,255,255,0.07)', borderColor: 'rgba(255,255,255,0.1)' },
    chipText: { fontSize: 13, fontWeight: '600', fontFamily: 'Outfit_600SemiBold' },
    chipTextActive: { color: '#FFFFFF' },
    chipTextInactive: { color: 'rgba(255,255,255,0.5)' },
    countText: {
        color: 'rgba(255,255,255,0.3)', fontSize: 12,
        fontFamily: 'Outfit_400Regular',
        paddingHorizontal: 16, marginBottom: 6,
    },
    row: {
        flexDirection: 'row', alignItems: 'center',
        paddingVertical: 10, paddingHorizontal: 16,
    },
    thumbWrapper: {
        width: 52, height: 52, borderRadius: 26,
        overflow: 'hidden', backgroundColor: 'transparent',
        borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
    },
    thumb: { width: 52, height: 52 },
    thumbFallback: {
        width: 52, height: 52,
        alignItems: 'center', justifyContent: 'center',
    },
    thumbInitials: {
        color: 'rgba(255,255,255,0.92)',
        fontSize: 17,
        fontWeight: '700',
        fontFamily: 'Outfit_700Bold',
        letterSpacing: 0.5,
    },
    rowInfo: { flex: 1, marginLeft: 14, marginRight: 8 },
    rowName: {
        color: 'white', fontSize: 16, fontWeight: '600',
        fontFamily: 'Outfit_600SemiBold', marginBottom: 2,
    },
    rowMuscle: {
        color: 'rgba(255,255,255,0.45)', fontSize: 13,
        fontFamily: 'Outfit_400Regular',
    },
    separator: {
        height: StyleSheet.hairlineWidth,
        backgroundColor: 'rgba(255,255,255,0.08)',
        marginLeft: 82, marginRight: 16,
    },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    loadingText: {
        color: '#8E8E93', fontSize: 14, marginTop: 12,
        fontFamily: 'Outfit_500Medium',
    },
});
