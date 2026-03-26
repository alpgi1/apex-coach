import { useEffect } from 'react';
import { ViewStyle } from 'react-native';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withSequence,
    withTiming,
} from 'react-native-reanimated';

interface Props {
    width?: number | `${number}%` | 'auto';
    height?: number;
    borderRadius?: number;
    style?: ViewStyle;
}

export default function SkeletonBox({ width = '100%', height = 16, borderRadius = 8, style }: Props) {
    const opacity = useSharedValue(0.35);

    useEffect(() => {
        opacity.value = withRepeat(
            withSequence(
                withTiming(0.7, { duration: 750 }),
                withTiming(0.35, { duration: 750 }),
            ),
            -1,
            false,
        );
    }, []);

    const animStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

    return (
        <Animated.View
            style={[
                {
                    width: width as any,
                    height,
                    borderRadius,
                    backgroundColor: 'rgba(255,255,255,0.1)',
                },
                animStyle,
                style,
            ]}
        />
    );
}
