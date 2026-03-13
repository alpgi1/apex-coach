import { RPEScale } from '../types/workout.types';

/**
 * Rounds a number to exactly 2 decimal places.
 */
const roundToTwo = (num: number): number => {
    return Math.round(num * 100) / 100;
};

/**
 * Calculates Estimated 1 Rep Max using the Epley formula: weight * (1 + reps/30).
 * This works best for rep ranges between 1 and 10.
 */
export const calculateEpley1RM = (weightKg: number, reps: number): number => {
    if (reps === 1) return roundToTwo(weightKg);
    return roundToTwo(weightKg * (1 + reps / 30));
};

/**
 * Inverses the Epley formula to estimate the target weight for a given rep scheme
 * based on the lifter's known 1 Rep Max.
 * Formula: 1RM / (1 + reps/30)
 */
export const estimateWeightForReps = (oneRepMax: number, targetReps: number): number => {
    if (targetReps === 1) return roundToTwo(oneRepMax);
    return roundToTwo(oneRepMax / (1 + targetReps / 30));
};

/**
 * Converts RPE (Rate of Perceived Exertion) to RIR (Reps in Reserve).
 * RIR = 10 - RPE (e.g. RPE 8 = 2 RIR)
 */
export const rpeToRIR = (rpe: RPEScale | number): number => {
    return roundToTwo(10 - rpe);
};

/**
 * Converts RIR (Reps in Reserve) to RPE (Rate of Perceived Exertion).
 * RPE = 10 - RIR
 */
export const rirToRpe = (rir: number): RPEScale | number => {
    return roundToTwo(10 - rir);
};

/**
 * Suggests the working weight for an upcoming set.
 * 
 * 1. Calculate how many total "theoretical" reps the lifter could have done on the last set:
 *    (Theoretical Max Reps = Actual Reps + Reps in Reserve)
 * 2. Calculate the "Actual" 1 Rep Max they demonstrated on that set.
 * 3. Calculate how many "theoretical" reps they need to perform on the target set:
 *    (Target Theoretical Reps = Target Reps + Target RIR)
 * 4. Inverse Epley backwards from that demonstrated 1 Rep Max using the total theoretical target reps.
 */
export const estimateWeightFromRPE = (
    currentWeightKg: number,
    currentReps: number,
    currentRpe: RPEScale | number,
    targetRpe: RPEScale | number,
    targetReps: number
): number => {
    // How many reps they COULD have done, total, before failure
    const currentRir = rpeToRIR(currentRpe);
    const theoreticalMaxRepsPerformed = currentReps + currentRir;

    // What their 1RM was during that exact specific lift
    const demonstrated1RM = calculateEpley1RM(currentWeightKg, theoreticalMaxRepsPerformed);

    // How many reps they NEED to theoretically be able to do before failure on the target set
    const targetRir = rpeToRIR(targetRpe);
    const targetTheoreticalMaxReps = targetReps + targetRir;

    // Work backwards from the 1RM to find the weight that causes failure at `targetTheoreticalMaxReps`
    return estimateWeightForReps(demonstrated1RM, targetTheoreticalMaxReps);
};
