import db from './database';

export interface StreakMilestone {
    weeks: number;
    emoji: string;
    label: string;
    color: string;
}

export interface StreakResult {
    currentStreak: number;
    longestStreak: number;
    isAtRisk: boolean;
    workedOutThisWeek: boolean;
    thisWeekWorkoutDays: boolean[]; // index 0=Mon … 6=Sun
    currentMilestone: StreakMilestone | null;
    nextMilestone: StreakMilestone | null;
    earnedMilestones: StreakMilestone[];
}

export const STREAK_MILESTONES: StreakMilestone[] = [
    { weeks: 1,  emoji: '🌱', label: 'First Week',         color: '#66BB6A' },
    { weeks: 4,  emoji: '🥉', label: 'One Month Strong',   color: '#CD7F32' },
    { weeks: 8,  emoji: '🔥', label: 'Two Month Grind',    color: '#FF6B35' },
    { weeks: 12, emoji: '🥈', label: 'Quarter Year',       color: '#C0C0C0' },
    { weeks: 26, emoji: '🥇', label: 'Half Year Beast',    color: '#FFD700' },
    { weeks: 52, emoji: '👑', label: 'Year Round Athlete', color: '#9C27B0' },
];

/** Returns "YYYY-MM-DD" string of the Monday of the week containing `date`. */
const getMondayKey = (date: Date): string => {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    const day = d.getDay(); // 0=Sun
    const diff = day === 0 ? -6 : 1 - day;
    d.setDate(d.getDate() + diff);
    return d.toISOString().slice(0, 10);
};

/** Returns the Monday key 7 days before the given Monday key. */
const prevWeek = (mondayKey: string): string => {
    const d = new Date(mondayKey);
    d.setDate(d.getDate() - 7);
    return d.toISOString().slice(0, 10);
};

/** Returns 0=Mon, 1=Tue, …, 6=Sun */
const dayIndex = (date: Date): number => {
    const d = date.getDay();
    return d === 0 ? 6 : d - 1;
};

export const calculateStreak = async (): Promise<StreakResult> => {
    const rows = await db.getAllAsync<{ startTime: string }>(
        `SELECT startTime FROM workout_sessions ORDER BY startTime ASC`
    );

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const currentWeekKey = getMondayKey(today);

    const weekSet = new Set<string>();
    const thisWeekWorkoutDays: boolean[] = Array(7).fill(false);

    for (const row of rows) {
        const d = new Date(row.startTime);
        const wk = getMondayKey(d);
        weekSet.add(wk);
        if (wk === currentWeekKey) {
            thisWeekWorkoutDays[dayIndex(d)] = true;
        }
    }

    const workedOutThisWeek = weekSet.has(currentWeekKey);
    const todayIdx = dayIndex(today);
    // Grace period: Mon (0) or Tue (1) of the current week
    const isGracePeriod = !workedOutThisWeek && todayIdx <= 1;

    // --- Current streak ---
    let currentStreak = 0;
    const startKey = workedOutThisWeek
        ? currentWeekKey
        : isGracePeriod
            ? prevWeek(currentWeekKey)
            : null;

    if (startKey && weekSet.has(startKey)) {
        currentStreak = 1;
        let checkKey = startKey;
        while (true) {
            const pk = prevWeek(checkKey);
            if (weekSet.has(pk)) {
                currentStreak++;
                checkKey = pk;
            } else {
                break;
            }
        }
    }

    // --- Longest streak (all-time) ---
    const sortedWeeks = Array.from(weekSet).sort();
    let longestStreak = 0;
    let temp = 0;
    let prevKey: string | null = null;
    for (const wk of sortedWeeks) {
        if (prevKey === null) {
            temp = 1;
        } else {
            const diffDays = Math.round(
                (new Date(wk).getTime() - new Date(prevKey).getTime()) / 86400000
            );
            if (diffDays === 7) {
                temp++;
            } else {
                longestStreak = Math.max(longestStreak, temp);
                temp = 1;
            }
        }
        prevKey = wk;
    }
    longestStreak = Math.max(longestStreak, temp, currentStreak);

    // --- Milestones ---
    const earnedMilestones = STREAK_MILESTONES.filter(m => currentStreak >= m.weeks);
    const currentMilestone = earnedMilestones.length > 0 ? earnedMilestones[earnedMilestones.length - 1] : null;
    const nextMilestone = STREAK_MILESTONES.find(m => currentStreak < m.weeks) ?? null;

    return {
        currentStreak,
        longestStreak,
        isAtRisk: isGracePeriod && currentStreak > 0,
        workedOutThisWeek,
        thisWeekWorkoutDays,
        currentMilestone,
        nextMilestone,
        earnedMilestones,
    };
};
