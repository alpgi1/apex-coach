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
import {
    ExerciseDbItem,
    fetchBodyParts,
    fetchExercises,
    fetchExercisesByBodyPart,
    searchExercisesDb,
} from '../src/services/api/exerciseDbApi';

/* ────────────────────────── constants ──────────────────────── */

const PAGE_SIZE = 20;

const formatLabel = (raw: string): string =>
    raw
        .replace(/_/g, ' ')
        .toLowerCase()
        .replace(/\b\w/g, (c) => c.toUpperCase());

/* ────────────────────────── component ─────────────────────── */

export default function ExercisesScreen() {
    const router = useRouter();

    /* state */
    const [exercises, setExercises] = useState<ExerciseDbItem[]>([]);
    const [bodyParts, setBodyParts] = useState<string[]>([]);
    const [activeBodyPart, setActiveBodyPart] = useState<string | null>(null);
    const [query, setQuery] = useState('');
    const [offset, setOffset] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const [isLoading, setIsLoading] = useState(true);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    /* ── load body parts once ──────────────────────────────── */
    useEffect(() => {
        fetchBodyParts()
            .then(setBodyParts)
            .catch(() => {});
    }, []);

    /* ── unified data fetcher ──────────────────────────────── */
    const loadExercises = useCallback(
        async (q: string, bp: string | null, newOffset: number, append: boolean) => {
            if (!append) setIsLoading(true);
            else setIsLoadingMore(true);

            try {
                let res;
                if (q.trim().length > 0) {
                    res = await searchExercisesDb(q, newOffset, PAGE_SIZE);
                } else if (bp) {
                    res = await fetchExercisesByBodyPart(bp, newOffset, PAGE_SIZE);
                } else {
                    res = await fetchExercises(newOffset, PAGE_SIZE);
                }

                if (append) {
                    setExercises((prev) => [...prev, ...res.data]);
                } else {
                    setExercises(res.data);
                }

                setHasMore(res.metadata.nextPage !== null);
                setOffset(newOffset + res.data.length);
            } catch (err) {
                console.error('Failed to load exercises:', err);
            } finally {
                setIsLoading(false);
                setIsLoadingMore(false);
            }
        },
        [],
    );

    /* ── initial load ──────────────────────────────────────── */
    useEffect(() => {
        loadExercises('', null, 0, false);
    }, [loadExercises]);

    /* ── debounced search ──────────────────────────────────── */
    const handleSearch = useCallback(
        (text: string) => {
            setQuery(text);
            if (debounceRef.current) clearTimeout(debounceRef.current);
            debounceRef.current = setTimeout(() => {
                setActiveBodyPart(null);
                loadExercises(text, null, 0, false);
            }, 400);
        },
        [loadExercises],
    );

    /* ── body part tap ─────────────────────────────────────── */
    const handleBodyPartPress = useCallback(
        (bp: string) => {
            const next = activeBodyPart === bp ? null : bp;
            setActiveBodyPart(next);
            setQuery('');
            loadExercises('', next, 0, false);
        },
        [activeBodyPart, loadExercises],
    );

    /* ── infinite scroll ───────────────────────────────────── */
    const handleEndReached = useCallback(() => {
        if (!hasMore || isLoadingMore || isLoading) return;
        loadExercises(query, activeBodyPart, offset, true);
    }, [hasMore, isLoadingMore, isLoading, query, activeBodyPart, offset, loadExercises]);

    /* ── navigate to detail ────────────────────────────────── */
    const handleExercisePress = (item: ExerciseDbItem) => {
        router.push({
            pathname: '/exercise-detail' as any,
            params: { exercise: JSON.stringify(item) },
        });
    };

    /* ── cleanup ───────────────────────────────────────────── */
    useEffect(() => {
        return () => {
            if (debounceRef.current) clearTimeout(debounceRef.current);
        };
    }, []);

    /* ── row renderer (compact list) ───────────────────────── */
    const renderItem = ({ item }: { item: ExerciseDbItem }) => (
        <Pressable
            onPress={() => handleExercisePress(item)}
            style={styles.row}
        >
            {/* Small circular GIF thumbnail */}
            <View style={styles.thumbWrapper}>
                <Image
                    source={{ uri: item.gifUrl }}
                    style={styles.thumb}
                    resizeMode="cover"
                />
            </View>

            {/* Text info */}
            <View style={styles.rowInfo}>
                <Text style={styles.rowName} numberOfLines={1}>
                    {item.name}
                </Text>
                <Text style={styles.rowMuscle} numberOfLines={1}>
                    {item.targetMuscles.map(formatLabel).join(', ')}
                </Text>
            </View>

            {/* Chevron */}
            <Ionicons name="chevron-forward" size={18} color="rgba(255,255,255,0.3)" />
        </Pressable>
    );

    const renderSeparator = () => <View style={styles.separator} />;

    const renderFooter = () => {
        if (!isLoadingMore) return null;
        return (
            <View style={{ paddingVertical: 20 }}>
                <ActivityIndicator size="small" color="#FF6000" />
            </View>
        );
    };

    /* ══════════════════════ render ═════════════════════════── */
    return (
        <View style={styles.root}>
            <AnimatedBackground />

            <SafeAreaView style={{ flex: 1 }}>
                {/* ── HEADER ──────────────────────────────────── */}
                <View style={styles.header}>
                    <Pressable onPress={() => router.back()} style={styles.headerBtn}>
                        <Ionicons name="arrow-back" size={22} color="white" />
                    </Pressable>
                    <Text style={styles.headerTitle}>Exercise Library</Text>
                    <View style={{ width: 40 }} />
                </View>

                {/* ── SEARCH BAR (always visible) ─────────────── */}
                <View style={styles.searchContainer}>
                    <View style={styles.searchBar}>
                        <Ionicons
                            name="search"
                            size={18}
                            color="#8E8E93"
                            style={{ marginRight: 8 }}
                        />
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

                {/* ── BODY PART CHIPS ─────────────────────────── */}
                {bodyParts.length > 0 && (
                    <View style={{ marginBottom: 6 }}>
                        <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={{ paddingHorizontal: 16 }}
                            keyboardShouldPersistTaps="handled"
                        >
                            {bodyParts.map((bp, index) => {
                                const active = activeBodyPart === bp;
                                return (
                                    <Pressable
                                        key={bp}
                                        onPress={() => handleBodyPartPress(bp)}
                                        style={[
                                            styles.chip,
                                            active ? styles.chipActive : styles.chipInactive,
                                            index < bodyParts.length - 1 && { marginRight: 8 },
                                        ]}
                                    >
                                        <Text
                                            style={[
                                                styles.chipText,
                                                active ? styles.chipTextActive : styles.chipTextInactive,
                                            ]}
                                        >
                                            {formatLabel(bp)}
                                        </Text>
                                    </Pressable>
                                );
                            })}
                        </ScrollView>
                    </View>
                )}

                {/* ── EXERCISE LIST ───────────────────────────── */}
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
                        keyExtractor={(item) => item.exerciseId}
                        renderItem={renderItem}
                        ItemSeparatorComponent={renderSeparator}
                        ListFooterComponent={renderFooter}
                        onEndReached={handleEndReached}
                        onEndReachedThreshold={0.4}
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
    root: {
        flex: 1,
        backgroundColor: '#0A0A0A',
    },
    /* header */
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 10,
    },
    headerBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.08)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: {
        color: 'white',
        fontSize: 20,
        fontWeight: 'bold',
        fontFamily: 'Outfit_700Bold',
    },
    /* search */
    searchContainer: {
        paddingHorizontal: 16,
        marginBottom: 10,
    },
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.07)',
        borderRadius: 12,
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
    },
    searchInput: {
        flex: 1,
        color: 'white',
        fontSize: 15,
        fontFamily: 'Outfit_400Regular',
    },
    /* chips */
    chip: {
        borderRadius: 999,
        paddingHorizontal: 14,
        paddingVertical: 7,
        borderWidth: 1,
    },
    chipActive: {
        backgroundColor: '#FF6000',
        borderColor: '#FF6000',
    },
    chipInactive: {
        backgroundColor: 'rgba(255,255,255,0.07)',
        borderColor: 'rgba(255,255,255,0.1)',
    },
    chipText: {
        fontSize: 13,
        fontWeight: '600',
        fontFamily: 'Outfit_600SemiBold',
    },
    chipTextActive: {
        color: '#FFFFFF',
    },
    chipTextInactive: {
        color: 'rgba(255,255,255,0.5)',
    },
    /* compact row */
    row: {
        flexDirection: 'row' as const,
        alignItems: 'center' as const,
        paddingVertical: 10,
        paddingHorizontal: 16,
    },
    thumbWrapper: {
        width: 52,
        height: 52,
        borderRadius: 26,
        overflow: 'hidden' as const,
        backgroundColor: '#F5F5F5',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
    },
    thumb: {
        width: 52,
        height: 52,
    },
    rowInfo: {
        flex: 1,
        marginLeft: 14,
        marginRight: 8,
    },
    rowName: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
        fontFamily: 'Outfit_600SemiBold',
        marginBottom: 2,
    },
    rowMuscle: {
        color: 'rgba(255,255,255,0.45)',
        fontSize: 13,
        fontFamily: 'Outfit_400Regular',
    },
    separator: {
        height: StyleSheet.hairlineWidth,
        backgroundColor: 'rgba(255,255,255,0.08)',
        marginLeft: 82,   // 16 + 52 + 14
        marginRight: 16,
    },
    /* loading / empty */
    center: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    loadingText: {
        color: '#8E8E93',
        fontSize: 14,
        marginTop: 12,
        fontFamily: 'Outfit_500Medium',
    },
});
