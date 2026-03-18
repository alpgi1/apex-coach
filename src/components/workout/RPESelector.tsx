import { useCallback, useRef, useState } from 'react';
import { Modal, Pressable, Text, View } from 'react-native';
import Animated, {
    Extrapolation,
    interpolate,
    SharedValue,
    useAnimatedScrollHandler,
    useAnimatedStyle,
    useSharedValue,
} from 'react-native-reanimated';

/* ──────────────────────── constants ──────────────────────── */

const RPE_VALUES: readonly number[] = [1, 2, 3, 4, 5, 5.5, 6, 6.5, 7, 7.5, 8, 8.5, 9, 9.5, 10];
const ITEM_HEIGHT = 44;
const VISIBLE_ITEMS = 3;
const PICKER_HEIGHT = ITEM_HEIGHT * VISIBLE_ITEMS;

/* ──────────────────────── helpers ────────────────────────── */

const getRpeColor = (rpe: number): string => {
    if (rpe <= 7) return '#4ade80';
    if (rpe <= 8.5) return '#facc15';
    return '#f87171';
};

const getRpeLabel = (rpe: number): string => {
    if (rpe === 10) return 'Max effort — 0 RIR';
    if (rpe === 9.5) return 'Could maybe add weight';
    if (rpe === 9) return '1 rep in reserve';
    if (rpe === 8.5) return '1–2 reps in reserve';
    if (rpe === 8) return '2 reps in reserve';
    if (rpe === 7.5) return '2–3 reps in reserve';
    if (rpe === 7) return '3 reps in reserve';
    if (rpe <= 6.5) return 'Warmup territory';
    return '';
};

/* ──────────────────── picker item ────────────────────────── */

interface PickerItemProps {
    rpeValue: number;
    index: number;
    scrollY: SharedValue<number>;
}

function RPEPickerItem({ rpeValue, index, scrollY }: PickerItemProps) {
    const center = index * ITEM_HEIGHT;
    const color = getRpeColor(rpeValue);

    const animatedStyle = useAnimatedStyle(() => {
        const scale = interpolate(
            scrollY.value,
            [center - ITEM_HEIGHT, center, center + ITEM_HEIGHT],
            [0.8, 1.2, 0.8],
            Extrapolation.CLAMP
        );
        const opacity = interpolate(
            scrollY.value,
            [center - ITEM_HEIGHT, center, center + ITEM_HEIGHT],
            [0.3, 1, 0.3],
            Extrapolation.CLAMP
        );
        return { transform: [{ scale }], opacity };
    });

    return (
        <Animated.View
            style={[
                { height: ITEM_HEIGHT, justifyContent: 'center', alignItems: 'center' },
                animatedStyle,
            ]}
        >
            <Text style={{ color, fontSize: 22, fontWeight: '700' }}>
                {rpeValue}
            </Text>
        </Animated.View>
    );
}

/* ──────────────────── main component ─────────────────────── */

interface RPESelectorProps {
    value: number | undefined;
    onChange: (rpe: number) => void;
    disabled?: boolean;
}

export default function RPESelector({ value, onChange, disabled }: RPESelectorProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [previewIndex, setPreviewIndex] = useState(0);
    const scrollY = useSharedValue(0);
    const scrollRef = useRef<Animated.ScrollView>(null);
    const hasScrolledToInitial = useRef(false);

    const previewValue = RPE_VALUES[previewIndex];

    /* ── scroll handler (reanimated worklet) ──────────────── */
    const scrollHandler = useAnimatedScrollHandler({
        onScroll: (event) => {
            scrollY.value = event.contentOffset.y;
        },
    });

    /* ── open picker ──────────────────────────────────────── */
    const handleOpen = useCallback(() => {
        if (disabled) return;
        hasScrolledToInitial.current = false;

        const initialIndex = value ? RPE_VALUES.indexOf(value) : RPE_VALUES.indexOf(8);
        setPreviewIndex(initialIndex === -1 ? RPE_VALUES.indexOf(8) : initialIndex);
        setIsOpen(true);
    }, [disabled, value]);

    /* ── scroll to initial value once layout is ready ─────── */
    const handleLayout = useCallback(() => {
        if (hasScrolledToInitial.current) return;
        hasScrolledToInitial.current = true;

        requestAnimationFrame(() => {
            scrollRef.current?.scrollTo({
                y: previewIndex * ITEM_HEIGHT,
                animated: false,
            });
        });
    }, [previewIndex]);

    /* ── update preview on scroll end (no auto-close) ─────── */
    const handleScrollEnd = useCallback((offsetY: number) => {
        const index = Math.round(offsetY / ITEM_HEIGHT);
        const clamped = Math.max(0, Math.min(index, RPE_VALUES.length - 1));
        setPreviewIndex(clamped);
    }, []);

    /* ── confirm selection ────────────────────────────────── */
    const handleConfirm = useCallback(() => {
        onChange(RPE_VALUES[previewIndex]);
        setIsOpen(false);
    }, [onChange, previewIndex]);

    /* ── trigger display ──────────────────────────────────── */
    const displayColor = value !== undefined ? getRpeColor(value) : '#8E8E93';
    const displayText = value !== undefined ? String(value) : 'RPE';

    return (
        <>
            {/* ── CLOSED STATE — tap target ──────────────────── */}
            <Pressable
                onPress={handleOpen}
                className="flex-1 rounded-lg py-2 mx-1 items-center justify-center"
                style={{ backgroundColor: 'rgba(255,255,255,0.06)' }}
            >
                <Text style={{ color: displayColor, fontWeight: '600', fontSize: 14, textAlign: 'center' }}>
                    {displayText}
                </Text>
            </Pressable>

            {/* ── OPEN STATE — bottom micro-sheet ────────────── */}
            <Modal visible={isOpen} transparent animationType="fade">
                {/* backdrop */}
                <Pressable
                    onPress={() => setIsOpen(false)}
                    className="flex-1"
                    style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}
                />

                {/* bottom panel */}
                <View
                    className="rounded-t-3xl px-6 pt-5 pb-8"
                    style={{ backgroundColor: 'rgba(20,20,20,0.97)' }}
                >
                    {/* header */}
                    <View className="flex-row items-center justify-between mb-4">
                        <Text className="text-white text-lg font-outfit-bold">Select RPE</Text>
                        <Pressable onPress={() => setIsOpen(false)}>
                            <Text className="text-[#8E8E93] text-sm">Cancel</Text>
                        </Pressable>
                    </View>

                    {/* picker area */}
                    <View
                        className="self-center overflow-hidden"
                        style={{ height: PICKER_HEIGHT, width: 120 }}
                    >
                        {/* selection indicator lines */}
                        <View
                            style={{
                                position: 'absolute',
                                top: ITEM_HEIGHT,
                                left: 0,
                                right: 0,
                                height: ITEM_HEIGHT,
                                borderTopWidth: 1,
                                borderBottomWidth: 1,
                                borderColor: 'rgba(255,255,255,0.15)',
                                zIndex: 1,
                            }}
                            pointerEvents="none"
                        />

                        <Animated.ScrollView
                            ref={scrollRef}
                            onScroll={scrollHandler}
                            scrollEventThrottle={16}
                            showsVerticalScrollIndicator={false}
                            snapToInterval={ITEM_HEIGHT}
                            decelerationRate="fast"
                            onLayout={handleLayout}
                            onMomentumScrollEnd={(e) =>
                                handleScrollEnd(e.nativeEvent.contentOffset.y)
                            }
                            onScrollEndDrag={(e) =>
                                handleScrollEnd(e.nativeEvent.contentOffset.y)
                            }
                            contentContainerStyle={{
                                paddingTop: ITEM_HEIGHT,
                                paddingBottom: ITEM_HEIGHT,
                            }}
                        >
                            {RPE_VALUES.map((rpe, i) => (
                                <RPEPickerItem
                                    key={rpe}
                                    rpeValue={rpe}
                                    index={i}
                                    scrollY={scrollY}
                                />
                            ))}
                        </Animated.ScrollView>
                    </View>

                    {/* RPE description label */}
                    <Text
                        className="text-center mt-3 text-sm font-medium"
                        style={{ color: getRpeColor(previewValue) }}
                    >
                        RPE {previewValue} — {getRpeLabel(previewValue)}
                    </Text>

                    {/* confirm button */}
                    <Pressable
                        onPress={handleConfirm}
                        className="mt-5 rounded-full py-3.5 items-center active:opacity-80"
                        style={{ backgroundColor: getRpeColor(previewValue) }}
                    >
                        <Text className="text-black font-outfit-bold text-base">
                            Select RPE {previewValue}
                        </Text>
                    </Pressable>
                </View>
            </Modal>
        </>
    );
}
