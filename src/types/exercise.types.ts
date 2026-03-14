/**
 * Core Muscle Groups. Used for high-level volume tracking and fatigue management.
 */
export type MuscleGroup =
    | 'CHEST'
    | 'BACK'
    | 'LEGS'
    | 'SHOULDERS'
    | 'ARMS'
    | 'CORE'
    | 'FULL_BODY';

/**
 * Specific Muscles. Used for detailed targeting and precise volume distribution.
 * These map directly to one or more primary `MuscleGroup`.
 */
export type SpecificMuscle =
    // Chest
    | 'UPPER_CHEST'
    | 'MIDDLE_CHEST'
    | 'LOWER_CHEST'
    // Back
    | 'LATS'
    | 'RHOMBOIDS'
    | 'TRAPS'
    | 'LOWER_BACK'
    // Legs
    | 'QUADS'
    | 'HAMSTRINGS'
    | 'GLUTES'
    | 'CALVES'
    | 'HIP_FLEXORS'
    // Shoulders
    | 'FRONT_DELTS'
    | 'SIDE_DELTS'
    | 'REAR_DELTS'
    // Arms
    | 'BICEPS'
    | 'TRICEPS'
    | 'FOREARMS'
    // Core
    | 'ABS'
    | 'OBLIQUES';

/**
 * Exercise Equipment Categories. Used to filter exercises based on gym availability.
 */
export type EquipmentType =
    | 'BARBELL'
    | 'DUMBBELL'
    | 'KETTLEBELL'
    | 'MACHINE'
    | 'CABLE'
    | 'BODYWEIGHT'
    | 'SMITH_MACHINE'
    | 'OTHER';

/**
 * Exercise Classification. Helps the algorithm suggest proper progression models.
 * (Compound movements might progress differently than isolations).
 */
export type ExerciseCategory =
    | 'COMPOUND'
    | 'ISOLATION'
    | 'ACCESSORY';

/**
 * The core "Exercise" contract.
 * Represents a static definition of a lift (e.g. "Barbell Bench Press", "Dumbbell Lunge").
 * This matches the exact DTO the Spring Boot backend will expect.
 */
export interface ExerciseMetadata {
    /** UUID - serves as primary key locally and matches the remote DB */
    id: string;
    /** Full, normalized name of the exercise */
    name: string;
    /** High-level muscle group targeted (e.g., 'CHEST') */
    primaryMuscleGroup: MuscleGroup;
    /** Detailed list of the precise muscles doing the main work */
    primaryMuscles: SpecificMuscle[];
    /** Detailed list of muscles acting as stabilizers or secondary movers */
    secondaryMuscles?: SpecificMuscle[];
    /** Required equipment to perform the lift */
    equipment: EquipmentType;
    category: ExerciseCategory;
    idealRepsMin: number;
    idealRepsMax: number;
    /** True if the lift moves both limbs together symmetrically (e.g., barbell squats).
     *  False if it's independent/unilateral (e.g., dumbbell lunges). */
    isBilateral: boolean;
    /** Markdown or raw text instructions on how to perform the lift */
    instructions?: string;
    /** Link to an external video demonstration */
    videoUrl?: string;
    /** ISO 8601 string */
    createdAt: string;
    /** ISO 8601 string */
    updatedAt: string;
    /** Flag to determine if this was a built-in seed exercise or one the user created */
    isCustom: boolean;
}

/**
 * Tracks the historical peaks for a specific lift. 
 * This lets the system (and the user) easily see their all-time bests without 
 * having to query and aggregate every single workout session log.
 */
export interface PersonalRecord {
    /** Foreign key pointing to `ExerciseMetadata.id` */
    exerciseId: string;

    /** 
     * Calculated 1 Rep Max. 
     * This is computed using a formula (like Epley or Brzycki) 
     * to estimate absolute strength regardless of the rep range performed. 
     */
    estimatedOneRepMax: number;

    /** The absolute highest weight lifted for this exercise */
    maxWeightKg: number;
    /** How many reps were completed at `maxWeightKg` */
    repsAtMaxWeight: number;

    /** The absolute highest reps achieved in a single set */
    maxReps: number;
    /** The weight used when achieving `maxReps` */
    weightAtMaxRepsKg: number;

    /** The single heaviest volume (sets * reps * weight) performed in ONE session */
    maxSessionVolumeKg: number;

    /** ISO 8601 string denoting when this PR snapshot was achieved */
    dateAchieved: string;
}
