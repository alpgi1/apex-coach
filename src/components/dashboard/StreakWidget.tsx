import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';
import { StreakResult } from '../../services/storage/streakStorage';

interface Props {
    streak: StreakResult;
}

const DAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

export default function StreakWidget({ streak }: Props) {
    const { currentStreak, isAtRisk, thisWeekWorkoutDays, nextMilestone, currentMilestone } = streak;

    const accentColor = isAtRisk ? '#FFB800' : '#FF6000';
    const iconName: any = isAtRisk ? 'warning' : currentStreak > 0 ? 'flame' : 'flame-outline';

    return (
        <View style={styles.container}>
            {/* Left: flame + streak count */}
            <View style={styles.left}>
                <View style={[styles.iconWrap, { backgroundColor: `${accentColor}22` }]}>
                    <Ionicons name={iconName} size={22} color={accentColor} />
                </View>
                <View style={{ marginLeft: 10 }}>
                    <Text style={[styles.streakNum, { color: accentColor }]}>
                        {currentStreak}
                    </Text>
                    <Text style={styles.streakLabel}>
                        {isAtRisk ? 'at risk!' : 'week streak'}
                    </Text>
                </View>
            </View>

            {/* Right: day dots + milestone hint */}
            <View style={styles.right}>
                <View style={styles.dots}>
                    {DAY_LABELS.map((label, i) => (
                        <View key={i} style={styles.dayItem}>
                            <View
                                style={[
                                    styles.dot,
                                    thisWeekWorkoutDays[i]
                                        ? { backgroundColor: accentColor }
                                        : styles.dotEmpty,
                                ]}
                            />
                            <Text style={styles.dayLabel}>{label}</Text>
                        </View>
                    ))}
                </View>
                {isAtRisk ? (
                    <Text style={[styles.hint, { color: '#FFB800' }]}>
                        Train before Wed to keep it!
                    </Text>
                ) : nextMilestone ? (
                    <Text style={styles.hint}>
                        {nextMilestone.emoji} {nextMilestone.weeks - currentStreak}w to {nextMilestone.label}
                    </Text>
                ) : currentMilestone ? (
                    <Text style={styles.hint}>
                        {currentMilestone.emoji} {currentMilestone.label} achieved!
                    </Text>
                ) : null}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: 'rgba(255,255,255,0.07)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        borderRadius: 16,
        paddingHorizontal: 14,
        paddingVertical: 12,
        marginBottom: 12,
    },
    left: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    iconWrap: {
        width: 42,
        height: 42,
        borderRadius: 21,
        alignItems: 'center',
        justifyContent: 'center',
    },
    streakNum: {
        fontSize: 24,
        fontFamily: 'Outfit_700Bold',
        lineHeight: 28,
    },
    streakLabel: {
        color: 'rgba(255,255,255,0.5)',
        fontSize: 11,
        fontFamily: 'Outfit_500Medium',
    },
    right: {
        alignItems: 'flex-end',
        gap: 5,
    },
    dots: {
        flexDirection: 'row',
        gap: 5,
    },
    dayItem: {
        alignItems: 'center',
        gap: 3,
    },
    dot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    dotEmpty: {
        backgroundColor: 'rgba(255,255,255,0.15)',
    },
    dayLabel: {
        color: 'rgba(255,255,255,0.3)',
        fontSize: 9,
        fontFamily: 'Outfit_500Medium',
    },
    hint: {
        color: 'rgba(255,255,255,0.4)',
        fontSize: 10,
        fontFamily: 'Outfit_500Medium',
    },
});
