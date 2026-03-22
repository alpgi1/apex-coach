import { ExerciseMetadata } from '../../types/exercise.types';
import { WorkoutSession } from '../../types/workout.types';

/* ─────────────── types ─────────────── */

export type InsightType = 'fatigue' | 'performance' | 'volume_spike' | 'deload' | 'consistency' | 'intensity';
export type InsightSeverity = 'info' | 'warning' | 'success';

export interface Insight {
    id: string;
    type: InsightType;
    severity: InsightSeverity;
    title: string;
    message: string;
    icon: string; // Ionicons name
}

/* ─────────────── helpers ─────────────── */

/** Epley estimated 1RM */
function estimated1RM(weight: number, reps: number): number {
    if (reps <= 0 || weight <= 0) return 0;
    if (reps === 1) return weight;
    return weight * (1 + reps / 30);
}

import { daysAgo } from '../../utils/formatters';

/* ─────────────── insight detectors ─────────────── */

/**
 * FATIGUE TREND
 * Looks at the overall RPE trend across the last 5 sessions (any exercise).
 * If average RPE is climbing session over session, fatigue is accumulating.
 */
function detectFatigueTrend(sessions: WorkoutSession[]): Insight[] {
    const withRpe = sessions
        .filter((s) => s.averageRPE != null)
        .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

    if (withRpe.length < 4) return [];

    const recent = withRpe.slice(-5);

    // Check if RPE has been non-decreasing for the last 3+ sessions
    let rising = 0;
    for (let i = 1; i < recent.length; i++) {
        if (recent[i].averageRPE! >= recent[i - 1].averageRPE! + 0.3) {
            rising++;
        } else if (recent[i].averageRPE! < recent[i - 1].averageRPE! - 0.5) {
            rising = 0; // Reset if RPE drops significantly
        }
    }

    if (rising >= 2) {
        const firstRpe = recent[recent.length - rising - 1]?.averageRPE?.toFixed(1) ?? '?';
        const lastRpe = recent[recent.length - 1].averageRPE!.toFixed(1);
        return [{
            id: 'fatigue-overall',
            type: 'fatigue',
            severity: 'warning',
            title: 'Fatigue Trend',
            message: `Your average RPE has climbed from ${firstRpe} to ${lastRpe} over your last ${rising + 1} sessions. You may be accumulating fatigue.`,
            icon: 'trending-up',
        }];
    }

    return [];
}

/**
 * HIGH INTENSITY SESSION
 * Last workout had an average RPE >= 9.0 — that's a very hard session.
 */
function detectHighIntensity(sessions: WorkoutSession[]): Insight[] {
    const sorted = [...sessions].sort(
        (a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime(),
    );
    const last = sorted[0];
    if (!last?.averageRPE || last.averageRPE < 9.0) return [];

    return [{
        id: 'intensity-last',
        type: 'intensity',
        severity: 'info',
        title: 'High Intensity',
        message: `Your last session (${last.name}) averaged RPE ${last.averageRPE.toFixed(1)}. Make sure you're recovering well before your next heavy session.`,
        icon: 'flame',
    }];
}

/**
 * PERFORMANCE SPIKE
 * Compares best estimated 1RM per exercise: recent sessions vs all-time.
 * If any exercise hit a new best in the last 7 days, celebrate.
 */
function detectPerformanceSpike(
    sessions: WorkoutSession[],
    exerciseMap: Map<string, ExerciseMetadata>,
): Insight[] {
    const insights: Insight[] = [];

    // All exercise IDs across all sessions
    const exerciseIds = new Set<string>();
    for (const s of sessions) {
        for (const l of s.logs) exerciseIds.add(l.exerciseId);
    }

    for (const exerciseId of exerciseIds) {
        let allTimeBest = 0;
        let recentBest = 0;

        for (const s of sessions) {
            for (const log of s.logs) {
                if (log.exerciseId !== exerciseId) continue;
                for (const set of log.sets) {
                    if (!set.isCompleted || set.setType !== 'WORKING') continue;
                    const e1rm = estimated1RM(set.weightKg, set.reps);

                    if (e1rm > allTimeBest) allTimeBest = e1rm;

                    if (daysAgo(s.startTime) <= 7 && e1rm > recentBest) {
                        recentBest = e1rm;
                    }
                }
            }
        }

        // Recent best IS the all-time best → new PR territory
        if (recentBest > 0 && Math.abs(recentBest - allTimeBest) < 0.1 && allTimeBest > 0) {
            const name = exerciseMap.get(exerciseId)?.name ?? 'Unknown';
            insights.push({
                id: `performance-${exerciseId}`,
                type: 'performance',
                severity: 'success',
                title: 'PR Territory',
                message: `Your ${name} estimated 1RM hit ${Math.round(allTimeBest)}kg this week — your all-time best!`,
                icon: 'flash',
            });
        }
    }

    return insights;
}

/**
 * VOLUME SPIKE
 * Compares this week's TOTAL volume vs the average of previous weeks.
 * Uses overall volume (not per-exercise) for a broader signal.
 */
function detectVolumeSpike(sessions: WorkoutSession[]): Insight[] {
    const now = new Date();
    const dayOfWeek = now.getDay() === 0 ? 6 : now.getDay() - 1; // Mon=0

    // This week's volume
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - dayOfWeek);
    weekStart.setHours(0, 0, 0, 0);

    let thisWeekVol = 0;
    const weeklyVolumes: number[] = []; // Past 4 weeks

    for (const s of sessions) {
        const d = new Date(s.startTime);
        if (d >= weekStart) {
            thisWeekVol += s.volumeKg;
        }
    }

    // Past 4 weeks' volumes
    for (let w = 1; w <= 4; w++) {
        const wStart = new Date(weekStart);
        wStart.setDate(wStart.getDate() - w * 7);
        const wEnd = new Date(wStart);
        wEnd.setDate(wEnd.getDate() + 7);

        let vol = 0;
        for (const s of sessions) {
            const d = new Date(s.startTime);
            if (d >= wStart && d < wEnd) {
                vol += s.volumeKg;
            }
        }
        if (vol > 0) weeklyVolumes.push(vol);
    }

    if (thisWeekVol === 0 || weeklyVolumes.length < 1) return [];

    const avg = weeklyVolumes.reduce((a, b) => a + b, 0) / weeklyVolumes.length;
    if (avg === 0) return [];

    const increase = ((thisWeekVol - avg) / avg) * 100;

    if (increase >= 25) {
        return [{
            id: 'volume-total',
            type: 'volume_spike',
            severity: 'warning',
            title: 'Volume Spike',
            message: `This week's total volume (${(thisWeekVol / 1000).toFixed(1)}k kg) is ${Math.round(increase)}% above your recent average. Monitor recovery closely.`,
            icon: 'bar-chart',
        }];
    }

    return [];
}

/**
 * DELOAD SUGGESTION
 * Average RPE has exceeded target for 3+ consecutive workouts.
 */
function detectDeloadNeed(
    sessions: WorkoutSession[],
    targetRpe: number,
): Insight[] {
    const sorted = [...sessions]
        .filter((s) => s.averageRPE != null)
        .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

    if (sorted.length < 3) return [];

    let consecutive = 0;
    for (let i = sorted.length - 1; i >= 0; i--) {
        if (sorted[i].averageRPE! > targetRpe) {
            consecutive++;
        } else {
            break;
        }
    }

    if (consecutive >= 3) {
        return [{
            id: 'deload-general',
            type: 'deload',
            severity: 'warning',
            title: 'Deload Recommended',
            message: `Your average RPE has exceeded your target (RPE ${targetRpe}) for ${consecutive} consecutive workouts. A lighter week could help you recover and push harder after.`,
            icon: 'bed',
        }];
    }

    return [];
}

/**
 * CONSISTENCY
 * Positive reinforcement based on training frequency.
 */
function detectConsistency(sessions: WorkoutSession[]): Insight[] {
    // Sessions in the last 7 days
    const thisWeek = sessions.filter((s) => daysAgo(s.startTime) <= 7);
    if (thisWeek.length >= 4) {
        return [{
            id: 'consistency-strong',
            type: 'consistency',
            severity: 'success',
            title: 'Great Consistency',
            message: `${thisWeek.length} sessions this week — you're building serious momentum. Keep showing up.`,
            icon: 'checkmark-done',
        }];
    }

    // Training streak: how many of the last 4 weeks had 2+ sessions?
    let streakWeeks = 0;
    for (let w = 0; w < 4; w++) {
        const weekSessions = sessions.filter((s) => {
            const d = daysAgo(s.startTime);
            return d >= w * 7 && d < (w + 1) * 7;
        });
        if (weekSessions.length >= 2) {
            streakWeeks++;
        } else {
            break;
        }
    }

    if (streakWeeks >= 3) {
        return [{
            id: 'consistency-streak',
            type: 'consistency',
            severity: 'success',
            title: `${streakWeeks}-Week Streak`,
            message: `You've trained at least twice a week for ${streakWeeks} weeks straight. Consistency beats intensity every time.`,
            icon: 'ribbon',
        }];
    }

    return [];
}

/* ─────────────── main ─────────────── */

/**
 * Computes all training insights from workout history.
 * Pure function — no side effects, no network calls.
 */
export function computeInsights(
    sessions: WorkoutSession[],
    exerciseMap: Map<string, ExerciseMetadata>,
    targetRpe: number,
): Insight[] {
    if (sessions.length < 2) return [];

    const fatigue = detectFatigueTrend(sessions);
    const intensity = detectHighIntensity(sessions);
    const performance = detectPerformanceSpike(sessions, exerciseMap);
    const volume = detectVolumeSpike(sessions);
    const deload = detectDeloadNeed(sessions, targetRpe);
    const consistency = detectConsistency(sessions);

    const insights: Insight[] = [
        ...fatigue,
        ...intensity,
        ...performance,
        ...volume,
        ...deload,
        ...consistency,
    ];

    // Priority: warnings first, then success, then info
    const severityOrder: Record<InsightSeverity, number> = { warning: 0, success: 1, info: 2 };
    insights.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

    return insights.slice(0, 3);
}
