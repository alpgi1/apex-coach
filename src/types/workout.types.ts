import { MuscleGroup } from './exercise.types';

/**
 * RPE (Rate of Perceived Exertion) Scale.
 * Used for auto-regulation and calculating progressive overload suggestions.
 * 10: Absolute maximum effort, zero reps in reserve (RIR).
 * 9.5: No more reps, could maybe do a little more weight.
 * 9: One definite rep in reserve.
 * 8: Two reps in reserve.
 * 7: Three reps in reserve.
 * 5-6: Warmup territory.
 */
export type RPEScale = 1 | 2 | 3 | 4 | 5 | 5.5 | 6 | 6.5 | 7 | 7.5 | 8 | 8.5 | 9 | 9.5 | 10;

/**
 * Defines the purpose of a particular set.
 */
export type SetType =
    | 'WARMUP'   // Acclimatization sets, not counted toward working volume
    | 'WORKING'  // Primary muscle-building sets
    | 'DROP'     // Immediate lighter-weight set performed after failure/near-failure
    | 'FAILURE'; // A set taken past technical breakdown to absolute mechanical failure

/**
 * A single attempt of a given weight for a number of repetitions.
 */
export interface WorkoutSet {
    id: string;              // UUID for local/remote sync
    setNumber: number;       // The sequential order of the set within the exercise log (1, 2, 3...)
    weightKg: number;        // Weight lifted. Conversion to LBS handled strictly on the UI layer.
    reps: number;
    rpe?: RPEScale;          // Nullable in case the user forgets or for warmups
    setType: SetType;
    restDurationSeconds?: number; // How long user rested *after* this set
    isCompleted: boolean;    // True if checked off during the active workout session
}

/**
 * A collection of sets for one specific exercise within a single workout session.
 * e.g., "The Bench Press portion of today's workout".
 */
export interface ExerciseLog {
    id: string;              // UUID
    exerciseId: string;      // Foreign key to ExerciseMetadata
    order: number;           // Defines the order this exercise was performed in the session
    sets: WorkoutSet[];      // The nested array of sets performed
    notes?: string;          // E.g., "Felt a pinch in left shoulder"
}

/**
 * The master container representing a single visit to the gym.
 */
export interface WorkoutSession {
    id: string;              // UUID
    name: string;            // User-defined or auto-generated name (e.g., "Heavy Push Day")
    startTime: string;       // ISO 8601 string
    endTime: string | null;  // Null if the workout is currently active
    volumeKg: number;        // Automatically aggregated sum of (weight * reps) for all WORKING sets
    logs: ExerciseLog[];     // Array of exercises performed
    bodyweightKg?: number;   // Optional context, weight of user on this day
    notes?: string;
    averageRPE: number | null;
}

/**
 * A pre-defined structure for an Exercise inside a Template. 
 * Represents the "Goal" rather than the "Actual" output.
 */
export interface TemplateExercise {
    id: string;              // UUID specific to this template item requirement
    exerciseId: string;      // Foreign key to ExerciseMetadata
    order: number;
    targetSets: number;      // e.g., 3 sets
    targetRepsMin: number;   // 8
    targetRepsMax?: number;  // 12 — null ise sabit rep (sadece "5")
    targetRpe?: RPEScale;    // Optional preset intensity goal
    restTargetSeconds?: number;
    targetWeightKg?: number; // Optional pre-fill weight for all sets
}

/**
 * A blueprint for future workouts. Can be instantiated to create a new WorkoutSession.
 */
export interface WorkoutTemplate {
    id: string;              // UUID
    name: string;            // e.g., "Full Body A"
    description?: string;
    exercises: TemplateExercise[];
    primaryMuscleGroups: MuscleGroup[]; // Auto-derived based on the exercises inside
    createdAt: string;       // ISO 8601 string
    updatedAt: string;       // ISO 8601 string
}

export interface ExerciseHistoryEntry {
    sessionId: string;
    date: string;
    weightKg: number;
    reps: number;
    rpe: number;
}