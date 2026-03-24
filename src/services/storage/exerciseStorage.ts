import { EquipmentType, ExerciseCategory, ExerciseMetadata, MuscleGroup, PersonalRecord, SpecificMuscle } from '../../types/exercise.types';
import db from './database';
import { DEFAULT_EXERCISES, EXPECTED_SEED_COUNT } from './defaultExercises';

interface ExerciseRow {
    id: string;
    name: string;
    primaryMuscleGroup: MuscleGroup;
    primaryMuscles: string; // JSON parsed
    secondaryMuscles: string | null; // JSON parsed
    equipment: EquipmentType;
    category: ExerciseCategory;
    idealRepsMin: number;
    idealRepsMax: number;
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
    idealRepsMin: row.idealRepsMin,
    idealRepsMax: row.idealRepsMax,
    isBilateral: row.isBilateral === 1,
    instructions: row.instructions || undefined,
    videoUrl: row.videoUrl || undefined,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    isCustom: row.isCustom === 1
});

export const seedExercises = async (): Promise<void> => {
    const existing = await db.getFirstAsync<{ count: number }>(
        `SELECT COUNT(*) as count FROM exercises WHERE isCustom = 0`
    );
    if (existing && existing.count >= EXPECTED_SEED_COUNT) return;

    const now = new Date().toISOString();
    for (const ex of DEFAULT_EXERCISES) {
        await db.runAsync(
            `INSERT OR IGNORE INTO exercises (id, name, primaryMuscleGroup, primaryMuscles, secondaryMuscles, equipment, category, idealRepsMin, idealRepsMax, isBilateral, instructions, videoUrl, createdAt, updatedAt, isCustom)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                ex.id,
                ex.name,
                ex.primaryMuscleGroup,
                JSON.stringify(ex.primaryMuscles),
                ex.secondaryMuscles ? JSON.stringify(ex.secondaryMuscles) : null,
                ex.equipment,
                ex.category,
                ex.idealRepsMin,
                ex.idealRepsMax,
                ex.isBilateral ? 1 : 0,
                null,
                null,
                now,
                now,
                0,
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
        `INSERT INTO exercises (id, name, primaryMuscleGroup, primaryMuscles, secondaryMuscles, equipment, category, idealRepsMin, idealRepsMax, isBilateral, instructions, videoUrl, createdAt, updatedAt, isCustom)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
            exercise.id,
            exercise.name,
            exercise.primaryMuscleGroup,
            JSON.stringify(exercise.primaryMuscles),
            exercise.secondaryMuscles ? JSON.stringify(exercise.secondaryMuscles) : null,
            exercise.equipment,
            exercise.category,
            exercise.idealRepsMin,
            exercise.idealRepsMax,
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
