import { EquipmentType, ExerciseCategory, ExerciseMetadata, MuscleGroup, PersonalRecord, SpecificMuscle } from '../../types/exercise.types';
import db from './database';

interface ExerciseRow {
    id: string;
    name: string;
    primaryMuscleGroup: MuscleGroup;
    primaryMuscles: string; // JSON parsed
    secondaryMuscles: string | null; // JSON parsed
    equipment: EquipmentType;
    category: ExerciseCategory;
    isBilateral: number; // 0 or 1
    instructions: string | null;
    videoUrl: string | null;
    createdAt: string;
    updatedAt: string;
    isCustom: number; // 0 or 1
}

interface PersonalRecordRow {
    exerciseId: string;
    estimatedOneRepMax: number;
    maxWeightKg: number;
    repsAtMaxWeight: number;
    maxReps: number;
    weightAtMaxRepsKg: number;
    maxSessionVolumeKg: number;
    dateAchieved: string;
}

const mapRowToExercise = (row: ExerciseRow): ExerciseMetadata => ({
    id: row.id,
    name: row.name,
    primaryMuscleGroup: row.primaryMuscleGroup,
    primaryMuscles: JSON.parse(row.primaryMuscles) as SpecificMuscle[],
    secondaryMuscles: row.secondaryMuscles ? JSON.parse(row.secondaryMuscles) as SpecificMuscle[] : undefined,
    equipment: row.equipment,
    category: row.category,
    isBilateral: row.isBilateral === 1,
    instructions: row.instructions || undefined,
    videoUrl: row.videoUrl || undefined,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    isCustom: row.isCustom === 1
});

export const seedExercises = async (): Promise<void> => {
    const existing = await db.getFirstAsync<{ count: number }>(`SELECT COUNT(*) as count FROM exercises`);

    if (existing && existing.count > 0) return;

    const defaultExercises: ExerciseMetadata[] = [
        {
            id: 'b8d9f1c4-2a1d-4e5c-9c3f-8a6b2d1f0e4a',
            name: 'Barbell Bench Press',
            primaryMuscleGroup: 'CHEST',
            primaryMuscles: ['MIDDLE_CHEST'],
            secondaryMuscles: ['FRONT_DELTS', 'TRICEPS'],
            equipment: 'BARBELL',
            category: 'COMPOUND',
            isBilateral: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            isCustom: false
        },
        {
            id: 'd9e0f2d5-3b2e-5f6d-0d4g-9b7c3e2g1f5b',
            name: 'Barbell Squat',
            primaryMuscleGroup: 'LEGS',
            primaryMuscles: ['QUADS', 'GLUTES'],
            secondaryMuscles: ['HAMSTRINGS', 'LOWER_BACK', 'ABS'],
            equipment: 'BARBELL',
            category: 'COMPOUND',
            isBilateral: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            isCustom: false
        },
        {
            id: 'e0f1g3e6-4c3f-6g7e-1e5h-0c8d4f3h2g6c',
            name: 'Barbell Deadlift',
            primaryMuscleGroup: 'BACK',
            primaryMuscles: ['LOWER_BACK', 'GLUTES', 'HAMSTRINGS'],
            secondaryMuscles: ['TRAPS', 'FOREARMS', 'ABS'],
            equipment: 'BARBELL',
            category: 'COMPOUND',
            isBilateral: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            isCustom: false
        },
        // CHEST
        {
            id: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d',
            name: 'Dumbbell Bench Press',
            primaryMuscleGroup: 'CHEST',
            primaryMuscles: ['MIDDLE_CHEST'],
            secondaryMuscles: ['FRONT_DELTS', 'TRICEPS'],
            equipment: 'DUMBBELL',
            category: 'COMPOUND',
            isBilateral: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            isCustom: false
        },
        {
            id: 'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e',
            name: 'Incline Barbell Press',
            primaryMuscleGroup: 'CHEST',
            primaryMuscles: ['UPPER_CHEST'],
            secondaryMuscles: ['FRONT_DELTS', 'TRICEPS'],
            equipment: 'BARBELL',
            category: 'COMPOUND',
            isBilateral: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            isCustom: false
        },
        {
            id: 'c3d4e5f6-a7b8-4c9d-ae1f-2a3b4c5d6e7f',
            name: 'Cable Fly',
            primaryMuscleGroup: 'CHEST',
            primaryMuscles: ['MIDDLE_CHEST'],
            secondaryMuscles: ['LOWER_CHEST'],
            equipment: 'CABLE',
            category: 'ISOLATION',
            isBilateral: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            isCustom: false
        },
        // BACK
        {
            id: 'd4e5f6a7-b8c9-4d0e-8f2a-3b4c5d6e7f8a',
            name: 'Barbell Row',
            primaryMuscleGroup: 'BACK',
            primaryMuscles: ['LATS', 'RHOMBOIDS'],
            secondaryMuscles: ['BICEPS', 'REAR_DELTS'],
            equipment: 'BARBELL',
            category: 'COMPOUND',
            isBilateral: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            isCustom: false
        },
        {
            id: 'e5f6a7b8-c9d0-4e1f-aa3b-4c5d6e7f8a9b',
            name: 'Pull Up',
            primaryMuscleGroup: 'BACK',
            primaryMuscles: ['LATS'],
            secondaryMuscles: ['BICEPS', 'RHOMBOIDS'],
            equipment: 'BODYWEIGHT',
            category: 'COMPOUND',
            isBilateral: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            isCustom: false
        },
        {
            id: 'f6a7b8c9-d0e1-4f2a-bb4c-5d6e7f8a9b0c',
            name: 'Lat Pulldown',
            primaryMuscleGroup: 'BACK',
            primaryMuscles: ['LATS'],
            secondaryMuscles: ['BICEPS', 'TRAPS'],
            equipment: 'CABLE',
            category: 'COMPOUND',
            isBilateral: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            isCustom: false
        },
        {
            id: 'a7b8c9d0-e1f2-4a3b-8c5d-6e7f8a9b0c1d',
            name: 'Seated Cable Row',
            primaryMuscleGroup: 'BACK',
            primaryMuscles: ['RHOMBOIDS', 'LATS'],
            secondaryMuscles: ['BICEPS'],
            equipment: 'CABLE',
            category: 'COMPOUND',
            isBilateral: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            isCustom: false
        },
        // LEGS
        {
            id: 'b8c9d0e1-f2a3-4b4c-9d6e-7f8a9b0c1d2e',
            name: 'Romanian Deadlift',
            primaryMuscleGroup: 'LEGS',
            primaryMuscles: ['HAMSTRINGS', 'GLUTES'],
            secondaryMuscles: ['LOWER_BACK'],
            equipment: 'BARBELL',
            category: 'COMPOUND',
            isBilateral: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            isCustom: false
        },
        {
            id: 'c9d0e1f2-a3b4-4c5d-8e7f-8a9b0c1d2e3f',
            name: 'Leg Press',
            primaryMuscleGroup: 'LEGS',
            primaryMuscles: ['QUADS', 'GLUTES'],
            secondaryMuscles: ['HAMSTRINGS'],
            equipment: 'MACHINE',
            category: 'COMPOUND',
            isBilateral: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            isCustom: false
        },
        {
            id: 'd0e1f2a3-b4c5-4d6e-bf8a-9b0c1d2e3f4a',
            name: 'Bulgarian Split Squat',
            primaryMuscleGroup: 'LEGS',
            primaryMuscles: ['QUADS', 'GLUTES'],
            secondaryMuscles: ['HAMSTRINGS'],
            equipment: 'DUMBBELL',
            category: 'COMPOUND',
            isBilateral: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            isCustom: false
        },
        {
            id: 'e1f2a3b4-c5d6-4e7f-8a9b-0c1d2e3f4a5b',
            name: 'Leg Curl',
            primaryMuscleGroup: 'LEGS',
            primaryMuscles: ['HAMSTRINGS'],
            equipment: 'MACHINE',
            category: 'ISOLATION',
            isBilateral: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            isCustom: false
        },
        {
            id: 'f2a3b4c5-d6e7-4f8a-9b0c-1d2e3f4a5b6c',
            name: 'Leg Extension',
            primaryMuscleGroup: 'LEGS',
            primaryMuscles: ['QUADS'],
            equipment: 'MACHINE',
            category: 'ISOLATION',
            isBilateral: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            isCustom: false
        },
        {
            id: 'a3b4c5d6-e7f8-4a9b-ac1d-2e3f4a5b6c7d',
            name: 'Calf Raise',
            primaryMuscleGroup: 'LEGS',
            primaryMuscles: ['CALVES'],
            equipment: 'MACHINE',
            category: 'ISOLATION',
            isBilateral: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            isCustom: false
        },
        // SHOULDERS
        {
            id: 'b4c5d6e7-f8a9-4b0c-8d2e-3f4a5b6c7d8e',
            name: 'Overhead Press',
            primaryMuscleGroup: 'SHOULDERS',
            primaryMuscles: ['FRONT_DELTS', 'SIDE_DELTS'],
            secondaryMuscles: ['TRICEPS', 'TRAPS'],
            equipment: 'BARBELL',
            category: 'COMPOUND',
            isBilateral: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            isCustom: false
        },
        {
            id: 'c5d6e7f8-a9b0-4c1d-ae3f-4a5b6c7d8e9f',
            name: 'Dumbbell Shoulder Press',
            primaryMuscleGroup: 'SHOULDERS',
            primaryMuscles: ['FRONT_DELTS', 'SIDE_DELTS'],
            secondaryMuscles: ['TRICEPS'],
            equipment: 'DUMBBELL',
            category: 'COMPOUND',
            isBilateral: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            isCustom: false
        },
        {
            id: 'd6e7f8a9-b0c1-4d2e-bf4a-5b6c7d8e9f0a',
            name: 'Lateral Raise',
            primaryMuscleGroup: 'SHOULDERS',
            primaryMuscles: ['SIDE_DELTS'],
            equipment: 'DUMBBELL',
            category: 'ISOLATION',
            isBilateral: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            isCustom: false
        },
        {
            id: 'e7f8a9b0-c1d2-4e3f-8a5b-6c7d8e9f0a1b',
            name: 'Face Pull',
            primaryMuscleGroup: 'SHOULDERS',
            primaryMuscles: ['REAR_DELTS'],
            secondaryMuscles: ['RHOMBOIDS'],
            equipment: 'CABLE',
            category: 'ISOLATION',
            isBilateral: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            isCustom: false
        },
        // ARMS
        {
            id: 'f8a9b0c1-d2e3-4f4a-9b6c-7d8e9f0a1b2c',
            name: 'Barbell Curl',
            primaryMuscleGroup: 'ARMS',
            primaryMuscles: ['BICEPS'],
            secondaryMuscles: ['FOREARMS'],
            equipment: 'BARBELL',
            category: 'ISOLATION',
            isBilateral: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            isCustom: false
        },
        {
            id: 'a9b0c1d2-e3f4-4a5b-8c7d-8e9f0a1b2c3d',
            name: 'Dumbbell Curl',
            primaryMuscleGroup: 'ARMS',
            primaryMuscles: ['BICEPS'],
            secondaryMuscles: ['FOREARMS'],
            equipment: 'DUMBBELL',
            category: 'ISOLATION',
            isBilateral: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            isCustom: false
        },
        {
            id: 'b0c1d2e3-f4a5-4b6c-8d8e-9f0a1b2c3d4e',
            name: 'Tricep Pushdown',
            primaryMuscleGroup: 'ARMS',
            primaryMuscles: ['TRICEPS'],
            equipment: 'CABLE',
            category: 'ISOLATION',
            isBilateral: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            isCustom: false
        },
        {
            id: 'c1d2e3f4-a5b6-4c7d-8e9f-0a1b2c3d4e5f',
            name: 'Skull Crusher',
            primaryMuscleGroup: 'ARMS',
            primaryMuscles: ['TRICEPS'],
            secondaryMuscles: ['FOREARMS'],
            equipment: 'BARBELL',
            category: 'ISOLATION',
            isBilateral: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            isCustom: false
        },
        {
            id: 'd2e3f4a5-b6c7-4d8e-9f0a-1b2c3d4e5f6a',
            name: 'Hammer Curl',
            primaryMuscleGroup: 'ARMS',
            primaryMuscles: ['BICEPS'],
            secondaryMuscles: ['FOREARMS'],
            equipment: 'DUMBBELL',
            category: 'ISOLATION',
            isBilateral: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            isCustom: false
        },
        // CORE
        {
            id: 'e3f4a5b6-c7d8-4e9f-aa1b-2c3d4e5f6a7b',
            name: 'Plank',
            primaryMuscleGroup: 'CORE',
            primaryMuscles: ['ABS'],
            secondaryMuscles: ['OBLIQUES'],
            equipment: 'BODYWEIGHT',
            category: 'ISOLATION',
            isBilateral: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            isCustom: false
        },
        {
            id: 'f4a5b6c7-d8e9-4f0a-8b2c-3d4e5f6a7b8c',
            name: 'Cable Crunch',
            primaryMuscleGroup: 'CORE',
            primaryMuscles: ['ABS'],
            equipment: 'CABLE',
            category: 'ISOLATION',
            isBilateral: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            isCustom: false
        },
        {
            id: 'a5b6c7d8-e9f0-4a1b-ac3d-4e5f6a7b8c9d',
            name: 'Ab Wheel Rollout',
            primaryMuscleGroup: 'CORE',
            primaryMuscles: ['ABS'],
            secondaryMuscles: ['OBLIQUES'],
            equipment: 'BODYWEIGHT',
            category: 'ISOLATION',
            isBilateral: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            isCustom: false
        }
    ];

    for (const ex of defaultExercises) {
        await db.runAsync(
            `INSERT INTO exercises (id, name, primaryMuscleGroup, primaryMuscles, secondaryMuscles, equipment, category, isBilateral, instructions, videoUrl, createdAt, updatedAt, isCustom)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                ex.id,
                ex.name,
                ex.primaryMuscleGroup,
                JSON.stringify(ex.primaryMuscles),
                ex.secondaryMuscles ? JSON.stringify(ex.secondaryMuscles) : null,
                ex.equipment,
                ex.category,
                ex.isBilateral ? 1 : 0,
                ex.instructions || null,
                ex.videoUrl || null,
                ex.createdAt,
                ex.updatedAt,
                ex.isCustom ? 1 : 0
            ]
        );
    }
};

export const getAllExercises = async (): Promise<ExerciseMetadata[]> => {
    const rows = await db.getAllAsync<ExerciseRow>(`SELECT * FROM exercises ORDER BY name ASC`);
    return rows.map(mapRowToExercise);
};

export const getExerciseById = async (id: string): Promise<ExerciseMetadata | null> => {
    const row = await db.getFirstAsync<ExerciseRow>(`SELECT * FROM exercises WHERE id = ?`, [id]);
    if (!row) return null;
    return mapRowToExercise(row);
};

export const searchExercises = async (filters: { name?: string; muscleGroup?: MuscleGroup; equipment?: EquipmentType }): Promise<ExerciseMetadata[]> => {
    let query = `SELECT * FROM exercises WHERE 1=1`;
    const params: (string | number)[] = [];

    if (filters.name) {
        query += ` AND name LIKE ?`;
        params.push(`%${filters.name}%`);
    }

    if (filters.muscleGroup) {
        query += ` AND primaryMuscleGroup = ?`;
        params.push(filters.muscleGroup);
    }

    if (filters.equipment) {
        query += ` AND equipment = ?`;
        params.push(filters.equipment);
    }

    query += ` ORDER BY name ASC`;

    const rows = await db.getAllAsync<ExerciseRow>(query, params);
    return rows.map(mapRowToExercise);
};

export const saveCustomExercise = async (exercise: ExerciseMetadata): Promise<void> => {
    await db.runAsync(
        `INSERT INTO exercises (id, name, primaryMuscleGroup, primaryMuscles, secondaryMuscles, equipment, category, isBilateral, instructions, videoUrl, createdAt, updatedAt, isCustom)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
            exercise.id,
            exercise.name,
            exercise.primaryMuscleGroup,
            JSON.stringify(exercise.primaryMuscles),
            exercise.secondaryMuscles ? JSON.stringify(exercise.secondaryMuscles) : null,
            exercise.equipment,
            exercise.category,
            exercise.isBilateral ? 1 : 0,
            exercise.instructions || null,
            exercise.videoUrl || null,
            exercise.createdAt,
            exercise.updatedAt,
            1 // isCustom should always be 1 for user-created ones
        ]
    );
};

export const getPersonalRecord = async (exerciseId: string): Promise<PersonalRecord | null> => {
    const row = await db.getFirstAsync<PersonalRecordRow>(
        `SELECT * FROM personal_records WHERE exerciseId = ?`,
        [exerciseId]
    );

    if (!row) return null;

    return {
        exerciseId: row.exerciseId,
        estimatedOneRepMax: row.estimatedOneRepMax,
        maxWeightKg: row.maxWeightKg,
        repsAtMaxWeight: row.repsAtMaxWeight,
        maxReps: row.maxReps,
        weightAtMaxRepsKg: row.weightAtMaxRepsKg,
        maxSessionVolumeKg: row.maxSessionVolumeKg,
        dateAchieved: row.dateAchieved
    };
};

export const upsertPersonalRecord = async (pr: PersonalRecord): Promise<void> => {
    await db.runAsync(
        `INSERT INTO personal_records (exerciseId, estimatedOneRepMax, maxWeightKg, repsAtMaxWeight, maxReps, weightAtMaxRepsKg, maxSessionVolumeKg, dateAchieved)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT(exerciseId) DO UPDATE SET
            estimatedOneRepMax = excluded.estimatedOneRepMax,
            maxWeightKg = excluded.maxWeightKg,
            repsAtMaxWeight = excluded.repsAtMaxWeight,
            maxReps = excluded.maxReps,
            weightAtMaxRepsKg = excluded.weightAtMaxRepsKg,
            maxSessionVolumeKg = excluded.maxSessionVolumeKg,
            dateAchieved = excluded.dateAchieved`,
        [
            pr.exerciseId,
            pr.estimatedOneRepMax,
            pr.maxWeightKg,
            pr.repsAtMaxWeight,
            pr.maxReps,
            pr.weightAtMaxRepsKg,
            pr.maxSessionVolumeKg,
            pr.dateAchieved
        ]
    );
};
