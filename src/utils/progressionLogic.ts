import { ExerciseLog, RPEScale, WorkoutSession } from '../types/workout.types';
import { estimateWeightFromRPE } from './rpeCalculator';

/**
 * Sweeps the workout history array backwards to find the most recent
 * valid and completed session that contains the requested exercise.
 */
export const getLastCompletedSession = (
    history: WorkoutSession[],
    exerciseId: string
): ExerciseLog | null => {
    // History is expected to be sorted DESC by startTime, but we iterate just to be safe
    for (const session of history) {
        // Only look at completed sessions (has an endTime)
        if (session.endTime) {
            const foundLog = session.logs.find(log => log.exerciseId === exerciseId);

            // Validate the log actually has completed workings sets
            if (foundLog && foundLog.sets.some(s => s.isCompleted && s.setType === 'WORKING')) {
                return foundLog;
            }
        }
    }

    return null;
};

/**
 * Analyzes the last time a lifter performed an exercise and outputs a simple scalar suggestion
 * for today's session based on their demonstrated RPE.
 */
export const calculateProgressionSuggestion = (
    history: WorkoutSession[],
    exerciseId: string,
    targetRpe: RPEScale | number,
    idealRepsMin: number,
    idealRepsMax: number
): { suggestedWeightKg: number; rationale: string; suggestedRepsMin: number; suggestedRepsMax: number } | null => {

    const targetReps = Math.round((idealRepsMin + idealRepsMax) / 2);

    const lastLog = getLastCompletedSession(history, exerciseId);
    if (!lastLog) return null;

    const workingSets = lastLog.sets.filter(s => s.isCompleted && s.setType === 'WORKING');
    if (workingSets.length === 0) return null;

    // Calculate the average RPE and Weight across all working sets in that log
    let totalRpe = 0;
    let rpeCount = 0;
    let totalWeight = 0;

    for (const set of workingSets) {
        if (set.rpe) {
            totalRpe += set.rpe;
            rpeCount++;
        }
        totalWeight += set.weightKg;
    }

    if (rpeCount === 0) return null; // No RPE data to base progression on

    const avgRpe = totalRpe / rpeCount;
    const avgWeight = totalWeight / workingSets.length;

    // We'll use the average reps performed to plug into our Epley estimator
    const avgReps = workingSets.reduce((sum, set) => sum + set.reps, 0) / workingSets.length;

    const estimatorPrediction = estimateWeightFromRPE(
        avgWeight,
        avgReps,
        avgRpe,
        targetRpe,
        targetReps
    );

    // Ensure we step in standard 2.5kg plate increments
    const roundedPrediction = Math.round(estimatorPrediction / 2.5) * 2.5;

    // Rule-based Stub Rationale
    if (avgRpe < 7) {
        return {
            suggestedWeightKg: roundedPrediction > avgWeight
                ? roundedPrediction
                : avgWeight + 2.5,
            rationale: `Last time your RPE was very low (${avgRpe.toFixed(1)}). Bumping weight up.`,
            suggestedRepsMin: idealRepsMin,
            suggestedRepsMax: idealRepsMax,
        };
    } else if (avgRpe >= 7 && avgRpe <= 8) {
        return {
            suggestedWeightKg: roundedPrediction,
            rationale: `Last time was the sweet spot (RPE ${avgRpe.toFixed(1)}). Adjusted for your target RPE.`,
            suggestedRepsMin: idealRepsMin,
            suggestedRepsMax: idealRepsMax,
        };
    } else {
        return {
            suggestedWeightKg: roundedPrediction,
            rationale: `Last time was brutal (RPE ${avgRpe.toFixed(1)}). Adjusted for your target RPE.`,
            suggestedRepsMin: idealRepsMin,
            suggestedRepsMax: idealRepsMax,
        };
    }

};
