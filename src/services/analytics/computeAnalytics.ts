import { ExerciseMetadata, MuscleGroup } from '../../types/exercise.types';
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
