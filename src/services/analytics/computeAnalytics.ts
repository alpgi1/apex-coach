import { ExerciseMetadata, MuscleGroup } from '../../types/exercise.types';
import { Slug } from 'react-native-body-highlighter';
import { WorkoutSession } from '../../types/workout.types';

/* ─────────────── types ─────────────── */

export interface WeeklyVolumePoint {
    label: string;
    value: number;
}

export interface MuscleGroupPoint {
    group: MuscleGroup;
    label: string;
    value: number;
}

/* ─────────────── helpers ─────────────── */

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** Returns the Monday 00:00 of the ISO week containing `date`. */
function getMonday(date: Date): Date {
    const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const day = d.getDay(); // 0=Sun … 6=Sat
    const diff = day === 0 ? -6 : 1 - day;
    d.setDate(d.getDate() + diff);
    return d;
}

function formatMonday(d: Date): string {
    return `${MONTH_NAMES[d.getMonth()]} ${d.getDate()}`;
}

/* ─────────────── Volume Trend ─────────────── */

/**
 * Buckets sessions into ISO weeks (Mon–Sun), sums volumeKg per week,
 * returns the last `weekCount` weeks in chronological order.
 * Weeks with no sessions get value 0.
 */
export function computeWeeklyVolume(
    sessions: WorkoutSession[],
    weekCount = 8,
): WeeklyVolumePoint[] {
    const thisMonday = getMonday(new Date());

    // Generate Monday dates from oldest to newest
    const mondays: Date[] = [];
    for (let i = weekCount - 1; i >= 0; i--) {
        const m = new Date(thisMonday);
        m.setDate(thisMonday.getDate() - i * 7);
        mondays.push(m);
    }

    // Build a map keyed by Monday timestamp → accumulated volume
    const volumeByWeek = new Map<number, number>();
    for (const m of mondays) {
        volumeByWeek.set(m.getTime(), 0);
    }

    for (const s of sessions) {
        const sessionMonday = getMonday(new Date(s.startTime));
        const key = sessionMonday.getTime();
        if (volumeByWeek.has(key)) {
            volumeByWeek.set(key, (volumeByWeek.get(key) ?? 0) + s.volumeKg);
        }
    }

    return mondays.map((m) => ({
        label: formatMonday(m),
        value: Math.round(volumeByWeek.get(m.getTime()) ?? 0),
    }));
}

/* ─────────────── Weekly Muscle Heatmap ─────────────── */

const MUSCLE_SLUGS: Partial<Record<MuscleGroup, Slug[]>> = {
    CHEST:     ['chest'],
    BACK:      ['upper-back', 'lower-back', 'trapezius'],
    SHOULDERS: ['deltoids'],
    ARMS:      ['biceps', 'triceps', 'forearm'],
    LEGS:      ['quadriceps', 'hamstring', 'gluteal', 'calves', 'adductors'],
    CORE:      ['abs', 'obliques'],
};

export interface MuscleHeatmapPoint {
    slug: Slug;
    intensity: 1 | 2 | 3;
}

/**
 * Per-muscle-group weekly volume thresholds (weightKg × reps).
 * [yellow threshold, red threshold] — between them is orange.
 * Legs/Back naturally accumulate more volume than Arms/Core.
 */
const VOLUME_THRESHOLDS: Partial<Record<MuscleGroup, [number, number]>> = {
    LEGS:      [800,  5000],
    BACK:      [600,  3500],
    CHEST:     [500,  3000],
    SHOULDERS: [300,  1800],
    ARMS:      [200,  1200],
    CORE:      [100,  700],
};

/**
 * Returns muscles worked in the last 7 days with intensity based on volume (weightKg × reps).
 * Sets with weightKg = 0 are excluded entirely.
 * Thresholds are relative per muscle group so legs/back need more volume to turn red than arms/core.
 * intensity 1 = yellow, 2 = orange, 3 = red
 */
export function computeWeeklyMuscleHeatmap(
    sessions: WorkoutSession[],
    exerciseMap: Map<string, ExerciseMetadata>,
): MuscleHeatmapPoint[] {
    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const groupVolume: Partial<Record<MuscleGroup, number>> = {};

    for (const session of sessions) {
        if (new Date(session.startTime).getTime() < sevenDaysAgo) continue;
        for (const log of session.logs) {
            const ex = exerciseMap.get(log.exerciseId);
            if (!ex) continue;
            const groups: MuscleGroup[] = ex.primaryMuscleGroup === 'FULL_BODY'
                ? ['CHEST', 'BACK', 'SHOULDERS', 'ARMS', 'LEGS', 'CORE']
                : [ex.primaryMuscleGroup];
            for (const set of log.sets) {
                if (!set.isCompleted || set.weightKg <= 0) continue;
                const setVolume = set.weightKg * set.reps;
                for (const group of groups) {
                    groupVolume[group] = (groupVolume[group] ?? 0) + setVolume;
                }
            }
        }
    }

    const result: MuscleHeatmapPoint[] = [];
    for (const [group, volume] of Object.entries(groupVolume) as [MuscleGroup, number][]) {
        if (volume <= 0) continue;
        const [yellowAt, redAt] = VOLUME_THRESHOLDS[group] ?? [500, 1500];
        const intensity: 1 | 2 | 3 = volume >= redAt ? 3 : volume >= yellowAt ? 2 : 1;
        for (const slug of (MUSCLE_SLUGS[group] ?? [])) {
            result.push({ slug, intensity });
        }
    }
    return result;
}

/* ─────────────── Muscle Group Split ─────────────── */

const CONCRETE_GROUPS: MuscleGroup[] = ['CHEST', 'BACK', 'SHOULDERS', 'ARMS', 'LEGS', 'CORE'];

const GROUP_LABELS: Record<MuscleGroup, string> = {
    CHEST: 'Chest',
    BACK: 'Back',
    SHOULDERS: 'Shoulders',
    ARMS: 'Arms',
    LEGS: 'Legs',
    CORE: 'Core',
    FULL_BODY: 'Full Body',
};

/**
 * Computes volume (weightKg × reps) per muscle group across all sessions.
 * FULL_BODY volume is distributed equally across the 6 concrete groups.
 * Returns exactly 6 data points (one per concrete group).
 */
export function computeMuscleGroupSplit(
    sessions: WorkoutSession[],
    exerciseMap: Map<string, ExerciseMetadata>,
): MuscleGroupPoint[] {
    const volumeMap: Record<string, number> = {};
    for (const g of CONCRETE_GROUPS) volumeMap[g] = 0;
    let fullBodyVolume = 0;

    for (const session of sessions) {
        for (const log of session.logs) {
            const exercise = exerciseMap.get(log.exerciseId);
            if (!exercise) continue;

            let logVolume = 0;
            for (const set of log.sets) {
                if (set.isCompleted && set.setType === 'WORKING') {
                    logVolume += set.weightKg * set.reps;
                }
            }

            if (exercise.primaryMuscleGroup === 'FULL_BODY') {
                fullBodyVolume += logVolume;
            } else {
                volumeMap[exercise.primaryMuscleGroup] =
                    (volumeMap[exercise.primaryMuscleGroup] ?? 0) + logVolume;
            }
        }
    }

    // Distribute FULL_BODY volume equally
    if (fullBodyVolume > 0) {
        const share = fullBodyVolume / CONCRETE_GROUPS.length;
        for (const g of CONCRETE_GROUPS) {
            volumeMap[g] += share;
        }
    }

    return CONCRETE_GROUPS.map((g) => ({
        group: g,
        label: GROUP_LABELS[g],
        value: Math.round(volumeMap[g]),
    }));
}
