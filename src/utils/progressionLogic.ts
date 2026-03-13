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
    targetReps: number
): { suggestedWeightKg: number; rationale: string } | null => {

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
            suggestedWeightKg: roundedPrediction > avgWeight ? roundedPrediction : avgWeight + 2.5,
            rationale: `Last time your RPE was very low (${avgRpe.toFixed(1)}). You should comfortably bump the weight up.`
        };
    } else if (avgRpe >= 7 && avgRpe <= 8) {
        return {
            suggestedWeightKg: Math.round(avgWeight / 2.5) * 2.5, // Keep the same weight, snapped to 2.5kg plates
            rationale: `Last time was the sweet spot (RPE ${avgRpe.toFixed(1)}). Keep the same weight and focus on form.`
        };
    } else {
        return {
            suggestedWeightKg: Math.round(avgWeight / 2.5) * 2.5,
            rationale: `Last time was brutal (RPE ${avgRpe.toFixed(1)}). Keep the weight the same but be prepared to drop reps if needed.`
        };
    }
};
